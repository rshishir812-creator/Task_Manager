import type { FaqItem } from "@/lib/marketing/faq";

interface FaqJsonLdProps {
  items: readonly FaqItem[];
}

// FAQPage schema.org structured data. Google uses this for FAQ rich results
// and most LLM retrieval pipelines (Perplexity, Bing/ChatGPT, Gemini) read it
// to build authoritative Q&A summaries.
export default function FaqJsonLd({ items }: FaqJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify produces safe JSON; no user input goes in here.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
