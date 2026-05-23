"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ContactUsModalProps {
  email: string;
  userName: string | null;
  onClose: () => void;
}

export default function ContactUsModal({ email, userName, onClose }: ContactUsModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const canSubmit =
    !isSubmitting &&
    trimmedSubject.length >= 1 &&
    trimmedSubject.length <= 160 &&
    trimmedMessage.length >= 1 &&
    trimmedMessage.length <= 4000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: trimmedSubject, message: trimmedMessage }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to send. Please try again.");
        setIsSubmitting(false);
        return;
      }
      setSubmitted(true);
      window.setTimeout(onClose, 2500);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-bg-elevated shadow-xl overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-fg-muted hover:text-fg hover:bg-bg transition-colors"
          >
            ✕
          </button>

          {submitted ? (
            <div className="px-6 py-12 text-center">
              <div className="text-5xl mb-3">✉️</div>
              <h2 className="font-display font-bold text-xl text-fg mb-1.5">Thanks!</h2>
              <p className="text-sm text-fg-muted">
                We&apos;ve got your note — we&apos;ll take a look.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-5">
              <h2 className="font-display font-bold text-xl text-fg mb-1">Contact us</h2>
              <p className="text-xs text-fg-muted mb-4">
                Send feedback, a bug report, or a feature idea — anything goes.
              </p>

              <div className="mb-4 rounded-lg bg-bg border border-[var(--border)] px-3 py-2 text-xs text-fg-muted">
                <span className="text-fg-muted/70">From&nbsp;</span>
                <span className="text-fg">{userName ?? "You"}</span>{" "}
                <span className="text-fg-muted/70">·</span>{" "}
                <span className="text-fg">{email}</span>
              </div>

              <label className="block mb-3">
                <span className="block text-xs font-medium text-fg mb-1.5">Subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={160}
                  required
                  placeholder="One-line summary"
                  className="w-full rounded-lg border border-[var(--border)] bg-bg text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                />
              </label>

              <label className="block mb-2">
                <span className="block text-xs font-medium text-fg mb-1.5">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000}
                  required
                  rows={6}
                  placeholder="Tell us what's on your mind…"
                  className="w-full rounded-lg border border-[var(--border)] bg-bg text-fg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent resize-none"
                />
                <div className="mt-1 text-right text-[10px] text-fg-muted/60">
                  {trimmedMessage.length}/4000
                </div>
              </label>

              {error && (
                <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-fg-muted hover:text-fg px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  aria-busy={isSubmitting}
                  className="flex items-center gap-2 bg-accent-teal text-black font-display font-bold text-sm px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
