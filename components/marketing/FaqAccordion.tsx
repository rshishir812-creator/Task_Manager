import type { FaqItem } from "@/lib/marketing/faq";

interface FaqAccordionProps {
  items: readonly FaqItem[];
  defaultOpen?: number; // index to open by default (for the homepage teaser)
}

// Server-rendered native <details>/<summary> — no JavaScript needed, fully
// crawlable by search engines and LLMs.
export default function FaqAccordion({ items, defaultOpen }: FaqAccordionProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details
          key={item.id}
          id={item.id}
          open={defaultOpen === i}
          className="group rounded-2xl border border-[var(--border)] bg-bg-elevated overflow-hidden"
        >
          <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none hover:bg-bg/40 transition-colors">
            <h3 className="font-display font-semibold text-fg text-base md:text-lg">
              {item.question}
            </h3>
            <span
              className="shrink-0 text-accent-teal text-xl transition-transform group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <div className="px-5 pb-5 text-sm md:text-base text-fg-muted leading-relaxed">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
