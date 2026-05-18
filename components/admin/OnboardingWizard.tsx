"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AGE_PRESETS,
  BRACKETS,
  type AgeBracket,
  type PresetChore,
  ALL_DAYS,
} from "@/lib/chore-presets";
import type { DayOfWeek } from "@/lib/types";

type WizardChore = PresetChore & { included: boolean };

const DAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "M" }, { key: "tue", label: "T" }, { key: "wed", label: "W" },
  { key: "thu", label: "T" }, { key: "fri", label: "F" }, { key: "sat", label: "S" }, { key: "sun", label: "S" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bracket, setBracket] = useState<AgeBracket | null>(null);
  const [list, setList] = useState<WizardChore[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickBracket(b: AgeBracket) {
    setBracket(b);
    setList(AGE_PRESETS[b].map((c) => ({ ...c, included: true })));
    setStep(3);
  }

  function toggle(idx: number) {
    setList((prev) => prev.map((c, i) => (i === idx ? { ...c, included: !c.included } : c)));
  }

  function setPoints(idx: number, delta: number) {
    setList((prev) =>
      prev.map((c, i) =>
        i === idx ? { ...c, points: Math.max(5, Math.min(100, c.points + delta)) } : c,
      ),
    );
  }

  function toggleDay(idx: number, day: DayOfWeek) {
    setList((prev) =>
      prev.map((c, i) =>
        i === idx
          ? {
              ...c,
              recurrence: c.recurrence.includes(day)
                ? c.recurrence.filter((d) => d !== day)
                : [...c.recurrence, day],
            }
          : c,
      ),
    );
  }

  function addCustom() {
    setList((prev) => [
      ...prev,
      { title: "New task", icon: "✨", points: 10, recurrence: ALL_DAYS, included: true, category: "routine" },
    ]);
  }

  function updateTitle(idx: number, title: string) {
    setList((prev) => prev.map((c, i) => (i === idx ? { ...c, title } : c)));
  }

  const selected = list.filter((c) => c.included);
  const totalPoints = selected.reduce((s, c) => s + c.points, 0);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chores: selected.map(({ title, icon, points, recurrence }) => ({
            title: title.trim() || "Untitled task",
            icon,
            points,
            recurrence,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to create chores");
        setSubmitting(false);
        return;
      }
      // Land on /admin/family if no kids yet, else dashboard. Let the callback-style
      // redirect happen via a fresh load.
      router.push("/admin/family");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function skip() {
    router.push("/admin/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={`flex-1 h-1 rounded-full ${
              s <= step ? "bg-accent-amber" : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="text-center flex flex-col items-center gap-4 py-6">
          <div className="text-5xl">🎮</div>
          <h1 className="font-display font-bold text-2xl text-fg">Welcome to ChoreQuest</h1>
          <p className="text-sm text-fg-muted max-w-md">
            Let&apos;s set up tasks for your child. We&apos;ll suggest a starter list based on age — you can customise everything before you save. Each task automatically gets a 7-tier streak ladder.
          </p>
          <button
            onClick={() => setStep(2)}
            className="rounded-2xl bg-accent-teal text-black font-semibold px-6 py-3 text-sm hover:opacity-90 transition-opacity mt-2"
          >
            Get started →
          </button>
          <button onClick={skip} className="text-xs text-fg-muted hover:text-fg mt-1">
            Skip — I&apos;ll set up manually
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-display font-bold text-xl text-fg">How old is your child?</h2>
          <p className="text-sm text-fg-muted">Pick the bracket that fits. You can edit every task on the next step.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BRACKETS.map((b) => (
              <button
                key={b.key}
                onClick={() => pickBracket(b.key)}
                className="rounded-2xl border border-[var(--border)] bg-bg-elevated p-5 text-left hover:border-accent-amber hover:bg-accent-amber/5 transition-colors"
              >
                <p className="font-display font-bold text-lg text-fg">{b.label}</p>
                <p className="text-xs text-fg-muted mt-1">{b.tagline}</p>
                <p className="text-xs text-fg-muted mt-3 italic line-clamp-2">
                  e.g. {AGE_PRESETS[b.key].slice(0, 3).map((c) => c.title).join(", ")}…
                </p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="text-xs text-fg-muted hover:text-fg self-start">← Back</button>
        </div>
      )}

      {step === 3 && bracket && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-fg">Customise the tasks</h2>
            <p className="text-sm text-fg-muted mt-1">
              {selected.length} task{selected.length === 1 ? "" : "s"} selected · up to <span className="text-accent-amber font-semibold">{totalPoints}</span> pts/day
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {list.map((c, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 transition-colors ${
                  c.included
                    ? "border-accent-amber/40 bg-bg-elevated"
                    : "border-[var(--border)] bg-bg opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={c.included}
                    onChange={() => toggle(i)}
                    className="mt-1.5 h-4 w-4 accent-accent-teal"
                  />
                  <span className="text-2xl mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={c.title}
                      onChange={(e) => updateTitle(i, e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-fg focus:outline-none border-b border-transparent focus:border-accent-amber/40"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPoints(i, -5)}
                          className="w-6 h-6 rounded-lg border border-[var(--border)] text-fg-muted hover:text-fg"
                          aria-label="Decrease points"
                        >
                          −
                        </button>
                        <span className="font-display font-bold text-accent-amber w-8 text-center">{c.points}</span>
                        <button
                          onClick={() => setPoints(i, 5)}
                          className="w-6 h-6 rounded-lg border border-[var(--border)] text-fg-muted hover:text-fg"
                          aria-label="Increase points"
                        >
                          +
                        </button>
                        <span className="text-fg-muted ml-1">pts</span>
                      </div>
                      <span className="text-fg-muted">·</span>
                      <div className="flex gap-1">
                        {DAY_LABELS.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => toggleDay(i, key)}
                            className={`w-6 h-6 rounded-md text-xs font-semibold ${
                              c.recurrence.includes(key)
                                ? "bg-accent-teal text-black"
                                : "border border-[var(--border)] text-fg-muted"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addCustom}
              className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-bg hover:border-accent-amber p-3 text-sm text-fg-muted hover:text-accent-amber transition-colors"
            >
              + Add a custom task
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button onClick={() => setStep(2)} className="text-sm text-fg-muted hover:text-fg">← Back</button>
            <button
              onClick={() => setStep(4)}
              disabled={selected.length === 0}
              className="rounded-2xl bg-accent-teal text-black font-semibold px-6 py-2.5 text-sm disabled:opacity-50"
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-display font-bold text-xl text-fg">Ready to create</h2>
          <p className="text-sm text-fg-muted">
            We&apos;ll create {selected.length} task{selected.length === 1 ? "" : "s"} for your family. Each task gets its own streak ladder (3 → 100 days). You can edit, add, or remove tasks any time.
          </p>
          <div className="rounded-2xl border border-[var(--border)] bg-bg-elevated divide-y divide-[var(--border)]">
            {selected.map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xl">{c.icon}</span>
                <p className="text-sm text-fg flex-1 truncate">{c.title.trim() || "Untitled task"}</p>
                <span className="text-xs text-accent-amber font-semibold">+{c.points} pts</span>
              </div>
            ))}
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button onClick={() => setStep(3)} className="text-sm text-fg-muted hover:text-fg">← Back</button>
            <button
              onClick={submit}
              disabled={submitting}
              className="rounded-2xl bg-accent-amber text-black font-semibold px-6 py-2.5 text-sm disabled:opacity-50"
            >
              {submitting ? "Creating…" : `Create ${selected.length} task${selected.length === 1 ? "" : "s"} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
