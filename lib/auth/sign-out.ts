import { createClient } from "@/lib/supabase/client";

// Shared sign-out used by the header avatar menu and the /profile page.
// Flags the sign-out as intentional so SessionWatcher doesn't flash a
// "Session expired" toast, then hard-redirects so the authenticated React
// tree (and any cached server data) is fully torn down.
export async function signOut() {
  try {
    sessionStorage.setItem("chorequest:intentional-signout", "1");
  } catch {
    // sessionStorage can throw in some embedded contexts — ignore.
  }

  const supabase = createClient();
  await supabase.auth.signOut();

  window.location.replace("/login");
}
