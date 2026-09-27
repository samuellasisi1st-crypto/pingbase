import { createHmac, timingSafeEqual } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const GRAPH = "https://graph.facebook.com/v21.0";
export const META_CHANNELS = ["instagram", "messenger"] as const;

export type MetaSecrets = { page_access_token: string; app_secret: string };
export type MetaConfig = {
  page_id?: string;
  page_name?: string;
  ig_account_id?: string | null;
  ig_username?: string | null;
  verify_token?: string;
};

// channel_secrets is service-role only (no RLS policies), never exposed to the browser.
const secretsTable = () => (supabaseAdmin as unknown as { from: (t: string) => any }).from("channel_secrets");

export async function getMetaSecrets(workspaceId: string): Promise<MetaSecrets | null> {
  const { data } = await secretsTable().select("secrets").eq("workspace_id", workspaceId).eq("channel", "meta").maybeSingle();
  const s = data?.secrets as Partial<MetaSecrets> | undefined;
  return s?.page_access_token && s.app_secret ? (s as MetaSecrets) : null;
}

export async function saveMetaSecrets(workspaceId: string, secrets: MetaSecrets) {
  const { error } = await secretsTable().upsert(
    { workspace_id: workspaceId, channel: "meta", secrets, updated_at: new Date().toISOString() },
    { onConflict: "workspace_id,channel" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteMetaSecrets(workspaceId: string) {
  await secretsTable().delete().eq("workspace_id", workspaceId).eq("channel", "meta");
}

export async function getMetaConfig(workspaceId: string): Promise<MetaConfig> {
  const { data } = await supabaseAdmin
    .from("channel_connections")
    .select("config")
    .eq("workspace_id", workspaceId)
    .eq("channel", "messenger")
    .maybeSingle();
  return (data?.config ?? {}) as MetaConfig;
}

export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function logIntegration(
  workspaceId: string,
  channel: string,
  level: "info" | "warn" | "error",
  message: string,
  payload: Record<string, unknown> = {},
) {
  await supabaseAdmin.from("integration_logs").insert({ workspace_id: workspaceId, channel, level, message, payload: payload as never });
}

async function setChannelError(workspaceId: string, channel: string, message: string) {
  await supabaseAdmin
    .from("channel_connections")
    .update({ status: /OAuth|token/i.test(message) ? "NEEDS_REAUTH" : "ERROR", last_error: message, updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("channel", channel);
}

/** Look up a customer's Meta profile name (best effort). */
export async function fetchMetaProfileName(workspaceId: string, channel: string, senderId: string) {
  const secrets = await getMetaSecrets(workspaceId);
  if (!secrets) return null;
  const fields = channel === "instagram" ? "name,username" : "first_name,last_name";
  try {
    const res = await fetch(`${GRAPH}/${senderId}?fields=${fields}&access_token=${encodeURIComponent(secrets.page_access_token)}`);
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, string | undefined>;
    return j["name"] ?? j["username"] ?? ([j["first_name"], j["last_name"]].filter(Boolean).join(" ") || null);
  } catch {
    return null;
  }
}

/**
 * Deliver an outbound message to the customer's own app.
 * Returns { delivered } and never throws, so the conversation is always saved.
 */
export async function deliverOutbound(opts: {
  workspaceId: string;
  channel: string;
  recipientId: string;
  text: string;
}): Promise<{ delivered: boolean; externalMessageId?: string | undefined; error?: string | undefined }> {
  const { workspaceId, channel, recipientId, text } = opts;
  if (channel === "test") return { delivered: true };
  if (!(META_CHANNELS as readonly string[]).includes(channel)) {
    const error = `${channel} is not connected yet.`;
    await logIntegration(workspaceId, channel, "warn", `Reply could not be delivered: ${error}`);
    return { delivered: false, error };
  }

  const { data: conn } = await supabaseAdmin
    .from("channel_connections")
    .select("status,config")
    .eq("workspace_id", workspaceId)
    .eq("channel", channel)
    .maybeSingle();
  const secrets = await getMetaSecrets(workspaceId);
  const config = (conn?.config ?? {}) as MetaConfig;
  if (!conn || conn.status !== "CONNECTED" || !secrets || !config.page_id) {
    const error = `${channel} is not connected.`;
    await logIntegration(workspaceId, channel, "warn", `Reply could not be delivered: ${error}`);
    return { delivered: false, error };
  }

  try {
    const res = await fetch(`${GRAPH}/${config.page_id}/messages?access_token=${encodeURIComponent(secrets.page_access_token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: { text: text.slice(0, channel === "instagram" ? 1000 : 2000) },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { message_id?: string; error?: { message?: string } };
    if (!res.ok) {
      const error = json.error?.message ?? `Meta returned ${res.status}`;
      await logIntegration(workspaceId, channel, "error", `Send failed: ${error}`, { status: res.status });
      await setChannelError(workspaceId, channel, error);
      return { delivered: false, error };
    }
    return { delivered: true, externalMessageId: json.message_id };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await logIntegration(workspaceId, channel, "error", `Send failed: ${error}`);
    return { delivered: false, error };
  }
}
