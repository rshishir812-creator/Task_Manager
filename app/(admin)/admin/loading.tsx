export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Page title strip */}
      <div className="h-8 w-40 rounded-lg bg-bg-elevated border border-[var(--border)]" />

      {/* Content cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-bg-elevated border border-[var(--border)] ring-1 ring-accent-amber/10"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
