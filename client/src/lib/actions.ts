import { api } from "./api-client";
import type { AuthUser } from "@/store/auth";
import type { ChatMessage, Conversation } from "@/store/chat";

async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const { data } = await api.post("/graphql", { query, variables });
  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message || "GraphQL error");
  }
  return data.data as T;
}

export async function registerUser(payload: { email: string; username: string; password: string }) {
  const data = await gql<{ register: { user: AuthUser; token: string } }>(
    `
      mutation Register($email: String!, $username: String!, $password: String!) {
        register(email: $email, username: $username, password: $password) {
          user { _id email username createdAt }
          token
        }
      }
    `,
    payload
  );
  return data.register;
}

export async function loginUser(payload: { email: string; password: string }) {
  const data = await gql<{ login: { user: AuthUser; token: string } }>(
    `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          user { _id email username createdAt }
          token
        }
      }
    `,
    payload
  );
  return data.login;
}

export async function fetchProfile() {
  const data = await gql<{ me: AuthUser }>(
    `
      query Me {
        me { _id email username createdAt }
      }
    `
  );
  return data.me;
}

export async function fetchUsers(query: string) {
  const data = await gql<{ users: AuthUser[] }>(
    `
      query Users($q: String) {
        users(q: $q) { _id email username createdAt }
      }
    `,
    { q: query }
  );
  return data.users;
}

export async function fetchConversations() {
  const data = await gql<{ conversations: Conversation[] }>(
    `
      query Conversations {
        conversations {
          _id
          type
          name
          updatedAt
          participants { _id email username }
          lastMessage {
            _id
            content
            imageUrl
            createdAt
            sender { _id username email }
            conversationId
          }
        }
      }
    `
  );
  return data.conversations;
}

export async function startDm(userId: string) {
  const data = await gql<{ startDm: Conversation }>(
    `
      mutation StartDm($userId: ID!) {
        startDm(userId: $userId) {
          _id
          type
          name
          updatedAt
          participants { _id email username }
          lastMessage {
            _id
            content
            imageUrl
            createdAt
            sender { _id username email }
            conversationId
          }
        }
      }
    `,
    { userId }
  );
  return data.startDm;
}

export async function createGroup(payload: { name: string; participantIds: string[] }) {
  const data = await gql<{ createGroup: Conversation }>(
    `
      mutation CreateGroup($name: String!, $participantIds: [ID!]!) {
        createGroup(name: $name, participantIds: $participantIds) {
          _id
          type
          name
          updatedAt
          participants { _id email username }
          lastMessage {
            _id
            content
            imageUrl
            createdAt
            sender { _id username email }
            conversationId
          }
        }
      }
    `,
    payload
  );
  return data.createGroup;
}

export async function fetchMessages(conversationId: string) {
  const data = await gql<{ messages: ChatMessage[] }>(
    `
      query Messages($conversationId: ID!) {
        messages(conversationId: $conversationId) {
          _id
          conversationId
          content
          imageUrl
          createdAt
          sender { _id username email }
        }
      }
    `,
    { conversationId }
  );
  return data.messages;
}

export async function sendMessage(payload: { conversationId: string; content?: string; imageUrl?: string }) {
  const data = await gql<{ sendMessage: ChatMessage }>(
    `
      mutation SendMessage($conversationId: ID!, $content: String, $imageUrl: String) {
        sendMessage(conversationId: $conversationId, content: $content, imageUrl: $imageUrl) {
          _id
          conversationId
          content
          imageUrl
          createdAt
          sender { _id username email }
        }
      }
    `,
    payload
  );
  return data.sendMessage;
}
