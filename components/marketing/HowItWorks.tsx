import { QUALITY_LEVELS } from "@/lib/quality-rating";

const STEPS = [
  {
    n: 1,
    title: "Parent sets up chores",
    body: "Add chores with weekday recurrence, point values, icons and optional time windows. Set who needs to approve each one.",
    icon: "🪴",
  },
  {
    n: 2,
    title: "Kid completes the quest",
    body: "Kids tap to mark chores done and earn XP, level up, build streaks and unlock badges. A perfect day adds a 50-point bonus.",
    icon: "⚔️",
  },
  {
    n: 3,
    title: "Parent approves & (optionally) rates",
    body: "Review completions in one place. Tap a smiley to scale the points — or skip and award full points. The child sees your smiley.",
    icon: "✨",
  },
] as const;

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-5xl px-6 py-20 md:py-28"
    >
      <h2 className="font-hero font-extrabold text-fg text-3xl md:text-5xl tracking-tight text-center">
        How <span className="text-accent-teal">ChoreQuest</span> works
      </h2>
      <p className="mt-4 text-center text-fg-muted max-w-2xl mx-auto">
        Three steps. No timers. No nagging. Built so the kid wants to come back tomorrow.
      </p>

      <ol className="mt-12 grid md:grid-cols-3 gap-5">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="relative rounded-2xl border border-[var(--border)] bg-bg-elevated p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl" aria-hidden="true">
                {step.icon}
              </span>
              <span className="font-hero font-extrabold text-accent-teal text-sm tracking-widest">
                STEP {step.n}
              </span>
            </div>
            <h3 className="font-display font-bold text-fg text-xl mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-fg-muted leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>

      {/* Quality-rating scale callout — proves the feature is real */}
      <div className="mt-10 rounded-2xl border border-accent-amber/30 bg-accent-amber/10 p-6 max-w-3xl mx-auto">
        <p className="text-xs font-semibold text-accent-amber tracking-widest mb-3">
          THE QUALITY-RATING SCALE
        </p>
        <div className="grid grid-cols-4 gap-3 text-center">
          {QUALITY_LEVELS.map((q) => (
            <div key={q.rating} className="rounded-xl bg-bg/40 p-3">
              <div className="text-3xl mb-1" aria-hidden="true">
                {q.emoji}
              </div>
              <div className="font-display font-bold text-fg text-sm">
                {q.label}
              </div>
              <div className="text-xs text-fg-muted mt-0.5">
                {Math.round(q.factor * 100)}% of points
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-fg-muted text-center">
          Rating is optional. Unrated completions award full points.
        </p>
      </div>
    </section>
  );
}
