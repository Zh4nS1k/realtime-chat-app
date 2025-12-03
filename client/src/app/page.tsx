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
import { useUiStore } from "@/store/ui";
import { ChatListSkeleton, MessagesSkeleton } from "@/components/skeletons";
import {
  createGroup,
  fetchConversations,
  fetchMessages,
  fetchProfile,
  fetchUsers,
  sendMessage,
  startDm,
  markConversationRead,
} from "@/lib/actions";
import type { ChatFileRouter } from "@/app/api/uploadthing/core";

const translations = {
  ru: {
    loading: "Загрузка...",
    loggedInAs: "Вы вошли как",
    online: "онлайн",
    offline: "офлайн",
    searchPlaceholder: "Найти пользователя",
    search: "Поиск",
    dm: "DM",
    add: "Добавить",
    inGroup: "В группе",
    newGroup: "Новая группа",
    groupName: "Название группы",
    selected: (count: number) => `Выбрано: ${count} участника`,
    create: "Создать",
    chats: "Чаты",
    logout: "Выйти",
    chooseChatTitle: "Выберите чат или создайте новый",
    chooseChatSubtitle: "DM для личной переписки или группа минимум с тремя участниками.",
    participants: "Участники",
    messagePlaceholder: "Сообщение",
    send: "Отправить",
    groupMustHaveName: "Введите название группы",
    groupMustHave3: "Добавьте минимум двух участников (итого 3 с вами)",
    errorLoad: "Не удалось загрузить данные. Проверь соединение с сервером.",
    errorMessages: "Не удалось загрузить сообщения.",
    errorSend: "Не удалось отправить сообщение",
    errorCreateDm: "Не удалось создать диалог",
    errorCreateGroup: "Не удалось создать группу",
    errorSearch: "Ошибка при поиске пользователей",
    status: "Статус",
    theme: "Тема",
    language: "Язык",
    light: "Светлая",
    dark: "Тёмная",
    ru: "Рус",
    en: "Eng",
  },
  en: {
    loading: "Loading...",
    loggedInAs: "Signed in as",
    online: "online",
    offline: "offline",
    searchPlaceholder: "Find a user",
    search: "Search",
    dm: "DM",
    add: "Add",
    inGroup: "In group",
    newGroup: "New group",
    groupName: "Group name",
    selected: (count: number) => `Selected: ${count} members`,
    create: "Create",
    chats: "Chats",
    logout: "Logout",
    chooseChatTitle: "Pick a chat or create one",
    chooseChatSubtitle: "DM for 1:1 or a group with at least 3 people.",
    participants: "Participants",
    messagePlaceholder: "Message",
    send: "Send",
    groupMustHaveName: "Please enter a group name",
    groupMustHave3: "Add at least two more members (3 total with you)",
    errorLoad: "Failed to load data. Check server connection.",
    errorMessages: "Failed to load messages.",
    errorSend: "Failed to send message",
    errorCreateDm: "Could not start DM",
    errorCreateGroup: "Could not create group",
    errorSearch: "User search failed",
    status: "Status",
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    ru: "Рус",
    en: "Eng",
  },
};

dayjs.extend(relativeTime);

export default function Home() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { user, token, isHydrated, hydrate, setUser, logout } = useAuthStore();
  const { socket, connected } = useSocket();
  const {
    conversations,
    messages,
    activeConversationId,
    activeFilter,
    setFilter,
    setActiveConversation,
    setConversations,
    setMessages,
    typing,
  } = useChatStore();
  const { theme, toggleTheme, language, setLanguage, hydrate: hydrateUi } = useUiStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AuthUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typingUsers = activeConversationId ? typing[activeConversationId] || [] : [];
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const copy = useMemo(() => translations[language], [language]);
  const colors = ["#2aabee", "#e17055", "#fdcb6e", "#a29bfe", "#00cec9", "#6c5ce7", "#636e72"];

  const avatarStyle = (name?: string) => {
    const letter = name?.[0]?.toUpperCase() || "T";
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return { letter, bg: colors[index] };
  };

  const filteredConversations = useMemo(() => {
    if (activeFilter === "dm") return conversations.filter((c) => c.type === "dm");
    if (activeFilter === "group") return conversations.filter((c) => c.type === "group");
    return conversations;
  }, [activeFilter, conversations]);

  useEffect(() => {
    hydrate();
    hydrateUi();
  }, [hydrate, hydrateUi]);

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
        setError(copy.errorLoad);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [isHydrated, token, router, user, setUser, setConversations, activeConversationId, setActiveConversation, copy.errorLoad]);

  useEffect(() => {
    if (!activeConversationId || messages[activeConversationId]) {
      if (activeConversationId) {
        markConversationRead(activeConversationId).catch(() => {});
      }
      return;
    }
    const loadMessages = async () => {
      try {
        setFetchingMessages(true);
        const data = await fetchMessages(activeConversationId);
        setMessages(activeConversationId, data);
        await markConversationRead(activeConversationId);
      } catch (err) {
        console.error(err);
        setError(copy.errorMessages);
      } finally {
        setFetchingMessages(false);
      }
    };
    loadMessages();
  }, [activeConversationId, setMessages, messages, copy.errorMessages]);

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
      setError(copy.errorSearch);
    }
  };

  const handleStartDm = async (userId: string) => {
    try {
      const conversation = await startDm(userId);
      setActiveConversation(conversation._id);
      setConversations([conversation, ...conversations.filter((c) => c._id !== conversation._id)]);
    } catch (err) {
      console.error(err);
      setError(copy.errorCreateDm);
    }
  };

  const toggleGroupParticipant = (id: string) => {
    setGroupParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError(copy.groupMustHaveName);
      return;
    }
    if (groupParticipants.length < 2) {
      setError(copy.groupMustHave3);
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
      setError(copy.errorCreateGroup);
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

  const emitTyping = (isTyping: boolean) => {
    if (!socket || !activeConversationId) return;
    socket.emit(isTyping ? "typing:start" : "typing:stop", { conversationId: activeConversationId });
  };

  const sendTextMessage = async (payload: { content?: string; imageUrl?: string }) => {
    if (!activeConversationId || sending) return;
    if (!payload.content && !payload.imageUrl) return;
    setSending(true);
    try {
      if (socket) {
        socket.emit("message:send", { conversationId: activeConversationId, ...payload });
        emitTyping(false);
      } else {
        const newMessage = await sendMessage({ conversationId: activeConversationId, ...payload });
        setMessages(activeConversationId, [...currentMessages, newMessage]);
      }
      setMessageText("");
      setPreviewImage(null);
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      setError(copy.errorSend);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white px-6 py-4 text-slate-700 shadow-md">{copy.loading}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl space-y-4 p-6">
        <div className="flex items-center justify-between rounded-2xl bg-[var(--card)]/95 px-5 py-3 shadow-sm ring-1 ring-[var(--border)]">
          <div className="flex items-center gap-3">
            <button
              className="mr-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)]/60 text-xl hover:bg-[var(--muted)] lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md"
              style={{ background: avatarStyle(user?.username).bg }}
            >
              {avatarStyle(user?.username).letter}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-[var(--foreground)]">Telegram</p>
              <p className="text-xs text-[var(--foreground)]/70">
                {copy.loggedInAs}: {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-1">
              <button
                onClick={() => setLanguage("ru")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  language === "ru" ? "bg-[var(--accent)] text-white" : "text-[var(--foreground)]/70"
                }`}
              >
                {copy.ru}
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  language === "en" ? "bg-[var(--accent)] text-white" : "text-[var(--foreground)]/70"
                }`}
              >
                {copy.en}
              </button>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]/40"
            >
              <span className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-amber-400" : "bg-emerald-500"}`} />
              {theme === "dark" ? copy.dark : copy.light}
            </button>
          </div>
        </div>

        <div className="relative flex min-h-[75vh] gap-6">
          {(sidebarOpen || typeof window === "undefined") && (
            <div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside
            className={`fixed inset-y-6 left-0 z-40 w-[320px] min-w-[310px] transform rounded-2xl bg-[var(--card)]/95 p-4 shadow-xl ring-1 ring-[var(--border)] transition-transform lg:static lg:translate-x-0 ${
              sidebarOpen ? "translate-x-4" : "-translate-x-[110%]"
            }`}
          >
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)]/35 px-3 py-2">
              <div>
                <p className="text-xs uppercase text-[var(--foreground)]/60">{copy.status}</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">{user?.email}</p>
              </div>
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/25 p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card)] text-lg">🔍</div>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="w-full rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  onClick={handleSearch}
                  className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  {copy.search}
                </button>
              </div>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ background: avatarStyle(u.username).bg }}
                      >
                        {avatarStyle(u.username).letter}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">{u.username}</p>
                        <p className="text-xs text-[var(--foreground)]/60">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartDm(u._id)}
                        className="rounded-md bg-[var(--foreground)] px-2 py-1 text-xs font-semibold text-white hover:bg-[var(--foreground)]/90"
                      >
                        {copy.dm}
                      </button>
                      <button
                        onClick={() => toggleGroupParticipant(u._id)}
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          groupParticipants.includes(u._id)
                            ? "bg-[var(--accent)]/15 text-[var(--accent-strong)]"
                            : "bg-[var(--muted)] text-[var(--foreground)]/70"
                        }`}
                      >
                        {groupParticipants.includes(u._id) ? copy.inGroup : copy.add}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/25 p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--foreground)]">{copy.newGroup}</p>
                <span className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  {copy.selected(groupParticipants.length)}
                </span>
              </div>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={copy.groupName}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                onClick={handleCreateGroup}
                className="mt-3 w-full rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                {copy.create}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 rounded-full bg-[var(--muted)]/40 p-1 text-xs font-semibold text-[var(--foreground)]">
                  <button
                    onClick={() => setFilter("all")}
                    className={`rounded-full px-3 py-1 ${activeFilter === "all" ? "bg-[var(--card)] shadow-sm" : ""}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter("dm")}
                    className={`rounded-full px-3 py-1 ${activeFilter === "dm" ? "bg-[var(--card)] shadow-sm" : ""}`}
                  >
                    DM
                  </button>
                  <button
                    onClick={() => setFilter("group")}
                    className={`rounded-full px-3 py-1 ${activeFilter === "group" ? "bg-[var(--card)] shadow-sm" : ""}`}
                  >
                    Group
                  </button>
                </div>
                <button onClick={logout} className="text-xs font-semibold text-rose-500 hover:text-rose-600">
                  {copy.logout}
                </button>
              </div>
              <div className="relative max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {loading ? <ChatListSkeleton /> : null}
                {!loading && filteredConversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => {
                      setActiveConversation(conversation._id);
                      // mark unread as read locally
                      setConversations(
                        conversations.map((c) =>
                          c._id === conversation._id ? { ...c, unread: 0 } : c
                        )
                      );
                      setSidebarOpen(false);
                    }}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      activeConversationId === conversation._id
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30"
                    }`}
                  >
                    <div
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: avatarStyle(conversation.name || conversation._id).bg }}
                    >
                      {avatarStyle(
                        conversation.type === "group"
                          ? conversation.name || "G"
                          : conversation.participants.filter((p) => p._id !== user?._id)[0]?.username || "D"
                      ).letter}
                      <span
                        className={`absolute -right-1 -bottom-1 h-3 w-3 rounded-full border border-[var(--card)] ${
                          connected ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[var(--foreground)]">
                          {conversation.type === "group"
                            ? conversation.name
                            : conversation.participants
                                .filter((p) => p._id !== user?._id)
                                .map((p) => p.username)
                                .join(", ")}
                        </p>
                        <span className="text-xs text-[var(--foreground)]/60">
                          {conversation.lastMessage
                            ? dayjs(conversation.lastMessage.createdAt).fromNow()
                            : dayjs(conversation.updatedAt || conversation._id).fromNow()}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--foreground)]/60">
                        {conversation.lastMessage
                          ? `${conversation.lastMessage.sender.username}: ${conversation.lastMessage.content || "📷"}`
                          : "--"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between text-xs text-[var(--foreground)]/50 gap-1">
                      <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-[10px] uppercase">
                        {conversation.type === "group" ? "Group" : "DM"}
                      </span>
                      {conversation.unread && conversation.unread > 0 && (
                        <span className="min-w-[20px] rounded-full bg-[var(--accent)] px-2 py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {!loading && filteredConversations.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/20 px-3 py-6 text-center text-xs text-[var(--foreground)]/60">
                    {copy.chooseChatTitle}
                  </div>
                )}
                <button
                  onClick={() => {
                    // Placeholder: open create group/chat UI
                    const firstUser = searchResults[0];
                    if (firstUser) handleStartDm(firstUser._id);
                  }}
                  className="group sticky bottom-3 ml-auto mr-3 mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition hover:scale-105 hover:bg-[var(--accent-strong)]"
                  title="New chat"
                >
                  +
                </button>
              </div>
            </div>
          </aside>

          <section className="flex flex-1 flex-col rounded-2xl bg-[var(--card)]/95 shadow-sm ring-1 ring-[var(--border)]">
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                  <div>
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {activeConversation.type === "group"
                        ? activeConversation.name
                        : activeConversation.participants
                            .filter((p) => p._id !== user?._id)
                            .map((p) => p.username)
                            .join(", ")}
                    </p>
                    <p className="text-sm text-[var(--foreground)]/60">
                      {copy.participants}: {activeConversation.participants.map((p) => p.username).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--foreground)]/70">
                    <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {connected ? copy.online : copy.offline}
                    <div className="ml-3 flex items-center gap-2 text-base">
                      <button className="rounded-full bg-[var(--muted)]/60 px-2 py-1 hover:bg-[var(--muted)]">🔍</button>
                      <button className="rounded-full bg-[var(--muted)]/60 px-2 py-1 hover:bg-[var(--muted)]">📞</button>
                      <button className="rounded-full bg-[var(--muted)]/60 px-2 py-1 hover:bg-[var(--muted)]">🎥</button>
                      {activeConversation.type === "group" && (
                        <button
                          onClick={() => setShowGroupInfo(true)}
                          className="rounded-full bg-[var(--muted)]/60 px-2 py-1 hover:bg-[var(--muted)]"
                          title="Group info"
                        >
                          👥
                        </button>
                      )}
                      <button className="rounded-full bg-[var(--muted)]/60 px-2 py-1 hover:bg-[var(--muted)]">⋯</button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4 bg-[var(--muted)]/20">
                  {fetchingMessages ? <MessagesSkeleton /> : null}
                  {!fetchingMessages && currentMessages.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/20 px-4 py-6 text-center text-sm text-[var(--foreground)]/60">
                      {copy.chooseChatTitle}
                    </div>
                  )}
                  {currentMessages.map((message) => {
                    const fromMe = message.sender._id === user?._id;
                    const statusIcon =
                      message.status === "read"
                        ? "✔✔"
                        : message.status === "delivered"
                          ? "✔✔"
                          : "✔";
                    const statusClass =
                      message.status === "read"
                        ? "text-blue-200"
                        : message.status === "delivered"
                          ? "text-blue-100"
                          : fromMe
                            ? "text-white/70"
                            : "text-[var(--foreground)]/60";
                    return (
                      <div key={message._id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`relative max-w-xl rounded-[18px] px-4 py-3 shadow-sm ${
                            fromMe
                              ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-white"
                              : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs">
                            {!fromMe && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--muted)]/60 text-[10px] font-semibold text-[var(--foreground)]/80">
                                {avatarStyle(message.sender.username).letter}
                              </span>
                            )}
                            <span className="font-semibold">{message.sender.username}</span>
                            <span className={fromMe ? "text-white/80" : "text-[var(--foreground)]/60"}>
                              {dayjs(message.createdAt).format("HH:mm")}
                            </span>
                          </div>
                          {message.content && <p className="mt-1 text-sm leading-relaxed">{message.content}</p>}
                          {message.imageUrl && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(message.imageUrl!)}
                              className="relative mt-2 block h-64 w-full max-w-md overflow-hidden rounded-lg border border-white/20"
                            >
                              <Image
                                src={message.imageUrl}
                                alt="uploaded"
                                fill
                                sizes="(max-width: 768px) 90vw, 320px"
                                className="object-cover"
                              />
                            </button>
                          )}
                          <div className={`mt-2 flex items-center gap-2 text-[10px] ${statusClass}`}>
                            <span>{dayjs(message.createdAt).format("HH:mm")}</span>
                            {fromMe && <span>{statusIcon}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[var(--foreground)]/70">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--muted)]/60 text-[10px] font-semibold text-[var(--foreground)]/80">
                        •••
                      </span>
                      <div className="flex items-center gap-1 rounded-full bg-[var(--muted)]/40 px-3 py-1">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--foreground)]/50 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--foreground)]/70"></span>
                        </span>
                        <span className="text-xs">
                          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are typing..." : "is typing..."}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--card)] px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--muted)]/60 text-lg hover:bg-[var(--muted)]">
                      📎
                    </button>
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={copy.messagePlaceholder}
                    className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    onKeyDown={(e) => {
                      if (typingTimeout.current) clearTimeout(typingTimeout.current);
                      emitTyping(true);
                      typingTimeout.current = setTimeout(() => emitTyping(false), 1500);
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendTextMessage({ content: messageText.trim() });
                      }
                    }}
                    />
                    <UploadButton<ChatFileRouter>
                      endpoint="chatImage"
                      content={{ button({ ready }) { return ready ? "📤" : "..." } }}
                      onUploadBegin={() => {
                        setUploadProgress(5);
                      }}
                      onUploadProgress={(p) => setUploadProgress(p)}
                      onClientUploadComplete={(res) => {
                        const url = res?.[0]?.url;
                        if (url) {
                          setPreviewImage(url);
                          setUploadProgress(100);
                        }
                      }}
                      onUploadError={(err) => {
                        setError(err.message);
                        setUploadProgress(0);
                        setPreviewImage(null);
                      }}
                    />
                    <button
                      onClick={() => sendTextMessage({ content: messageText.trim() })}
                      disabled={!messageText.trim() || sending}
                      className="flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                    >
                      {copy.send}
                    </button>
                  </div>
                  {previewImage && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[var(--border)]">
                        <Image src={previewImage} alt="preview" fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-[var(--foreground)]/70">
                          <span>Image ready</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage(null);
                              setUploadProgress(0);
                            }}
                            className="text-rose-500 hover:text-rose-600"
                          >
                            ✕
                          </button>
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]/50">
                            <div
                              className="h-full bg-[var(--accent)] transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        )}
                        {uploadProgress >= 100 && (
                          <div className="mt-1 text-[10px] uppercase text-emerald-500">Uploaded</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-1 flex-col items-center justify-center p-12 text-center text-[var(--foreground)]/70">
                <p className="text-lg font-semibold text-[var(--foreground)]">{copy.chooseChatTitle}</p>
                <p className="mt-2 text-sm">{copy.chooseChatSubtitle}</p>
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
        {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
        {activeConversation && activeConversation.type === "group" && (
          <GroupInfoDrawer
            open={showGroupInfo}
            onClose={() => setShowGroupInfo(false)}
            conversation={activeConversation}
          />
        )}
      </div>
    </main>
  );
}

function Lightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
      >
        ✕
      </button>
      <div className="relative max-h-[90vh] max-w-[90vw]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="full" className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl" />
      </div>
    </div>
  );
}

function GroupInfoDrawer({
  open,
  onClose,
  conversation,
}: {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-sm bg-[var(--card)] text-[var(--foreground)] shadow-2xl ring-1 ring-[var(--border)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{conversation.name || "Group"}</p>
            <p className="text-xs text-[var(--foreground)]/60">
              {conversation.participants.length} participants
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-[var(--foreground)]/70 hover:text-[var(--foreground)]">
            ✕
          </button>
        </div>
        <div className="space-y-2 p-4">
          {conversation.participants.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)]/25 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: avatarStyle(p.username).bg }}
                >
                  {avatarStyle(p.username).letter}
                </div>
                <div>
                  <p className="text-sm font-semibold">{p.username}</p>
                  <p className="text-xs text-[var(--foreground)]/60">{p.email}</p>
                </div>
              </div>
              <div className="text-[10px] uppercase text-[var(--foreground)]/60">Member</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
