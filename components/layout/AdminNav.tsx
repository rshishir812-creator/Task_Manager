"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavProgress } from "@/components/ui/NavProgress";
import ContactUsModal from "@/components/feedback/ContactUsModal";

type NavLink = {
  href: string;
  label: string;
  icon: string;
  kind?: "feedback";
};

const BASE_LINKS: NavLink[] = [
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
  { href: "/admin/feedback", label: "Feedback", icon: "✉️", kind: "feedback" },
];

const SUPER_LINK: NavLink = { href: "/admin/super", label: "Super", icon: "🛡️" };

// Nav entries gated behind Premium (or an active trial). Locked items route to
// the upgrade page instead of the feature.
const PREMIUM_HREFS = new Set(["/admin/insights", "/admin/rewards", "/admin/redemptions"]);

export default function AdminNav({
  isSuperAdmin = false,
  pendingRedemptionCount = 0,
  pendingVerificationCount = 0,
  newFeedbackCount = 0,
  userEmail,
  userName,
  hasPremiumAccess = true,
}: {
  isSuperAdmin?: boolean;
  pendingRedemptionCount?: number;
  pendingVerificationCount?: number;
  newFeedbackCount?: number;
  userEmail: string;
  userName: string | null;
  hasPremiumAccess?: boolean;
}) {
  const pathname = usePathname();
  const { start } = useNavProgress();
  const [contactOpen, setContactOpen] = useState(false);
  const links = isSuperAdmin ? [...BASE_LINKS, SUPER_LINK] : BASE_LINKS;

  // Super admins are never gated.
  const isLocked = (link: NavLink) =>
    !isSuperAdmin && !hasPremiumAccess && PREMIUM_HREFS.has(link.href);

  function renderBadge(link: NavLink, variant: "sidebar" | "bottom") {
    const baseClass =
      variant === "sidebar"
        ? "text-[10px] bg-accent-amber text-black rounded-full px-1.5 py-0.5 font-bold leading-none"
        : "absolute top-1.5 right-1/4 text-[9px] bg-accent-amber text-black rounded-full px-1 py-0.5 font-bold leading-none";
    if (link.href === "/admin/redemptions" && pendingRedemptionCount > 0) {
      return <span className={baseClass}>{pendingRedemptionCount}</span>;
    }
    if (link.href === "/admin/verifications" && pendingVerificationCount > 0) {
      return <span className={baseClass}>{pendingVerificationCount}</span>;
    }
    if (link.href === "/admin/feedback" && newFeedbackCount > 0) {
      return <span className={baseClass}>{newFeedbackCount}</span>;
    }
    return null;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-[var(--border)] bg-bg-elevated min-h-screen sticky top-0 pt-4 px-3 gap-1">
        <p className="text-xs text-fg-muted uppercase tracking-widest px-3 mb-2">Admin</p>
        {links.map((link) => {
          const locked = isLocked(link);
          const href = locked ? "/admin/upgrade" : link.href;
          const active = !locked && (pathname === link.href || (link.href !== "/admin/dashboard" && pathname.startsWith(link.href)));
          const sidebarClass = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            active ? "bg-accent-amber/20 text-accent-amber" : "text-fg-muted hover:bg-bg hover:text-fg"
          }`;
          const inner = (
            <>
              <span className={`text-base ${locked ? "opacity-60" : ""}`}>{link.icon}</span>
              <span className={`flex-1 text-left ${locked ? "opacity-60" : ""}`}>{link.label}</span>
              {locked ? <span className="text-xs">🔒</span> : renderBadge(link, "sidebar")}
            </>
          );

          if (link.kind === "feedback" && !isSuperAdmin) {
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => setContactOpen(true)}
                className={sidebarClass}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={link.href}
              href={href}
              onClick={() => { if (!active) start(); }}
              className={sidebarClass}
              aria-current={active ? "page" : undefined}
            >
              {inner}
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-elevated border-t border-[var(--border)]">
        <div className="flex overflow-x-auto">
          {links.map((link) => {
            const locked = isLocked(link);
            const href = locked ? "/admin/upgrade" : link.href;
            const active = !locked && (pathname === link.href || (link.href !== "/admin/dashboard" && pathname.startsWith(link.href)));
            const bottomClass = `relative flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-3 text-xs min-h-[44px] transition-colors ${
              active ? "text-accent-amber font-semibold" : "text-fg-muted hover:text-fg"
            }`;
            const inner = (
              <>
                <span className={`text-xl leading-none ${locked ? "opacity-60" : ""}`}>{link.icon}</span>
                <span className={locked ? "opacity-60" : ""}>{link.label}</span>
                {locked ? (
                  <span className="absolute top-1.5 right-1/4 text-[9px]">🔒</span>
                ) : (
                  renderBadge(link, "bottom")
                )}
              </>
            );

            if (link.kind === "feedback" && !isSuperAdmin) {
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className={bottomClass}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link
                key={link.href}
                href={href}
                onClick={() => { if (!active) start(); }}
                className={bottomClass}
                aria-current={active ? "page" : undefined}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </nav>

      {contactOpen && (
        <ContactUsModal
          email={userEmail}
          userName={userName}
          onClose={() => setContactOpen(false)}
        />
      )}
    </>
  );
}
