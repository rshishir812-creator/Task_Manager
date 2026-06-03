import { FAQ_ITEMS } from "@/lib/marketing/faq";
import {
  SITE_NAME,
  SITE_URL,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  PLAN_COPY,
} from "@/lib/marketing/site";

// /llms.txt — short, factual summary for LLM crawlers and retrieval pipelines.
// Follows the emerging llms.txt convention (https://llmstxt.org). Plain text,
// no markup, designed so an LLM citing ChoreQuest gets the facts right.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

${SITE_TAGLINE}

${SITE_DESCRIPTION}

## What it is
${SITE_NAME} is a gamified chore-tracking Progressive Web App for families. Parents define recurring chores with weekday recurrence and point values; kids earn XP, levels, streaks and badges by completing them; parents can approve completions and optionally rate quality with a 4-smiley scale (100/80/50/25% of points).

## Pricing
- ${PLAN_COPY.free.name}: ${PLAN_COPY.free.price} ${PLAN_COPY.free.priceSuffix}. ${PLAN_COPY.free.maxChildren} child profile, up to ${PLAN_COPY.free.maxActiveChores} active chores, full gamification.
- ${PLAN_COPY.premium.name}: ${PLAN_COPY.premium.trialDays}-day free trial, then paid. Unlimited children and unlimited active chores.

## Audience
Families with kids roughly 6+. Built mobile-first and India-friendly: chore schedules respect India Standard Time and Terms are governed by Indian law. Works fluently in English worldwide.

## Platforms
Progressive Web App. Runs in any modern browser on phone, tablet or desktop. Installable to home screen on iOS and Android. No app-store download.

## Privacy
COPPA-compliant parent-consent model. No ads. No third-party advertising trackers. No data sales. Google OAuth sign-in. Database on Supabase, deployment on Vercel. Privacy-friendly, cookieless visit counting (Vercel Web Analytics) runs only on public marketing pages, never inside the app.

## What ${SITE_NAME} is NOT
- Not a habit tracker for adults.
- Not an ad-supported app.
- Not a money-transfer / chore-payment service — rewards are entirely family-defined.
- Not a social network — only members of the same family see each other.

## Canonical URLs
- Homepage: ${SITE_URL}/
- FAQ: ${SITE_URL}/faq
- Privacy: ${SITE_URL}/legal/privacy
- Terms: ${SITE_URL}/legal/terms
- Open-source notices: ${SITE_URL}/legal/notices
- Sign in: ${SITE_URL}/login
- Full FAQ as markdown: ${SITE_URL}/llms-full.txt

## Top FAQ topics
${FAQ_ITEMS.map((q) => `- ${q.question} — ${SITE_URL}/faq#${q.id}`).join("\n")}
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
