import { createClient } from "@/lib/supabase/client";

/** Thrown when the session can't be refreshed, so callers can route to sign-in
 *  instead of showing a generic "failed to save" error. */
export const AUTH_EXPIRED = "AUTH_EXPIRED";

/**
 * POST JSON to an internal API route, transparently recovering from an expired
 * access token.
 *
 * PWAs/tabs left open in the background often wake with a stale JWT — the
 * browser throttles Supabase's token auto-refresh timer while the page is
 * hidden, so the first request after returning can carry an expired token and
 * 401. When that happens we force a single session refresh (which rewrites the
 * auth cookie) and retry the request once. If the refresh itself fails the
 * session is genuinely gone, so we throw AUTH_EXPIRED.
 */
export async function postJsonWithAuthRetry(
  url: string,
  body: unknown,
): Promise<Response> {
  const doFetch = () =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const res = await doFetch();
  if (res.status !== 401) return res;

  // Stale token — force one refresh, then retry exactly once.
  const supabase = createClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    throw new Error(AUTH_EXPIRED);
  }
  return doFetch();
}
