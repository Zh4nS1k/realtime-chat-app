import { create } from "zustand";
import type { AuthUser } from "./auth";

export type ChatMessage = {
  _id: string;
  conversationId: string;
  sender: AuthUser;
  content?: string;
  imageUrl?: string;
  createdAt: string;
};

export type Conversation = {
  _id: string;
  type: "dm" | "group";
  name?: string;
  participants: AuthUser[];
  lastMessage: ChatMessage | null;
  updatedAt?: string;
};

type ChatState = {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeConversationId?: string;
  setConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversationId: string) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  activeConversationId: undefined,
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
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const updatedMessages = [...existing, message];
      const conversations = state.conversations.map((conv) =>
        conv._id === conversationId ? { ...conv, lastMessage: message, updatedAt: message.createdAt } : conv
      );
      return { messages: { ...state.messages, [conversationId]: updatedMessages }, conversations };
    }),
}));
