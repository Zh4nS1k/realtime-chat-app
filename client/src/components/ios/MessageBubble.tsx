'use client';

import Image from 'next/image';
import dayjs from 'dayjs';
import type { ChatMessage } from '@/store/chat';
import type { AuthUser } from '@/store/auth';

interface MessageBubbleProps {
  message: ChatMessage;
  isSent: boolean;
  showAvatar?: boolean;
  avatarStyle?: (name?: string) => { letter: string; bg: string };
  onImageClick?: (url: string) => void;
}

export function MessageBubble({
  message,
  isSent,
  showAvatar = false,
  avatarStyle,
  onImageClick,
}: MessageBubbleProps) {
  const statusIcon =
    message.status === 'read'
      ? '✓✓'
      : message.status === 'delivered'
      ? '✓✓'
      : '✓';

  const statusColor =
    message.status === 'read'
      ? 'text-ios-blue dark:text-ios-blue'
      : isSent
      ? 'text-white/70 dark:text-white/60'
      : 'text-[var(--ios-text-tertiary)]';

  return (
    <div
      className={`flex items-end gap-2 ${
        isSent ? 'justify-end' : 'justify-start'
      } ios-animate-slide-up`}
    >
      {!isSent && showAvatar && avatarStyle && (
        <div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-md"
          style={{ background: avatarStyle(message.sender.username).bg }}
        >
          {avatarStyle(message.sender.username).letter}
        </div>
      )}
      <div
        className={`group relative max-w-[75%] sm:max-w-md ${
          isSent
            ? 'ml-auto bg-gradient-to-br from-[var(--ios-blue)] to-[var(--ios-blue-dark)] text-white'
            : 'bg-[var(--ios-bg-secondary)] text-[var(--ios-text-primary)]'
        } rounded-3xl px-4 py-2.5 shadow-sm ${
          !isSent ? 'border border-[var(--ios-separator)]' : ''
        }`}
      >
        {/* Group message sender name */}
        {!isSent && showAvatar && (
          <div className="mb-1 text-xs font-semibold text-[var(--ios-text-secondary)]">
            {message.sender.username}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <p
            className={`text-[15px] leading-[1.4] ${
              isSent ? 'text-white' : ''
            } whitespace-pre-wrap break-words`}
          >
            {message.content}
          </p>
        )}

        {/* Image */}
        {message.imageUrl && (
          <button
            type="button"
            onClick={() => onImageClick?.(message.imageUrl!)}
            className="relative mt-2 block aspect-video w-full overflow-hidden rounded-2xl"
          >
            <Image
              src={message.imageUrl}
              alt="Message image"
              fill
              sizes="(max-width: 768px) 75vw, 320px"
              className="object-cover"
            />
          </button>
        )}

        {/* File attachment */}
        {!message.imageUrl && message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noreferrer"
            className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
              isSent
                ? 'bg-white/10 hover:bg-white/15'
                : 'bg-[var(--ios-bg)] hover:bg-[var(--ios-bg-secondary)]'
            } transition-colors`}
          >
            <span className="text-lg">📎</span>
            <span className="flex-1 truncate">
              {message.fileName || 'File'}
            </span>
            <span className="text-xs opacity-70">Open</span>
          </a>
        )}

        {/* Timestamp and status */}
        <div
          className={`mt-1.5 flex items-center gap-1.5 ${
            isSent ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className={`text-[11px] ${statusColor} font-medium`}>
            {dayjs(message.createdAt).format('HH:mm')}
          </span>
          {isSent && (
            <span className={`text-[13px] ${statusColor}`}>{statusIcon}</span>
          )}
        </div>
      </div>
      {isSent && showAvatar && avatarStyle && (
        <div
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-md"
          style={{ background: avatarStyle(message.sender.username).bg }}
        >
          {avatarStyle(message.sender.username).letter}
        </div>
      )}
    </div>
  );
}

