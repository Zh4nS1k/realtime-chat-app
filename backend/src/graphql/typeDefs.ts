import { gql } from "graphql-tag";

export const typeDefs = gql`
  type User {
    _id: ID!
    email: String!
    username: String!
    createdAt: String
  }

  type Message {
    _id: ID!
    conversationId: ID!
    content: String
    imageUrl: String
    sender: User!
    createdAt: String
  }

  type Conversation {
    _id: ID!
    type: String!
    name: String
    participants: [User!]!
    lastMessage: Message
    updatedAt: String
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type Query {
    me: User
    users(q: String): [User!]!
    conversations: [Conversation!]!
    messages(conversationId: ID!): [Message!]!
  }

  type Mutation {
    register(email: String!, username: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    startDm(userId: ID!): Conversation!
    createGroup(name: String!, participantIds: [ID!]!): Conversation!
    sendMessage(conversationId: ID!, content: String, imageUrl: String): Message!
  }
`;
