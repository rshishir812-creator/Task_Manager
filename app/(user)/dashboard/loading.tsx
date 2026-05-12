export default function DashboardLoading() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Hero / streak card */}
      <div className="h-28 rounded-2xl bg-bg-elevated border border-[var(--border)]" />

      {/* Section label */}
      <div className="h-4 w-24 rounded-full bg-bg-elevated" />

      {/* Chore / content cards */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 rounded-xl bg-bg-elevated border border-[var(--border)]"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
