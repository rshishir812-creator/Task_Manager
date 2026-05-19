import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChoreAssignment, Profile } from "@/lib/types";

export interface ParentContext {
  user: { id: string; email?: string };
  profile: Profile;
  familyId: string;
  isSuperAdmin: boolean;
}

/**
 * Returns the current parent's context (profile + family_id) or null if the
 * requester isn't authenticated, isn't a parent, and isn't a super admin.
 *
 * Super admins always have a family_id (their own family). They pass this gate.
 */
export async function getParentContext(): Promise<ParentContext | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await createAdminClient()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as { data: Profile | null; error: unknown };

  if (!data) return null;
  if (data.role !== "parent" && !data.is_super_admin) return null;

  return {
    user: { id: user.id, email: user.email },
    profile: data,
    familyId: data.family_id,
    isSuperAdmin: data.is_super_admin,
  };
}

/**
 * Like getParentContext, but requires super admin specifically.
 */
export async function getSuperAdminContext(): Promise<ParentContext | null> {
  const ctx = await getParentContext();
  if (!ctx || !ctx.isSuperAdmin) return null;
  return ctx;
}

/**
 * Returns the children (role='child') in the given family.
 */
export async function getChildrenOfFamily(familyId: string): Promise<Profile[]> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("*")
    .eq("family_id", familyId)
    .eq("role", "child")
    .order("created_at");
  return (data as Profile[] | null) ?? [];
}

/**
 * Resolves which child to operate on for an admin page or API call.
 * - If `?child=<id>` is in the URL and that id is a child of this family, use it.
 * - Otherwise, returns the first child of the family (or null if none yet).
 *
 * Super admins viewing another family can pass any child id of that family.
 */
export async function resolveChild(
  familyId: string,
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
  isSuperAdmin = false,
): Promise<Profile | null> {
  const children = await getChildrenOfFamily(familyId);

  const requested =
    searchParams instanceof URLSearchParams
      ? searchParams.get("child") ?? undefined
      : typeof searchParams?.child === "string"
      ? searchParams.child
      : undefined;

  if (requested) {
    const match = children.find((c) => c.id === requested);
    if (match) return match;
    if (isSuperAdmin) {
      // Super admin can reach across families
      const { data } = await createAdminClient()
        .from("profiles")
        .select("*")
        .eq("id", requested)
        .eq("role", "child")
        .single() as { data: Profile | null; error: unknown };
      if (data) return data;
    }
  }

  return children[0] ?? null;
}

/**
 * Returns full assignment rows for a user. Used by the streak calculators
 * so they can tell when each assignment took effect / was removed.
 */
export async function getAssignmentsForUser(userId: string): Promise<ChoreAssignment[]> {
  const { data } = await createAdminClient()
    .from("chore_assignments")
    .select("*")
    .eq("user_id", userId);
  return (data as ChoreAssignment[] | null) ?? [];
}

/**
 * Returns the set of chore ids currently assigned to a specific user
 * (filters out soft-removed ones). A child sees a chore on their dashboard
 * iff its id is in this set.
 */
export async function getAssignedChoreIds(userId: string): Promise<Set<string>> {
  const { data } = await createAdminClient()
    .from("chore_assignments")
    .select("chore_id, removed_at")
    .eq("user_id", userId)
    .is("removed_at", null);
  return new Set(((data as { chore_id: string }[] | null) ?? []).map((r) => r.chore_id));
}

/**
 * Checks whether a chore is assigned to a specific user.
 */
export async function isChoreAssigned(choreId: string, userId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("chore_assignments")
    .select("chore_id")
    .eq("chore_id", choreId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/**
 * Checks whether a target user_id is a child of the given family. Used by API
 * routes to authorize per-child writes (badge award, points override, etc.).
 */
export async function isChildOfFamily(targetUserId: string, familyId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .eq("family_id", familyId)
    .eq("role", "child")
    .maybeSingle();
  return !!data;
}
