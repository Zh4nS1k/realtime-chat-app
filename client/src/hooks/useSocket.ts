'use client';

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";
import { useChatStore, type Conversation, type ChatMessage } from "@/store/chat";

export function useSocket() {
  const { token } = useAuthStore();
  const { addMessage, upsertConversation } = useChatStore();
  const socketRef = useRef<Socket | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const start = async () => {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
        path: process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
        auth: { token },
      });

      socketRef.current = socket;
      setSocketInstance(socket);

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));

      socket.on("message:new", (message: ChatMessage) => {
        addMessage(message.conversationId, message);
      });

      socket.on("conversation:new", (conversation: Conversation) => {
        upsertConversation(conversation);
      });

      socket.on("conversation:activity", (payload: { conversationId: string; lastMessage: ChatMessage }) => {
        const exists = useChatStore.getState().conversations.some((c) => c._id === payload.conversationId);
        if (!exists) return;
        upsertConversation({
          _id: payload.conversationId,
          type: "dm",
          participants: [],
          lastMessage: payload.lastMessage,
          updatedAt: payload.lastMessage.createdAt,
        });
      });
    };

    start();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setSocketInstance(null);
    };
  }, [token, addMessage, upsertConversation]);

  return { socket: socketInstance, connected };
}
