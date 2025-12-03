'use client';

export function ChatListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3"
        >
          <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--muted)]/50" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--muted)]/60" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--muted)]/50" />
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
        <div key={idx} className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div
            className={`max-w-xl rounded-2xl px-4 py-3 ${
              idx % 2 === 0 ? "bg-[var(--muted)]/40" : "bg-[var(--accent)]/20"
            }`}
          >
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--muted)]/60" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-[var(--muted)]/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
