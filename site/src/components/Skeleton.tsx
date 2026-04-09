export function RepoSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-48 rounded bg-[var(--color-border)]" />
          <div className="mt-2 h-3 w-full rounded bg-[var(--color-border)]" />
          <div className="mt-1 h-3 w-2/3 rounded bg-[var(--color-border)]" />
          <div className="mt-2 flex gap-3">
            <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
            <div className="h-3 w-20 rounded bg-[var(--color-border)]" />
          </div>
        </div>
        <div className="h-6 w-10 rounded bg-[var(--color-border)]" />
      </div>
    </div>
  );
}

export function RepoListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <RepoSkeleton key={i} />
      ))}
    </div>
  );
}
