"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Gentle, dismissible invitation to install ChoreQuest to the home screen.
 * Pure browser-state driven — no role/payment logic, so it's safe in the child
 * dashboard layout too. On Chrome/Edge/Android it drives the native install via
 * the `beforeinstallprompt` event; on iOS Safari (which has no such event) it
 * shows the manual "Add to Home Screen" instruction instead.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "cq:installprompt:dismissed";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // re-offer after 14 days
const SHOW_DELAY_MS = 2500;

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(ts) && ts > 0 && Date.now() - ts < SNOOZE_MS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  // Exclude in-app webviews (FB/IG/etc.) and Chrome-on-iOS (CriOS) which can't add to home screen.
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return ios && safari;
}

export default function InstallAppPrompt({
  accent = "teal",
}: {
  accent?: "teal" | "amber";
}) {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    let delayTimer: number | undefined;
    const reveal = () => {
      delayTimer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      reveal();
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — fall back to manual instructions.
    if (isIosSafari()) {
      setIos(true);
      reveal();
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (delayTimer) window.clearTimeout(delayTimer);
    };
  }, []);

  function snooze() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  function dismiss() {
    setVisible(false);
    setShowIosHint(false);
    snooze();
  }

  async function handleInstall() {
    if (ios) {
      setShowIosHint((s) => !s);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    snooze();
  }

  const accentBtn = accent === "amber" ? "bg-accent-amber text-black" : "bg-accent-teal text-bg-elevated";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.25 }}
          className="fixed top-below-header left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-sm px-4 py-3 rounded-2xl bg-bg-elevated border border-[var(--border)] shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📲</span>
            <div className="flex-1 text-sm text-fg min-w-0">
              <p className="font-semibold leading-tight">Install ChoreQuest</p>
              <p className="text-xs text-fg-muted">
                {ios
                  ? "Add it to your home screen for a full-screen app."
                  : "Add it to your home screen — faster, full-screen, no browser bars."}
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={handleInstall}
                className={`px-3 py-1 text-xs font-semibold rounded-lg ${accentBtn}`}
              >
                {ios ? "How to" : "Install"}
              </button>
              <button onClick={dismiss} className="px-3 py-1 text-xs text-fg-muted">
                Not now
              </button>
            </div>
          </div>

          {ios && showIosHint && (
            <p className="mt-2 pt-2 border-t border-[var(--border)] text-xs text-fg-muted leading-snug">
              Tap the <span className="font-semibold text-fg">Share</span> icon in Safari, then choose{" "}
              <span className="font-semibold text-fg">&ldquo;Add to Home Screen&rdquo;</span>.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
