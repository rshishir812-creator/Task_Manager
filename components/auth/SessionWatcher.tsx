"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

const INTENTIONAL_SIGNOUT_KEY = "chorequest:intentional-signout";

function consumeIntentionalSignOut(): boolean {
  try {
    if (sessionStorage.getItem(INTENTIONAL_SIGNOUT_KEY) === "1") {
      sessionStorage.removeItem(INTENTIONAL_SIGNOUT_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default function SessionWatcher() {
  const [expired, setExpired] = useState(false);
  const redirectingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const triggerExpired = () => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      setExpired(true);
      window.setTimeout(() => {
        window.location.assign("/login");
      }, 1200);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Intentional sign-out from SignOutButton — silent, no toast.
        // The button itself is already navigating to /login.
        if (consumeIntentionalSignOut()) {
          redirectingRef.current = true;
          return;
        }
        triggerExpired();
      } else if (event === "TOKEN_REFRESHED" && !session) {
        // Refresh failed — show the expired toast.
        triggerExpired();
      }
    });

    // When the app regains focus (PWA reopened, tab refocused) the access token
    // may have expired while we were away. Don't jump straight to /login on a
    // momentarily-empty session — first try to refresh it. Only a genuinely
    // failed refresh means the session is really gone.
    //
    // When the session IS still good, re-sync the server components via
    // router.refresh(). Server-rendered shells (the admin nav, the premium
    // plan, super-admin tabs) are computed at request time and otherwise stay
    // frozen on whatever was rendered before we backgrounded — which is why
    // users came back to a "limited tabs" view and had to sign out/in to get
    // the full nav. This restores it without re-authenticating.
    const checkSession = async () => {
      if (document.visibilityState !== "visible") return;
      if (redirectingRef.current) return;

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.refresh();
        return;
      }

      // No local session — attempt one refresh before giving up.
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        router.refresh();
      } else {
        triggerExpired();
      }
    };

    document.addEventListener("visibilitychange", checkSession);

    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [router]);

  return (
    <AnimatePresence>
      {expired && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-above-nav left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-bg-elevated border border-accent-amber/40 shadow-lg text-sm text-fg max-w-xs text-center"
        >
          ⏰ Session expired — signing you back in…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
