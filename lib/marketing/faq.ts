import { FREE_LIMITS, TRIAL_DAYS } from "@/lib/plan-limits";

// Each FAQ item powers three surfaces: the visible /faq accordion, the homepage
// teaser, and the /llms-full.txt markdown. Keep answers factual and short
// enough for an LLM to quote verbatim. The `id` becomes the in-page anchor
// (`/faq#what-is-chorequest`) so citations can deep-link.
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "Basics" | "Features" | "Pricing" | "Privacy & safety" | "Platform";
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "what-is-chorequest",
    category: "Basics",
    question: "What is ChoreQuest?",
    answer:
      "ChoreQuest is a gamified chore-tracking app for families. Parents define recurring chores; kids earn XP, levels, streaks and badges by completing them; parents can approve completions and optionally rate the quality with a smiley scale. It's a Progressive Web App, so it installs on any phone without an app store.",
  },
  {
    id: "who-is-it-for",
    category: "Basics",
    question: "Who is ChoreQuest for?",
    answer:
      "Families with one or more kids old enough to read short instructions (roughly 6+). It works for chores, but parents also use it for daily habits like reading, music practice, study sessions or exercise. The product is built mobile-first and India-friendly (chore schedules respect IST).",
  },
  {
    id: "how-it-works",
    category: "Basics",
    question: "How does ChoreQuest work?",
    answer:
      "Three steps. (1) A parent signs in with Google, creates a family and adds chores (with weekday recurrence, point value and optional time window). (2) Kids open the app, mark chores complete, and earn XP, streaks, badges and milestone progress. (3) For chores that require approval, parents review in a Verifications screen and can optionally rate the work with a smiley — which scales the points awarded.",
  },
  {
    id: "is-it-free",
    category: "Pricing",
    question: "Is ChoreQuest free?",
    answer: `Yes. The Free plan supports ${FREE_LIMITS.maxChildren} child profile and up to ${FREE_LIMITS.maxActiveChores} active chores, with all the gamification (XP, levels, streaks, badges, milestones, daily perfect-day bonus, rewards). Premium adds unlimited kids and unlimited active chores and starts with a ${TRIAL_DAYS}-day free trial.`,
  },
  {
    id: "premium-trial",
    category: "Pricing",
    question: "How does the Premium trial work?",
    answer: `Every family can start a one-time ${TRIAL_DAYS}-day Premium trial that unlocks unlimited children and unlimited active chores. No card is required to start the trial. When the trial ends the family returns to the Free plan unless they subscribe.`,
  },
  {
    id: "quality-rating",
    category: "Features",
    question: "What is the parent quality rating?",
    answer:
      "When a parent approves a completed chore they can optionally tap one of four smileys: 🤩 Excellent (100% of points), 🙂 Good (80%), 😐 Okay (50%) or 😞 Needs work (25%). Rating is always optional — unrated completions award full points. The chosen smiley is shown to the child on their completed chore, alongside the adjusted points.",
  },
  {
    id: "streaks-xp-levels",
    category: "Features",
    question: "How do streaks, XP and levels work?",
    answer:
      "Every chore has a point value (XP). Completing chores raises a child's total XP, which moves them up through 7 named levels — Rookie, Apprentice, Achiever, Champion, Hero, Legend and Grand Master. Each chore has its own streak counter (consecutive scheduled days completed), plus there's a family-level overall streak. Completing every scheduled chore for a day awards a 50-point Perfect Day bonus.",
  },
  {
    id: "rewards",
    category: "Features",
    question: "How do rewards work?",
    answer:
      "Parents create rewards in the admin area with a name, icon and point cost. Kids see those rewards in their Rewards tab and can redeem them when they have enough points. Parents see and approve redemptions. Rewards are entirely family-defined — ChoreQuest doesn't pay out anything itself.",
  },
  {
    id: "multiple-kids",
    category: "Features",
    question: "Can I add more than one child?",
    answer:
      "Multiple kids per family is a Premium feature. Each child gets their own profile, chore assignments, points balance, streaks, badges and leaderboard position within the family. Parents see a per-kid view on the admin dashboard and can rate completions per child.",
  },
  {
    id: "platforms",
    category: "Platform",
    question: "Does ChoreQuest work on iPhone, Android and desktop?",
    answer:
      "Yes. ChoreQuest is a Progressive Web App that runs in any modern browser (Chrome, Safari, Edge, Firefox) on phones, tablets and desktops. On iOS and Android you can install it to your home screen and it behaves like a native app — full-screen, splash screen, app icon. There is no app-store download required.",
  },
  {
    id: "offline",
    category: "Platform",
    question: "Does it work offline?",
    answer:
      "Static assets (icons, fonts, JavaScript, CSS) are cached so the app shell loads instantly. Authenticated screens always fetch fresh from the server, so a working internet connection is required to view chores and save completions. Quick connectivity drops are handled gracefully; long offline use is not supported today.",
  },
  {
    id: "india-friendly",
    category: "Platform",
    question: "Is ChoreQuest built for Indian families?",
    answer:
      "Yes. Daily chore schedules, streaks and \"today/yesterday\" logic respect India Standard Time, so a child in Bengaluru and a parent in Delhi see the same day boundaries. The Terms of Service are governed by Indian law. The product is fluent across global English so families anywhere can use it, but day-one we're optimised for Indian routines.",
  },
  {
    id: "coppa-safe",
    category: "Privacy & safety",
    question: "Is ChoreQuest safe for kids? Is it COPPA-compliant?",
    answer:
      "Yes. ChoreQuest follows a COPPA-compliant parent-consent model: a parent creates the family and invites their child by email. We collect the minimum needed to operate (name, email, optional Google profile photo, and chore history). Full details are on the Privacy page.",
  },
  {
    id: "ads-tracking",
    category: "Privacy & safety",
    question: "Do you show ads or sell data?",
    answer:
      "No. ChoreQuest has no ads, no third-party advertising trackers and no data sales. Sign-in is via Google OAuth; the app database is hosted on Supabase (SOC 2 Type II); deployment is on Vercel. See the Privacy page for the full list of subprocessors.",
  },
  {
    id: "sign-up",
    category: "Basics",
    question: "How do I sign up?",
    answer:
      "Open chorequest.in and choose \"I'm a Parent\". Sign in with Google — that creates your family. Then invite your kids by email from the admin area; they sign in with their own Google account and join your family automatically.",
  },
  {
    id: "delete-data",
    category: "Privacy & safety",
    question: "How do I delete my data or contact support?",
    answer: `Email ${"r.shishir812@gmail.com"} from the address linked to your account. We'll delete your family, all profiles and all chore history. The Privacy page has the full process.`,
  },
] as const;

// Group items by category for the /faq page render.
export function groupFaqByCategory(items: readonly FaqItem[] = FAQ_ITEMS) {
  const map = new Map<FaqItem["category"], FaqItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries());
}
