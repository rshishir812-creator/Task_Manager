import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await createAdminClient()
    .from("profiles").select("role").eq("id", user.id).single() as { data: Pick<Profile, "role"> | null; error: unknown };
  return data?.role === "admin";
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids } = await request.json() as { ids: string[] };
  const adminClient = createAdminClient();

  await Promise.all(
    ids.map((id, index) =>
      adminClient.from("chores").update({ sort_order: index }).eq("id", id)
    )
  );

  return NextResponse.json({ ok: true });
}
