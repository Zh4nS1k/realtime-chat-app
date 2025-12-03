import { api } from "./api-client";
import type { AuthUser } from "@/store/auth";
import type { ChatMessage, Conversation } from "@/store/chat";

export async function registerUser(payload: { email: string; username: string; password: string }) {
  const { data } = await api.post<{ user: AuthUser; token: string }>("/auth/register", payload);
  return data;
}

export async function loginUser(payload: { email: string; password: string }) {
  const { data } = await api.post<{ user: AuthUser; token: string }>("/auth/login", payload);
  return data;
}

export async function fetchProfile() {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function fetchUsers(query: string) {
  const { data } = await api.get<{ users: AuthUser[] }>("/users", { params: { q: query } });
  return data.users;
}

export async function fetchConversations() {
  const { data } = await api.get<{ conversations: Conversation[] }>("/conversations");
  return data.conversations;
}

export async function startDm(userId: string) {
  const { data } = await api.post<{ conversation: Conversation }>("/conversations/dm", { userId });
  return data.conversation;
}

export async function createGroup(payload: { name: string; participantIds: string[] }) {
  const { data } = await api.post<{ conversation: Conversation }>("/conversations/group", payload);
  return data.conversation;
}

export async function fetchMessages(conversationId: string) {
  const { data } = await api.get<{ messages: ChatMessage[] }>(`/messages/${conversationId}`);
  return data.messages;
}

export async function sendMessage(payload: { conversationId: string; content?: string; imageUrl?: string }) {
  const { data } = await api.post<{ message: ChatMessage }>("/messages", payload);
  return data.message;
}
