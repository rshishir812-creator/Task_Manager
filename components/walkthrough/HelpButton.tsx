"use client";

export default function HelpButton() {
  function open() {
    window.dispatchEvent(new CustomEvent("chorequest:open-walkthrough"));
  }

  return (
    <button
      onClick={open}
      aria-label="Open how-to-use walkthrough"
      title="How to use"
      className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-elevated border border-[var(--border)] text-fg-muted font-display font-bold text-base transition-colors hover:text-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
    >
      ?
    </button>
  );
}
