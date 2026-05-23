import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { subject?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (subject.length < 1 || subject.length > 160) {
    return NextResponse.json({ error: "Subject must be 1–160 characters." }, { status: 400 });
  }
  if (message.length < 1 || message.length > 4000) {
    return NextResponse.json({ error: "Message must be 1–4000 characters." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("family_id, email, name")
    .eq("id", user.id)
    .single() as { data: Pick<Profile, "family_id" | "email" | "name"> | null; error: unknown };

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { error } = await admin.from("feedback").insert({
    family_id: profile.family_id,
    user_id: user.id,
    user_email: profile.email,
    user_name: profile.name,
    subject,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
