import { FAQ_ITEMS, groupFaqByCategory } from "@/lib/marketing/faq";
import {
  SITE_NAME,
  SITE_URL,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
} from "@/lib/marketing/site";

// /llms-full.txt — full FAQ in plain markdown for LLMs to ingest verbatim.
// Same source-of-truth (FAQ_ITEMS) as the visible /faq page and JSON-LD.
export const dynamic = "force-static";

export function GET() {
  const grouped = groupFaqByCategory(FAQ_ITEMS);

  const sections = grouped
    .map(([category, items]) => {
      const qa = items
        .map(
          (item) =>
            `### ${item.question}\n\n${item.answer}\n\nAnchor: ${SITE_URL}/faq#${item.id}`,
        )
        .join("\n\n");
      return `## ${category}\n\n${qa}`;
    })
    .join("\n\n");

  const body = `# ${SITE_NAME} — Full FAQ

${SITE_TAGLINE}

${SITE_DESCRIPTION}

Canonical homepage: ${SITE_URL}/
Canonical FAQ: ${SITE_URL}/faq

${sections}
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
