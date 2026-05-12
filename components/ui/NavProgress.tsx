"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type NavProgressCtx = { start: () => void };
const NavProgressContext = createContext<NavProgressCtx>({ start: () => {} });

export function useNavProgress() {
  return useContext(NavProgressContext);
}

export function NavProgressProvider({
  children,
  color = "teal",
}: {
  children: React.ReactNode;
  color?: "teal" | "amber";
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // When pathname changes, complete the bar
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      if (status === "loading") {
        clearTimeout(timerRef.current);
        setStatus("done");
        timerRef.current = setTimeout(() => setStatus("idle"), 400);
      }
    }
  }, [pathname, status]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const start = useCallback(() => {
    setStatus("loading");
    // Failsafe: auto-reset if navigation never completes
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus("idle"), 10_000);
  }, []);

  const barColor =
    color === "teal" ? "var(--accent-teal)" : "var(--accent-amber)";

  return (
    <NavProgressContext.Provider value={{ start }}>
      <AnimatePresence>
        {status !== "idle" && (
          <motion.div
            key="nav-progress-bar"
            className="fixed top-0 left-0 z-50 h-[3px] pointer-events-none"
            style={{ backgroundColor: barColor }}
            initial={{ width: "0%", opacity: 1 }}
            animate={
              status === "loading"
                ? {
                    width: "75%",
                    transition: { duration: 6, ease: [0.1, 0.3, 0.6, 1] },
                  }
                : {
                    width: "100%",
                    transition: { duration: 0.2, ease: "easeOut" },
                  }
            }
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          />
        )}
      </AnimatePresence>
      {children}
    </NavProgressContext.Provider>
  );
}
