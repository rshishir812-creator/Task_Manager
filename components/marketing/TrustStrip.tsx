"use client";

import { motion } from "framer-motion";

const items = [
  {
    icon: "🔒",
    title: "COPPA-compliant",
    body: "Built for families. Parental consent first.",
  },
  {
    icon: "🚫",
    title: "No ads, no tracking",
    body: "We don't sell your data — ever.",
  },
  {
    icon: "🆓",
    title: "Free forever",
    body: "Whole family, all features, no fee.",
  },
];

export default function TrustStrip() {
  return (
    <section className="px-6 md:px-12 py-20 border-t border-[var(--border)]">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-[var(--border)] bg-bg-elevated/50 p-6"
          >
            <div className="text-2xl mb-3" aria-hidden="true">{item.icon}</div>
            <h3 className="font-hero font-bold text-fg text-base mb-1.5">{item.title}</h3>
            <p className="text-fg-muted text-sm leading-relaxed">{item.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
