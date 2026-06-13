// Bump this string whenever there's a new announcement to show. A user sees the
// modal once per version (tracked in profiles.whats_new_seen_version).
export const WHATS_NEW_VERSION = "2026-06-quests";

export interface WhatsNewContent {
  title: string;
  emoji: string;
  items: { icon: string; text: string }[];
  cta: string;
}

export const WHATS_NEW: WhatsNewContent = {
  title: "New stuff just dropped!",
  emoji: "🎉",
  items: [
    { icon: "🗺️", text: "Weekly Quests — a fresh challenge every week for bonus XP." },
    { icon: "🏅", text: "Loads of new badges: total-chore milestones, level-up trophies, and more." },
    { icon: "⭐", text: "Top-effort and Quest Champion badges to chase." },
  ],
  cta: "Let's go!",
};
