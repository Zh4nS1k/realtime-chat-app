'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { UploadButton } from "@uploadthing/react";
import { useAuthStore, type AuthUser } from "@/store/auth";
import { useChatStore, type ChatMessage, type Conversation } from "@/store/chat";
import { useSocket } from "@/hooks/useSocket";
import {
  createGroup,
  fetchConversations,
  fetchMessages,
  fetchProfile,
  fetchUsers,
  sendMessage,
  startDm,
} from "@/lib/actions";
import type { ChatFileRouter } from "@/app/api/uploadthing/core";

dayjs.extend(relativeTime);

export default function Home() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { user, token, isHydrated, hydrate, setUser, logout } = useAuthStore();
  const { socket, connected } = useSocket();
  const { conversations, messages, activeConversationId, setActiveConversation, setConversations, setMessages } =
    useChatStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AuthUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isHydrated) return;
      if (!token) {
        router.push("/login");
        setLoading(false);
        return;
      }
      try {
        if (!user) {
          const profile = await fetchProfile();
          setUser(profile);
        }
        const convoList = await fetchConversations();
        setConversations(convoList);
        if (!activeConversationId && convoList.length) {
          setActiveConversation(convoList[0]._id);
        }
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить данные. Проверь соединение с сервером.");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [isHydrated, token, router, user, setUser, setConversations, activeConversationId, setActiveConversation]);

  useEffect(() => {
    if (!activeConversationId || messages[activeConversationId]) return;
    const loadMessages = async () => {
      try {
        setFetchingMessages(true);
        const data = await fetchMessages(activeConversationId);
        setMessages(activeConversationId, data);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить сообщения.");
      } finally {
        setFetchingMessages(false);
      }
    };
    loadMessages();
  }, [activeConversationId, setMessages, messages]);

  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit("join-conversation", activeConversationId);
    }
  }, [socket, activeConversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversationId]);

  const handleSearch = async () => {
    try {
      const users = await fetchUsers(searchTerm);
      setSearchResults(users);
    } catch (err) {
      console.error(err);
      setError("Ошибка при поиске пользователей");
    }
  };

  const handleStartDm = async (userId: string) => {
    try {
      const conversation = await startDm(userId);
      setActiveConversation(conversation._id);
      setConversations([conversation, ...conversations.filter((c) => c._id !== conversation._id)]);
    } catch (err) {
      console.error(err);
      setError("Не удалось создать диалог");
    }
  };

  const toggleGroupParticipant = (id: string) => {
    setGroupParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Введите название группы");
      return;
    }
    if (groupParticipants.length < 2) {
      setError("Добавьте минимум двух участников (итого 3 с вами)");
      return;
    }

    try {
      const conversation = await createGroup({ name: groupName.trim(), participantIds: groupParticipants });
      setConversations([conversation, ...conversations.filter((c) => c._id !== conversation._id)]);
      setActiveConversation(conversation._id);
      setGroupName("");
      setGroupParticipants([]);
    } catch (err) {
      console.error(err);
      setError("Не удалось создать группу");
    }
  };

  const activeConversation: Conversation | undefined = useMemo(
    () => conversations.find((c) => c._id === activeConversationId),
    [activeConversationId, conversations]
  );

  const currentMessages: ChatMessage[] = useMemo(() => {
    if (!activeConversationId) return [];
    return messages[activeConversationId] || [];
  }, [messages, activeConversationId]);

  const sendTextMessage = async (payload: { content?: string; imageUrl?: string }) => {
    if (!activeConversationId || sending) return;
    if (!payload.content && !payload.imageUrl) return;
    setSending(true);
    try {
      if (socket) {
        socket.emit("message:send", { conversationId: activeConversationId, ...payload });
      } else {
        const newMessage = await sendMessage({ conversationId: activeConversationId, ...payload });
        setMessages(activeConversationId, [...currentMessages, newMessage]);
      }
      setMessageText("");
    } catch (err) {
      console.error(err);
      setError("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white px-6 py-4 text-slate-700 shadow-md">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 p-6">
        <aside className="w-80 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div>
              <p className="text-xs uppercase text-slate-500">Вы вошли как</p>
              <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
            </div>
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Найти пользователя"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSearch}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Поиск
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{u.username}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartDm(u._id)}
                        className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        DM
                      </button>
                      <button
                        onClick={() => toggleGroupParticipant(u._id)}
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          groupParticipants.includes(u._id)
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {groupParticipants.includes(u._id) ? "В группе" : "Добавить"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-sm font-semibold text-slate-800">Новая группа</p>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Название"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-slate-500">Выбрано: {groupParticipants.length} участников</p>
              <button
                onClick={handleCreateGroup}
                className="mt-2 w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Создать
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Чаты</h3>
                <button onClick={logout} className="text-xs font-semibold text-rose-500 hover:text-rose-600">
                  Выйти
                </button>
              </div>
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => setActiveConversation(conversation._id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      activeConversationId === conversation._id
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-100 bg-white hover:border-emerald-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">
                        {conversation.type === "group"
                          ? conversation.name
                          : conversation.participants
                              .filter((p) => p._id !== user?._id)
                              .map((p) => p.username)
                              .join(", ")}
                      </p>
                      <span className="text-xs text-slate-500">
                        {conversation.lastMessage
                          ? dayjs(conversation.lastMessage.createdAt).fromNow()
                          : dayjs(conversation.updatedAt || conversation._id).fromNow()}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {conversation.lastMessage
                        ? `${conversation.lastMessage.sender.username}: ${conversation.lastMessage.content || "Изображение"}`
                        : "Нет сообщений"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex flex-1 flex-col rounded-2xl bg-white/90 shadow-sm ring-1 ring-slate-100 backdrop-blur">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {activeConversation.type === "group"
                      ? activeConversation.name
                      : activeConversation.participants
                          .filter((p) => p._id !== user?._id)
                          .map((p) => p.username)
                          .join(", ")}
                  </p>
                  <p className="text-sm text-slate-500">
                    Участники: {activeConversation.participants.map((p) => p.username).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {connected ? "online" : "offline"}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
                {fetchingMessages && <p className="text-sm text-slate-500">Загрузка сообщений...</p>}
                {currentMessages.map((message) => {
                  const fromMe = message.sender._id === user?._id;
                  return (
                    <div key={message._id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xl rounded-2xl px-4 py-3 shadow-sm ${
                          fromMe
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold">{message.sender.username}</span>
                          <span className={fromMe ? "text-emerald-50/80" : "text-slate-500"}>
                            {dayjs(message.createdAt).format("HH:mm")}
                          </span>
                        </div>
                        {message.content && <p className="mt-1 text-sm leading-relaxed">{message.content}</p>}
                        {message.imageUrl && (
                          <div className="relative mt-2 h-64 w-full max-w-md overflow-hidden rounded-lg border border-white/40">
                            <Image
                              src={message.imageUrl}
                              alt="uploaded"
                              fill
                              sizes="(max-width: 768px) 90vw, 320px"
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Сообщение"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendTextMessage({ content: messageText.trim() });
                      }
                    }}
                  />
                  <UploadButton<ChatFileRouter>
                    endpoint="chatImage"
                    content={{ button({ ready }) { return ready ? "📤" : "..." } }}
                    onClientUploadComplete={(res) => {
                      const url = res?.[0]?.url;
                      if (url) {
                        sendTextMessage({ imageUrl: url });
                      }
                    }}
                    onUploadError={(err) => setError(err.message)}
                  />
                  <button
                    onClick={() => sendTextMessage({ content: messageText.trim() })}
                    disabled={!messageText.trim() || sending}
                    className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-1 flex-col items-center justify-center p-12 text-center text-slate-500">
              <p className="text-lg font-semibold text-slate-800">Выберите чат или создайте новый</p>
              <p className="mt-2 text-sm">DM для личной переписки или группа минимум с тремя участниками.</p>
            </div>
          )}
        </section>
      </div>

      {error && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {error}
          <button className="ml-3 text-white/80" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
    </main>
  );
}
