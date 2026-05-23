"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import ContactUsModal from "./ContactUsModal";

interface ContactUsButtonProps {
  email: string;
  userName: string | null;
}

export default function ContactUsButton({ email, userName }: ContactUsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Contact us / Send feedback"
        title="Contact us"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-elevated border border-[var(--border)] text-fg-muted transition-colors hover:text-fg focus:outline-none focus:ring-2 focus:ring-accent-teal"
      >
        <Mail size={16} />
      </button>
      {isOpen && (
        <ContactUsModal
          email={email}
          userName={userName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
