"use client";

import { useState } from "react";
import WhatsNewModal from "./WhatsNewModal";
import { WHATS_NEW_VERSION } from "@/lib/whats-new";
import { postJsonWithAuthRetry } from "@/lib/fetch-with-auth";

// Shows the announcement once per release. `seenVersion` is the value stored on
// the profile; when it doesn't match the current version we show the modal and,
// on dismiss, persist the new version so it never reappears.
export default function WhatsNewManager({ seenVersion }: { seenVersion: string | null }) {
  const [open, setOpen] = useState(seenVersion !== WHATS_NEW_VERSION);

  if (!open) return null;

  async function dismiss() {
    setOpen(false);
    try {
      await postJsonWithAuthRetry("/api/whats-new/dismiss", {});
    } catch {
      // Best-effort — worst case it shows once more next session.
    }
  }

  return <WhatsNewModal onDone={dismiss} />;
}
