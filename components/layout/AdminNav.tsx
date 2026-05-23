"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavProgress } from "@/components/ui/NavProgress";

const BASE_LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: "📋" },
  { href: "/admin/chores", label: "Chores", icon: "⚔️" },
  { href: "/admin/badges", label: "Badges", icon: "🏅" },
  { href: "/admin/calendar", label: "Calendar", icon: "📅" },
  { href: "/admin/insights", label: "Insights", icon: "📈" },
  { href: "/admin/verifications", label: "Verify", icon: "🔍" },
  { href: "/admin/rewards", label: "Rewards", icon: "🎁" },
  { href: "/admin/redemptions", label: "Redeem", icon: "📬" },
  { href: "/admin/points", label: "Points", icon: "💰" },
  { href: "/admin/family", label: "Family", icon: "👨‍👩‍👧" },
];

const FEEDBACK_LINK = { href: "/admin/feedback", label: "Feedback", icon: "✉️" };
const SUPER_LINK = { href: "/admin/super", label: "Super", icon: "🛡️" };

export default function AdminNav({
  isSuperAdmin = false,
  pendingRedemptionCount = 0,
  pendingVerificationCount = 0,
  newFeedbackCount = 0,
}: {
  isSuperAdmin?: boolean;
  pendingRedemptionCount?: number;
  pendingVerificationCount?: number;
  newFeedbackCount?: number;
}) {
  const pathname = usePathname();
  const { start } = useNavProgress();
  const links = isSuperAdmin ? [...BASE_LINKS, FEEDBACK_LINK, SUPER_LINK] : BASE_LINKS;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-[var(--border)] bg-bg-elevated min-h-screen sticky top-0 pt-4 px-3 gap-1">
        <p className="text-xs text-fg-muted uppercase tracking-widest px-3 mb-2">Admin</p>
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/admin/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => { if (!active) start(); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-amber/20 text-accent-amber"
                  : "text-fg-muted hover:bg-bg hover:text-fg"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              {link.href === "/admin/redemptions" && pendingRedemptionCount > 0 && (
                <span className="text-[10px] bg-accent-amber text-black rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {pendingRedemptionCount}
                </span>
              )}
              {link.href === "/admin/verifications" && pendingVerificationCount > 0 && (
                <span className="text-[10px] bg-accent-amber text-black rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {pendingVerificationCount}
                </span>
              )}
              {link.href === "/admin/feedback" && newFeedbackCount > 0 && (
                <span className="text-[10px] bg-accent-amber text-black rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {newFeedbackCount}
                </span>
              )}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-elevated border-t border-[var(--border)]">
        <div className="flex overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/admin/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => { if (!active) start(); }}
                className={`relative flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-3 text-xs min-h-[44px] transition-colors ${
                  active ? "text-accent-amber font-semibold" : "text-fg-muted hover:text-fg"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-xl leading-none">{link.icon}</span>
                <span>{link.label}</span>
                {link.href === "/admin/redemptions" && pendingRedemptionCount > 0 && (
                  <span className="absolute top-1.5 right-1/4 text-[9px] bg-accent-amber text-black rounded-full px-1 py-0.5 font-bold leading-none">
                    {pendingRedemptionCount}
                  </span>
                )}
                {link.href === "/admin/verifications" && pendingVerificationCount > 0 && (
                  <span className="absolute top-1.5 right-1/4 text-[9px] bg-accent-amber text-black rounded-full px-1 py-0.5 font-bold leading-none">
                    {pendingVerificationCount}
                  </span>
                )}
                {link.href === "/admin/feedback" && newFeedbackCount > 0 && (
                  <span className="absolute top-1.5 right-1/4 text-[9px] bg-accent-amber text-black rounded-full px-1 py-0.5 font-bold leading-none">
                    {newFeedbackCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
