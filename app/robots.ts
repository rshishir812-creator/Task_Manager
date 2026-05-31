import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Auth-walled or API surfaces — keep out of all crawl indexes.
        disallow: ["/api/", "/admin/", "/dashboard/", "/profile", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
