"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Profile } from "@/lib/types";

interface ChildPickerProps {
  kids: Profile[];
  currentChildId: string | null;
}

export default function ChildPicker({ kids, currentChildId }: ChildPickerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (kids.length <= 1) return null; // hidden when only one child

  function pick(id: string) {
    const params = new URLSearchParams(searchParams);
    params.set("child", id);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-1">
      {kids.map((c) => {
        const active = c.id === currentChildId;
        return (
          <button
            key={c.id}
            onClick={() => pick(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active
                ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/40"
                : "border border-[var(--border)] text-fg-muted hover:text-fg hover:border-fg-muted"
            }`}
            aria-current={active ? "true" : undefined}
          >
            {c.name?.split(" ")[0] ?? "Child"}
          </button>
        );
      })}
      <Link
        href="/admin/family"
        className="px-3 py-1.5 rounded-full text-xs font-medium text-fg-muted border border-dashed border-[var(--border)] hover:text-accent-amber hover:border-accent-amber transition-colors"
      >
        + Add child
      </Link>
    </div>
  );
}
