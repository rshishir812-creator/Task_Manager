import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`,                changeFrequency: "weekly",  priority: 1.0, lastModified },
    { url: `${SITE_URL}/faq`,             changeFrequency: "monthly", priority: 0.9, lastModified },
    { url: `${SITE_URL}/login`,           changeFrequency: "monthly", priority: 0.7, lastModified },
    { url: `${SITE_URL}/legal/privacy`,   changeFrequency: "yearly",  priority: 0.4, lastModified },
    { url: `${SITE_URL}/legal/terms`,     changeFrequency: "yearly",  priority: 0.4, lastModified },
    { url: `${SITE_URL}/legal/notices`,   changeFrequency: "yearly",  priority: 0.3, lastModified },
  ];
}
