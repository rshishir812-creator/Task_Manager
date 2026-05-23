"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import WalkthroughOverlay from "./WalkthroughOverlay";

interface WalkthroughManagerProps {
  role: "parent" | "child";
  seenAt: string | null;
}

const SUPPRESSED_PATHS = ["/admin/privacy-consent"];

export default function WalkthroughManager({ role, seenAt }: WalkthroughManagerProps) {
  const pathname = usePathname();
  const suppressAuto = SUPPRESSED_PATHS.some((p) => pathname?.startsWith(p));

  const shouldAutoOpen = seenAt === null && !suppressAuto;
  const [isOpen, setIsOpen] = useState(shouldAutoOpen);
  const [isAutoLaunch, setIsAutoLaunch] = useState(shouldAutoOpen);

  useEffect(() => {
    const handler = () => {
      setIsAutoLaunch(false);
      setIsOpen(true);
    };
    window.addEventListener("chorequest:open-walkthrough", handler);
    return () => window.removeEventListener("chorequest:open-walkthrough", handler);
  }, []);

  if (!isOpen) return null;

  return (
    <WalkthroughOverlay
      role={role}
      isAutoLaunch={isAutoLaunch}
      onClose={() => setIsOpen(false)}
    />
  );
}
