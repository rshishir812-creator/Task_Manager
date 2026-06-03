"use client";

import { Analytics } from "@vercel/analytics/react";

const PRIVATE_PREFIXES = ["/admin", "/dashboard", "/profile"];

export default function PublicAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const path = event.url ? new URL(event.url).pathname : "";
        if (PRIVATE_PREFIXES.some((p) => path.startsWith(p))) return null;
        return event;
      }}
    />
  );
}
