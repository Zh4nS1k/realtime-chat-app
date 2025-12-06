import { create } from "zustand";
import type { AuthUser } from "./auth";

export type ChatMessage = {
  _id: string;
  conversationId: string;
  sender: AuthUser;
  content?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  status?: "sent" | "delivered" | "read";
  createdAt: string;
};

export type Conversation = {
  _id: string;
  type: "dm" | "group";
  name?: string;
  participants: AuthUser[];
  lastMessage: ChatMessage | null;
  updatedAt?: string;
  unread?: number;
};

type ChatState = {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeConversationId?: string;
  activeFilter: "all" | "dm" | "group";
  typing: Record<string, string[]>; // conversationId -> usernames typing
  setConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversationId: string) => void;
  setFilter: (filter: "all" | "dm" | "group") => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  addTyping: (conversationId: string, username: string) => void;
  removeTyping: (conversationId: string, username: string) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: ChatMessage["status"]) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  activeConversationId: undefined,
  activeFilter: "all",
  typing: {},
  setConversations: (conversations) =>
    set((state) => ({
      conversations: conversations.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      }),
      messages: state.messages,
    })),
  upsertConversation: (conversation) =>
    set((state) => {
      const existingIndex = state.conversations.findIndex((c) => c._id === conversation._id);
      let updated = [];
      if (existingIndex >= 0) {
        updated = [...state.conversations];
        updated[existingIndex] = { ...updated[existingIndex], ...conversation };
      } else {
        updated = [conversation, ...state.conversations];
      }
      updated = updated.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
      return { conversations: updated };
    }),
  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
  setFilter: (filter) => set({ activeFilter: filter }),
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const updatedMessages = [...existing, message];
      const conversations = state.conversations.map((conv) => {
        if (conv._id === conversationId) {
          const unread = conv._id === state.activeConversationId ? 0 : (conv.unread || 0) + 1;
          return { ...conv, lastMessage: message, updatedAt: message.createdAt, unread };
        }
        return conv;
      });
      const typing = { ...state.typing };
      delete typing[conversationId]; // clear typing on new message arrival
      return { messages: { ...state.messages, [conversationId]: updatedMessages }, conversations, typing };
    }),
  addTyping: (conversationId, username) =>
    set((state) => {
      const list = state.typing[conversationId] || [];
      if (list.includes(username)) return state;
      return { typing: { ...state.typing, [conversationId]: [...list, username] } };
    }),
  removeTyping: (conversationId, username) =>
    set((state) => {
      const list = state.typing[conversationId] || [];
      const next = list.filter((u) => u !== username);
      return { typing: { ...state.typing, [conversationId]: next } };
    }),
  updateMessageStatus: (conversationId, messageId, status) =>
    set((state) => {
      const msgs = state.messages[conversationId];
      if (!msgs) return state;
      const updatedMsgs = msgs.map((m) => (m._id === messageId ? { ...m, status } : m));
      const conversations = state.conversations.map((conv) =>
        conv._id === conversationId && conv.lastMessage?._id === messageId
          ? { ...conv, lastMessage: { ...conv.lastMessage, status } as ChatMessage }
          : conv
      );
      return { messages: { ...state.messages, [conversationId]: updatedMsgs }, conversations };
    }),
}));
