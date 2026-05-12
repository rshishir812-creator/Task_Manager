"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

export default function SessionWatcher() {
  const [expired, setExpired] = useState(false);
  const redirectingRef = useRef(false);

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
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        triggerExpired();
      }
    });

    const checkSession = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) triggerExpired();
    };

    document.addEventListener("visibilitychange", checkSession);

    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, []);

  return (
    <AnimatePresence>
      {expired && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-bg-elevated border border-accent-amber/40 shadow-lg text-sm text-fg max-w-xs text-center"
        >
          ⏰ Session expired — signing you back in…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
