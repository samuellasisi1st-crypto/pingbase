// Per-business Google Calendar, connected via Pingbase's own Google OAuth app.
// We only READ busy times (free/busy) so booked slots never clash with the owner's calendar.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events.freebusy",
  "https://www.googleapis.com/auth/calendar.events",
];

export function googlePlatform() {
  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  if (!clientId || !clientSecret) throw new Error("Google sign-in is not set up yet.");
  return { clientId, clientSecret };
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = googlePlatform();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; id_token?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(json.error_description ?? `Google token exchange failed (${res.status})`);
  let email: string | null = null;
  if (json.id_token) {
    try {
      email = JSON.parse(Buffer.from(json.id_token.split(".")[1] ?? "", "base64url").toString()).email ?? null;
    } catch { /* ignore */ }
  }
  return { ...json, email };
}

export async function saveGoogleConnection(workspaceId: string, userId: string, tok: { access_token?: string; refresh_token?: string; expires_in?: number; email: string | null }) {
  const { data: existing } = await supabaseAdmin.from("google_calendar_connections").select("refresh_token").eq("workspace_id", workspaceId).maybeSingle();
  const refresh = tok.refresh_token ?? existing?.refresh_token;
  if (!refresh) throw new Error("Google did not grant offline access. Please try again.");
  const { error } = await supabaseAdmin.from("google_calendar_connections").upsert({
    workspace_id: workspaceId,
    google_email: tok.email,
    refresh_token: refresh,
    access_token: tok.access_token ?? null,
    access_token_expires_at: new Date(Date.now() + (tok.expires_in ?? 3600) * 1000 - 60000).toISOString(),
    status: "CONNECTED",
    last_error: null,
    connected_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function markError(workspaceId: string, status: string, message: string) {
  await supabaseAdmin.from("google_calendar_connections").update({ status, last_error: message, updated_at: new Date().toISOString() }).eq("workspace_id", workspaceId);
  await supabaseAdmin.from("integration_logs").insert({ workspace_id: workspaceId, channel: "google_calendar", level: "error", message } as never);
}

async function accessTokenFor(workspaceId: string): Promise<string | null> {
  const { data: c } = await supabaseAdmin.from("google_calendar_connections").select("*").eq("workspace_id", workspaceId).maybeSingle();
  if (!c || c.status === "NEEDS_REAUTH") return null;
  if (c.access_token && c.access_token_expires_at && new Date(c.access_token_expires_at) > new Date()) return c.access_token;
  const { clientId, clientSecret } = googlePlatform();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: c.refresh_token, grant_type: "refresh_token" }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    await markError(workspaceId, json.error === "invalid_grant" ? "NEEDS_REAUTH" : "ERROR", `Google token refresh failed: ${json.error_description ?? json.error ?? res.status}`);
    return null;
  }
  await supabaseAdmin
    .from("google_calendar_connections")
    .update({ access_token: json.access_token, access_token_expires_at: new Date(Date.now() + (json.expires_in ?? 3600) * 1000 - 60000).toISOString(), status: "CONNECTED", last_error: null })
    .eq("workspace_id", workspaceId);
  return json.access_token;
}

/**
 * Busy blocks from the business's Google Calendar. Returns [] when not connected.
 * Throws when connected but Google can't be read, so callers never offer a slot blind.
 */
export async function getGoogleBusy(workspaceId: string, fromISO: string, toISO: string): Promise<Array<{ start: string; end: string }>> {
  const { data: c } = await supabaseAdmin.from("google_calendar_connections").select("status").eq("workspace_id", workspaceId).maybeSingle();
  if (!c) return [];
  const token = await accessTokenFor(workspaceId);
  if (!token) throw new Error("Google Calendar needs reconnecting, so availability can't be confirmed.");
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin: fromISO, timeMax: toISO, items: [{ id: "primary" }] }),
  });
  if (!res.ok) {
    const body = await res.text();
    await markError(workspaceId, res.status === 401 || res.status === 403 ? "NEEDS_REAUTH" : "ERROR", `Google free/busy failed [${res.status}]: ${body.slice(0, 300)}`);
    throw new Error("Couldn't read the business's Google Calendar.");
  }
  const json = (await res.json()) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> };
  return json.calendars?.["primary"]?.busy ?? [];
}

export async function getGoogleStatus(workspaceId: string) {
  const { data } = await supabaseAdmin.from("google_calendar_connections").select("google_email,status,last_error").eq("workspace_id", workspaceId).maybeSingle();
  return data ? { status: data.status, email: data.google_email, lastError: data.last_error } : { status: "NOT_CONNECTED", email: null, lastError: null };
}

export async function disconnectGoogle(workspaceId: string) {
  const { data } = await supabaseAdmin.from("google_calendar_connections").select("refresh_token").eq("workspace_id", workspaceId).maybeSingle();
  if (data?.refresh_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(data.refresh_token)}`, { method: "POST" }).catch(() => null);
  }
  await supabaseAdmin.from("google_calendar_connections").delete().eq("workspace_id", workspaceId);
}
