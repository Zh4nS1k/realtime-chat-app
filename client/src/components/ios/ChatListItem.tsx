'use client';

import dayjs from 'dayjs';
import type { Conversation } from '@/store/chat';
import type { AuthUser } from '@/store/auth';

interface ChatListItemProps {
  conversation: Conversation;
  currentUser: AuthUser | null;
  isActive: boolean;
  avatarStyle: (name?: string) => { letter: string; bg: string };
  connected: boolean;
  onClick: () => void;
}

export function ChatListItem({
  conversation,
  currentUser,
  isActive,
  avatarStyle,
  connected,
  onClick,
}: ChatListItemProps) {
  const otherParticipant = conversation.participants.find(
    (p) => p._id !== currentUser?._id
  );
  const displayName =
    conversation.type === 'group'
      ? conversation.name
      : otherParticipant?.username || 'Unknown';

  const displayAvatar =
    conversation.type === 'group'
      ? conversation.name || 'G'
      : otherParticipant?.username || 'D';

  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.content ||
      conversation.lastMessage.fileName ||
      (conversation.lastMessage.imageUrl ? '📷 Photo' : '📎 File')
    : '--';

  return (
    <button
      onClick={onClick}
      className={`ios-button group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
        isActive
          ? 'bg-[var(--ios-blue)]/10 border border-[var(--ios-blue)]/30'
          : 'hover:bg-[var(--ios-bg-secondary)] border border-transparent'
      }`}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-md">
        <div
          style={{ background: avatarStyle(displayAvatar).bg }}
          className="absolute inset-0 rounded-full"
        />
        <span className="relative z-10">
          {avatarStyle(displayAvatar).letter}
        </span>
        {conversation.type === 'dm' && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--ios-bg-secondary)] ${
              connected ? 'bg-[var(--ios-green)]' : 'bg-[var(--ios-separator)]'
            }`}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate font-semibold text-[15px] ${
              isActive
                ? 'text-[var(--ios-blue)]'
                : 'text-[var(--ios-text-primary)]'
            }`}
          >
            {displayName}
          </p>
          {conversation.lastMessage && (
            <span className="shrink-0 text-[13px] text-[var(--ios-text-tertiary)]">
              {dayjs(conversation.lastMessage.createdAt).fromNow(true)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="truncate text-[13px] text-[var(--ios-text-secondary)]">
            {conversation.lastMessage?.sender._id === currentUser?._id
              ? 'You: '
              : ''}
            {lastMessagePreview}
          </p>
          {conversation.unread && conversation.unread > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--ios-blue)] px-2 text-[11px] font-semibold text-white">
              {conversation.unread > 99 ? '99+' : conversation.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

