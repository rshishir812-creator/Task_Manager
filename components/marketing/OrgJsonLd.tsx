import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SUPPORT_EMAIL,
  PLAN_COPY,
} from "@/lib/marketing/site";

// Combined Organization + WebApplication JSON-LD for the homepage. Gives both
// search engines and LLMs a structured, machine-readable summary of what
// ChoreQuest is, who runs it, what it costs and where to find canonical pages.
// No aggregateRating is included — we don't yet have real reviews and faking
// them violates schema.org guidelines and damages LLM trust.
export default function OrgJsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      email: SUPPORT_EMAIL,
      areaServed: "Worldwide",
      knowsLanguage: "en",
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "LifestyleApplication",
      applicationSubCategory: "Parenting & Family",
      operatingSystem: "Web, iOS (PWA), Android (PWA)",
      browserRequirements: "Requires a modern browser with JavaScript enabled.",
      isAccessibleForFree: true,
      inLanguage: "en",
      audience: {
        "@type": "Audience",
        audienceType: "Families with children",
      },
      offers: [
        {
          "@type": "Offer",
          name: PLAN_COPY.free.name,
          price: "0",
          priceCurrency: "INR",
          description: `${PLAN_COPY.free.maxChildren} child profile and up to ${PLAN_COPY.free.maxActiveChores} active chores.`,
        },
        {
          "@type": "Offer",
          name: PLAN_COPY.premium.name,
          description: `Unlimited children and chores. Starts with a ${PLAN_COPY.premium.trialDays}-day free trial.`,
        },
      ],
      featureList: [
        "Chore scheduling with weekday recurrence",
        "XP, levels, streaks and badges",
        "Parent verification with optional quality rating",
        "Rewards and redemption flow",
        "Parent insights dashboard",
        "Installable PWA",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "en",
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
