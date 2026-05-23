import type { Metadata, Viewport } from "next";
import { Nunito, Baloo_2 } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
});

export const viewport: Viewport = {
  themeColor: "#0B0F2A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ChoreQuest",
  description: "Gamified daily chores for kids and parents",
  applicationName: "ChoreQuest",
  appleWebApp: {
    capable: true,
    title: "ChoreQuest",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${nunito.variable} ${baloo.variable}`}>
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
