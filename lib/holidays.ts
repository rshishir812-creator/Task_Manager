import { createAdminClient } from "@/lib/supabase/admin";
import type { Holiday } from "@/lib/types";

// Holidays are exemption windows per child. A date inside any of a child's
// holiday ranges is treated like a non-scheduled day everywhere (streaks,
// badges, daily bonus, consistency), so missing chores on those days never
// penalises. This module turns holiday rows into a fast date-lookup Set.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Expand inclusive [start_date, end_date] ranges into a Set of YYYY-MM-DD. */
export function expandHolidaysToSet(rows: Pick<Holiday, "start_date" | "end_date">[]): Set<string> {
  const set = new Set<string>();
  for (const r of rows) {
    let cursor = new Date(`${r.start_date}T00:00:00Z`).getTime();
    const end = new Date(`${r.end_date}T00:00:00Z`).getTime();
    // Guard against malformed/huge ranges (cap at ~2 years of days).
    for (let i = 0; cursor <= end && i < 800; i++) {
      set.add(new Date(cursor).toISOString().slice(0, 10));
      cursor += MS_PER_DAY;
    }
  }
  return set;
}

/** All holiday dates for one child as a Set<YYYY-MM-DD>. */
export async function getHolidaySetForUser(userId: string): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("holidays")
    .select("start_date, end_date")
    .eq("user_id", userId);
  return expandHolidaysToSet((data as Pick<Holiday, "start_date" | "end_date">[] | null) ?? []);
}

/** Map of userId -> holiday date Set, for every child in a family. */
export async function getHolidaySetsForFamily(familyId: string): Promise<Map<string, Set<string>>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("holidays")
    .select("user_id, start_date, end_date")
    .eq("family_id", familyId);
  const rows = (data as Pick<Holiday, "user_id" | "start_date" | "end_date">[] | null) ?? [];
  const byUser = new Map<string, Pick<Holiday, "start_date" | "end_date">[]>();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id)!.push(r);
  }
  const out = new Map<string, Set<string>>();
  byUser.forEach((list, uid) => out.set(uid, expandHolidaysToSet(list)));
  return out;
}
