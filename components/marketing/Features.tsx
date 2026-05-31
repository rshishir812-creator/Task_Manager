const FEATURES = [
  {
    icon: "📅",
    title: "Weekday recurrence",
    body: "Schedule chores on the exact days of the week they should happen. The app respects IST so the day boundary is the same for everyone in your family.",
  },
  {
    icon: "⚡",
    title: "XP, levels & streaks",
    body: "Seven named levels from Rookie to Grand Master. Per-chore streaks and a family-wide overall streak. A 50-point bonus for a perfect day.",
  },
  {
    icon: "🏆",
    title: "Badges & milestones",
    body: "Automatic badges fire when kids hit streaks, totals and chore-specific goals. Milestone progress cards show the next badge they're chasing.",
  },
  {
    icon: "🤩",
    title: "Parent quality rating",
    body: "Optionally rate completions with 4 smileys (100/80/50/25% of points). The chosen smiley shows on the kid's card — visible feedback, no nagging.",
  },
  {
    icon: "🎁",
    title: "Rewards & redemption",
    body: "Parents create rewards with point costs. Kids spend points to redeem. Approvals run through the same Verifications screen.",
  },
  {
    icon: "📊",
    title: "Parent insights",
    body: "A real dashboard: which kid is on what streak, what's pending approval, which chores get skipped. Plus a per-day calendar for fixing the past.",
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <h2 className="font-hero font-extrabold text-fg text-3xl md:text-5xl tracking-tight text-center">
        Everything you need to build the habit
      </h2>
      <p className="mt-4 text-center text-fg-muted max-w-2xl mx-auto">
        Real gamification — not just star stickers. Every feature is in the app today.
      </p>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-6 hover:border-accent-teal/40 transition-colors"
          >
            <div className="text-3xl mb-3" aria-hidden="true">
              {f.icon}
            </div>
            <h3 className="font-display font-bold text-fg text-lg mb-2">
              {f.title}
            </h3>
            <p className="text-sm text-fg-muted leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
