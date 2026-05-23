import type { Metadata, Viewport } from "next";
import { Nunito, Baloo_2, Inter } from "next/font/google";
import "./globals.css";

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
  title: "ChoreQuest — Make chores a quest. Not a fight.",
  description: "ChoreQuest turns daily habits into a game your kids actually want to play.",
  applicationName: "ChoreQuest",
  appleWebApp: {
    capable: true,
    title: "ChoreQuest",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "ChoreQuest — Make chores a quest. Not a fight.",
    description: "ChoreQuest turns daily habits into a game your kids actually want to play.",
    siteName: "ChoreQuest",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChoreQuest — Make chores a quest. Not a fight.",
    description: "ChoreQuest turns daily habits into a game your kids actually want to play.",
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
