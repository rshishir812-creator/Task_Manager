"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, User, Sun, Moon, HelpCircle, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "@/components/ui/useTheme";
import { signOut } from "@/lib/auth/sign-out";

interface ProfileMenuProps {
  avatarUrl: string | null;
  name: string | null;
  email?: string | null;
  accent: "amber" | "teal";
}

// Avatar dropdown that holds Profile, Theme, How-to and Sign out — moved out of
// the header so the wordmark / "Admin" badge stops getting overlapped on narrow
// screens.
export default function ProfileMenu({ avatarUrl, name, email, accent }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { mounted, isDark, toggle } = useTheme();

  const accentText = accent === "amber" ? "text-accent-amber" : "text-accent-teal";
  const accentBg = accent === "amber" ? "bg-accent-amber/20" : "bg-accent-teal/20";
  const initial = (name ?? "?").charAt(0).toUpperCase();
  const firstName = name?.split(" ")[0];

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = (size: number) =>
    avatarUrl ? (
      <Image src={avatarUrl} alt={name ?? "Avatar"} width={size} height={size} className="rounded-full" />
    ) : (
      <span
        className={`flex items-center justify-center rounded-full ${accentBg} ${accentText} font-bold`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </span>
    );

  const rowClass =
    "flex w-full items-center gap-3 px-4 py-2.5 text-sm text-fg transition-colors hover:bg-bg/60 focus:outline-none focus:bg-bg/60 disabled:opacity-70 disabled:cursor-wait";

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
  }

  function openWalkthrough() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("chorequest:open-walkthrough"));
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-teal"
      >
        {avatar(32)}
        {firstName && (
          <span className={`text-xs ${accentText} font-semibold hidden sm:block`}>{firstName}</span>
        )}
        <ChevronDown size={16} className="text-fg-muted" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--border)] bg-bg-elevated shadow-lg z-30"
          >
            {/* Identity header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              {avatar(36)}
              <div className="min-w-0">
                {name && <p className="truncate text-sm font-semibold text-fg">{name}</p>}
                {email && <p className="truncate text-xs text-fg-muted">{email}</p>}
              </div>
            </div>

            <Link href="/profile" role="menuitem" className={rowClass} onClick={() => setOpen(false)}>
              <User size={18} className="text-fg-muted" aria-hidden="true" />
              <span>Profile &amp; account</span>
            </Link>

            <button role="menuitem" onClick={toggle} className={rowClass} disabled={!mounted}>
              {isDark ? (
                <Sun size={18} className="text-fg-muted" aria-hidden="true" />
              ) : (
                <Moon size={18} className="text-fg-muted" aria-hidden="true" />
              )}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>

            <button role="menuitem" onClick={openWalkthrough} className={rowClass}>
              <HelpCircle size={18} className="text-fg-muted" aria-hidden="true" />
              <span>How to use</span>
            </button>

            <div className="border-t border-[var(--border)]" />

            <button role="menuitem" onClick={handleSignOut} disabled={signingOut} aria-busy={signingOut} className={rowClass}>
              {signingOut ? (
                <Loader2 size={18} className="animate-spin text-fg-muted" aria-hidden="true" />
              ) : (
                <LogOut size={18} className="text-fg-muted" aria-hidden="true" />
              )}
              <span>{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
