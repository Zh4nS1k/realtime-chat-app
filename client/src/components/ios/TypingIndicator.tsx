'use client';

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 ios-animate-fade-in">
      <div className="flex items-center gap-1 rounded-full bg-[var(--ios-bg-secondary)] px-3 py-2 shadow-sm border border-[var(--ios-separator)]">
        <div className="flex gap-1">
          <div
            className="h-2 w-2 rounded-full bg-[var(--ios-text-secondary)] animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="h-2 w-2 rounded-full bg-[var(--ios-text-secondary)] animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="h-2 w-2 rounded-full bg-[var(--ios-text-secondary)] animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <span className="ml-2 text-xs font-medium text-[var(--ios-text-secondary)]">
          {users.length > 1
            ? `${users.join(', ')} are typing...`
            : `${users[0]} is typing...`}
        </span>
      </div>
    </div>
  );
}

