// Single source of truth for public-marketing constants.
// Edit here, not in copy — keeps homepage, /faq, llms.txt and JSON-LD in sync.

import { FREE_LIMITS, TRIAL_DAYS } from "@/lib/plan-limits";

export const SITE_URL = "https://chorequest.in";
export const SITE_NAME = "ChoreQuest";
export const SITE_TAGLINE = "Make chores a quest. Not a fight.";
export const SITE_DESCRIPTION =
  "ChoreQuest turns daily habits into a game your kids actually want to play — built mobile-first for Indian families.";

export const SUPPORT_EMAIL = "r.shishir812@gmail.com";

// Mirrors lib/plan-limits.ts in human copy. If those constants change,
// update both — the imports below keep numeric values in sync automatically.
export const PLAN_COPY = {
  free: {
    name: "Free",
    price: "₹0",
    priceSuffix: "forever",
    maxChildren: FREE_LIMITS.maxChildren,
    maxActiveChores: FREE_LIMITS.maxActiveChores,
    features: [
      `${FREE_LIMITS.maxChildren} child profile`,
      `Up to ${FREE_LIMITS.maxActiveChores} active chores`,
      "XP, levels, streaks & badges",
      "Parent verification & quality ratings",
      "Rewards & redemption flow",
      "Installable PWA — no app store needed",
    ],
  },
  premium: {
    name: "Premium",
    price: "Free trial",
    priceSuffix: `${TRIAL_DAYS}-day free trial, then paid`,
    trialDays: TRIAL_DAYS,
    features: [
      "Unlimited children in one family",
      "Unlimited active chores",
      "Everything in Free",
      "Priority support",
    ],
  },
} as const;
