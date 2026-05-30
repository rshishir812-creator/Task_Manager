import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChoreQuest",
    short_name: "ChoreQuest",
    description: "Make chores a quest. Not a fight.",
    // Role-agnostic launch target: middleware redirects "/" to /admin/dashboard
    // for parents/super-admins and /dashboard for children. Hardcoding
    // "/dashboard" here sent parents to the child view on PWA cold launch.
    start_url: "/",
    display: "standalone",
    background_color: "#0B0F2A",
    theme_color: "#0B0F2A",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
