"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavProgress } from "@/components/ui/NavProgress";

const TABS = [
  { href: "/dashboard", label: "Today", icon: "🏠" },
  { href: "/dashboard/history", label: "History", icon: "📅" },
  { href: "/dashboard/rewards", label: "Rewards", icon: "🎁" },
  { href: "/dashboard/badges", label: "Badges", icon: "🏆" },
  { href: "/dashboard/stats", label: "Stats", icon: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { start } = useNavProgress();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg-elevated border-t border-[var(--border)] safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const active =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => { if (!active) start(); }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-colors min-h-[44px] ${
                active
                  ? "text-accent-teal font-semibold"
                  : "text-fg-muted hover:text-fg"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
