"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavProgress } from "@/components/ui/NavProgress";

const BASE_LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: "📋" },
  { href: "/admin/chores", label: "Chores", icon: "⚔️" },
  { href: "/admin/badges", label: "Badges", icon: "🏅" },
  { href: "/admin/calendar", label: "Calendar", icon: "📅" },
  { href: "/admin/points", label: "Points", icon: "💰" },
  { href: "/admin/family", label: "Family", icon: "👨‍👩‍👧" },
];

const SUPER_LINK = { href: "/admin/super", label: "Super", icon: "🛡️" };

export default function AdminNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const { start } = useNavProgress();
  const links = isSuperAdmin ? [...BASE_LINKS, SUPER_LINK] : BASE_LINKS;

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
              {link.label}
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
                className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-3 text-xs min-h-[44px] transition-colors ${
                  active ? "text-accent-amber font-semibold" : "text-fg-muted hover:text-fg"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-xl leading-none">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
