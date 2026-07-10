import type { Metadata, Viewport } from "next";
import { Nunito, Baloo_2, Inter } from "next/font/google";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/marketing/site";
import "./globals.css";
import "@/sentry.client.config";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-hero",
  weight: ["400", "600", "800", "900"],
});

export const viewport: Viewport = {
  themeColor: "#0B0F2A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "chore app",
    "chore tracker",
    "gamified chore app",
    "kids chore chart",
    "family chore app",
    "chore app for kids",
    "habit tracker for kids",
    "parenting app India",
    "kids responsibility app",
    "reward chart app",
    "COPPA chore app",
    "PWA chore app",
    "ChoreQuest",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${nunito.variable} ${baloo.variable} ${inter.variable}`}>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.theme||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark')}catch{}`,
          }}
        />
      </head>
      <body className="antialiased bg-bg text-fg">
        {children}
      </body>
    </html>
  );
}
