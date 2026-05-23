import { redirect } from "next/navigation";
import Link from "next/link";
import { getSuperAdminContext } from "@/lib/auth-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import FeedbackDetail from "@/components/admin/FeedbackDetail";
import type { Feedback, FeedbackStatus, Family } from "@/lib/types";

const STATUS_FILTERS: { value: "all" | FeedbackStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: "bg-accent-teal/15 text-accent-teal border-accent-teal/30",
  in_progress: "bg-accent-amber/15 text-accent-amber border-accent-amber/30",
  resolved: "bg-green-500/15 text-green-400 border-green-500/30",
  archived: "bg-fg-muted/10 text-fg-muted border-fg-muted/20",
};

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface PageProps {
  searchParams?: { status?: string; q?: string; open?: string };
}

export default async function FeedbackInboxPage({ searchParams }: PageProps) {
  const ctx = await getSuperAdminContext();
  if (!ctx) redirect("/admin/dashboard");

  const statusFilter = (searchParams?.status ?? "all") as "all" | FeedbackStatus;
  const q = (searchParams?.q ?? "").trim();
  const openId = searchParams?.open ?? null;

  const admin = createAdminClient();
  let query = admin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (q.length > 0) {
    const safe = q.replace(/[%_]/g, "\\$&");
    query = query.or(`subject.ilike.%${safe}%,message.ilike.%${safe}%`);
  }

  const { data: rows } = (await query) as { data: Feedback[] | null };
  const feedback = rows ?? [];

  // Build family-name map for display
  const familyIds = Array.from(new Set(feedback.map((f) => f.family_id)));
  let familyMap = new Map<string, string>();
  if (familyIds.length > 0) {
    const { data: families } = (await admin
      .from("families")
      .select("id, name")
      .in("id", familyIds)) as { data: Pick<Family, "id" | "name">[] | null };
    familyMap = new Map((families ?? []).map((f) => [f.id, f.name]));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-fg">Feedback inbox</h1>
        <p className="text-sm text-fg-muted mt-1">
          Parent feedback across every family. Triage, mark status, add private notes.
        </p>
      </div>

      {/* Filter bar */}
      <form method="get" className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            const params = new URLSearchParams();
            if (f.value !== "all") params.set("status", f.value);
            if (q) params.set("q", q);
            return (
              <Link
                key={f.value}
                href={`/admin/feedback${params.toString() ? `?${params}` : ""}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "bg-accent-amber text-black border-accent-amber font-semibold"
                    : "border-[var(--border)] text-fg-muted hover:text-fg"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {statusFilter !== "all" && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search subject + message…"
            className="rounded-lg border border-[var(--border)] bg-bg-elevated text-fg text-sm px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-accent-teal"
          />
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg bg-bg-elevated border border-[var(--border)] text-fg hover:border-accent-teal"
          >
            Search
          </button>
        </div>
      </form>

      {/* List */}
      <div className="flex flex-col gap-2">
        {feedback.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-fg-muted">
            No feedback {statusFilter !== "all" ? `with status "${statusFilter}"` : "yet"}.
          </div>
        )}

        {feedback.map((row) => {
          const isOpen = openId === row.id;
          const params = new URLSearchParams();
          if (statusFilter !== "all") params.set("status", statusFilter);
          if (q) params.set("q", q);
          if (!isOpen) params.set("open", row.id);

          return (
            <div
              key={row.id}
              className={`rounded-2xl border bg-bg-elevated overflow-hidden transition-colors ${
                isOpen ? "border-accent-teal/40" : "border-[var(--border)]"
              }`}
            >
              <Link
                href={`/admin/feedback?${params.toString()}${isOpen ? "" : ""}#${row.id}`}
                id={row.id}
                className="block px-4 py-3 hover:bg-bg/40 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 ${STATUS_STYLES[row.status]}`}
                  >
                    {row.status.replace("_", " ")}
                  </span>
                  <span className="font-display font-bold text-fg text-sm flex-1 min-w-0 truncate">
                    {row.subject}
                  </span>
                  <span className="text-xs text-fg-muted">{fmtRelative(row.created_at)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
                  <span className="text-fg">{row.user_name ?? "Unknown"}</span>
                  <span>·</span>
                  <span>{row.user_email}</span>
                  <span>·</span>
                  <span>{familyMap.get(row.family_id) ?? "Family"}</span>
                </div>
                {!isOpen && (
                  <p className="mt-2 text-xs text-fg-muted line-clamp-1">
                    {row.message}
                  </p>
                )}
              </Link>

              {isOpen && <FeedbackDetail feedback={row} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
