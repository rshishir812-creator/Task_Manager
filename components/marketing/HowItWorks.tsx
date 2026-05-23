"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Parent invites kids",
    body: "Set the quests, points, and rewards your family runs on.",
  },
  {
    n: "02",
    title: "Kids complete chores",
    body: "Tap to mark done. Earn XP, streaks, and badges along the way.",
  },
  {
    n: "03",
    title: "Everyone wins",
    body: "Real-world rewards. Real habit shifts. Less nagging at home.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 md:px-12 py-20 border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-hero font-extrabold text-fg text-3xl md:text-4xl leading-tight tracking-tight mb-12 max-w-xl">
          How it works.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <div className="font-hero font-extrabold text-accent-teal text-sm tracking-widest mb-3">
                {s.n}
              </div>
              <h3 className="font-hero font-bold text-fg text-xl mb-2">{s.title}</h3>
              <p className="text-fg-muted text-sm leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
