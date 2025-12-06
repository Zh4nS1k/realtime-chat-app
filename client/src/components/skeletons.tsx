'use client';

export function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-2xl border border-[var(--ios-separator)] bg-[var(--ios-bg-secondary)] px-3 py-3"
        >
          <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--ios-separator)]/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-[var(--ios-separator)]/50" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--ios-separator)]/30" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className={`flex ${
            idx % 2 === 0 ? 'justify-start' : 'justify-end'
          } ios-animate-fade-in`}
        >
          <div
            className={`max-w-[75%] sm:max-w-md rounded-3xl px-4 py-3 ${
              idx % 2 === 0
                ? 'bg-[var(--ios-bg-secondary)] border border-[var(--ios-separator)]'
                : 'bg-gradient-to-br from-[var(--ios-blue)] to-[var(--ios-blue-dark)]'
            }`}
          >
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--ios-separator)]/50" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-[var(--ios-separator)]/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
