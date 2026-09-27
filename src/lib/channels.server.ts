import { createHmac, timingSafeEqual } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const GRAPH = "https://graph.facebook.com/v21.0";
export const META_CHANNELS = ["instagram", "messenger"] as const;

/** Per-tenant WhatsApp Cloud API credentials. Stored service-role only. */
export type WhatsAppSecrets = { access_token: string; phone_number_id: string; waba_id?: string | null };
export type WhatsAppConfig = { phone_number_id?: string; display_phone_number?: string | null; verified_name?: string | null; waba_id?: string | null };
export const META_SCOPES = [
  "pages_show_list",
  "pages_messaging",
  "pages_manage_metadata",
  "instagram_basic",
  "instagram_manage_messages",
];

/** Per-tenant secret: only the Page token. App secret + verify token are platform-level env vars. */
export type MetaSecrets = { page_access_token: string };
export type MetaConfig = {
  page_id?: string;
  page_name?: string;
  ig_account_id?: string | null;
  ig_username?: string | null;
};
export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string } | null;
};

export function metaPlatform() {
  const appId = process.env["META_APP_ID"];
  const appSecret = process.env["META_APP_SECRET"];
  const verifyToken = process.env["META_WEBHOOK_VERIFY_TOKEN"];
  if (!appId || !appSecret || !verifyToken) throw new Error("Meta platform credentials are not configured.");
  return { appId, appSecret, verifyToken };
}

// channel_secrets is service-role only (no RLS policies), never exposed to the browser.
const secretsTable = () => (supabaseAdmin as unknown as { from: (t: string) => any }).from("channel_secrets");

export async function getMetaSecrets(workspaceId: string): Promise<MetaSecrets | null> {
  const { data } = await secretsTable().select("secrets").eq("workspace_id", workspaceId).eq("channel", "meta").maybeSingle();
  const s = data?.secrets as Partial<MetaSecrets> | undefined;
  return s?.page_access_token ? (s as MetaSecrets) : null;
}

export async function saveMetaSecrets(workspaceId: string, secrets: MetaSecrets) {
  const { error } = await secretsTable().upsert(
    { workspace_id: workspaceId, channel: "meta", secrets, updated_at: new Date().toISOString() },
    { onConflict: "workspace_id,channel" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteMetaSecrets(workspaceId: string) {
  await secretsTable().delete().eq("workspace_id", workspaceId).in("channel", ["meta", "meta_pending"]);
}

/** Pages returned by OAuth, waiting for the owner to pick one (tokens stay server-side). */
export async function savePendingPages(workspaceId: string, pages: MetaPage[]) {
  const { error } = await secretsTable().upsert(
    { workspace_id: workspaceId, channel: "meta_pending", secrets: { pages }, updated_at: new Date().toISOString() },
    { onConflict: "workspace_id,channel" },
  );
  if (error) throw new Error(error.message);
}

export async function getPendingPages(workspaceId: string): Promise<MetaPage[]> {
  const { data } = await secretsTable()
    .select("secrets,updated_at")
    .eq("workspace_id", workspaceId)
    .eq("channel", "meta_pending")
    .maybeSingle();
  if (!data || Date.now() - new Date(data.updated_at).getTime() > 30 * 60 * 1000) return [];
  return ((data.secrets as { pages?: MetaPage[] }).pages ?? []) as MetaPage[];
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

/** Route a platform webhook entry (Page ID or Instagram account ID) to its workspace. */
export async function findWorkspaceForMetaId(channel: "messenger" | "instagram", id: string) {
  const key = channel === "messenger" ? "config->>page_id" : "config->>ig_account_id";
  const { data } = await supabaseAdmin
    .from("channel_connections")
    .select("workspace_id")
    .eq("channel", channel)
    .filter(key, "eq", id)
    .limit(1)
    .maybeSingle();
  return data?.workspace_id ?? null;
}

export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Signed OAuth state so the callback knows which workspace started the flow. */
export function signState(payload: { w: string; u: string; o: string }) {
  const body = Buffer.from(JSON.stringify({ ...payload, t: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", metaPlatform().appSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readState(state: string | null): { w: string; u: string; o: string } | null {
  if (!state) return null;
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", metaPlatform().appSecret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { w: string; u: string; o: string; t: number };
  if (Date.now() - p.t > 15 * 60 * 1000) return null;
  return p;
}

/** Subscribe a Page to the platform app and mark Messenger/Instagram connected. */
export async function connectMetaPage(workspaceId: string, page: MetaPage) {
  const now = new Date().toISOString();
  const subRes = await fetch(`${GRAPH}/${page.id}/subscribed_apps?access_token=${encodeURIComponent(page.access_token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "subscribed_fields=messages,messaging_postbacks",
  });
  const sub = (await subRes.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
  if (!subRes.ok || !sub.success) {
    const msg = sub.error?.message ?? "Could not subscribe the Page to messages.";
    await supabaseAdmin
      .from("channel_connections")
      .update({ status: "ERROR", last_error: msg, updated_at: now })
      .eq("workspace_id", workspaceId)
      .in("channel", ["instagram", "messenger"]);
    await logIntegration(workspaceId, "meta", "error", `Connect failed: ${msg}`);
    return { ok: false as const, error: msg };
  }

  await saveMetaSecrets(workspaceId, { page_access_token: page.access_token });
  await secretsTable().delete().eq("workspace_id", workspaceId).eq("channel", "meta_pending");
  const ig = page.instagram_business_account ?? null;
  const config: MetaConfig = { page_id: page.id, page_name: page.name, ig_account_id: ig?.id ?? null, ig_username: ig?.username ?? null };
  await supabaseAdmin
    .from("channel_connections")
    .update({ status: "CONNECTED", last_error: null, config: config as never, updated_at: now })
    .eq("workspace_id", workspaceId)
    .eq("channel", "messenger");
  await supabaseAdmin
    .from("channel_connections")
    .update({
      status: ig ? "CONNECTED" : "ERROR",
      last_error: ig ? null : "No Instagram professional account is linked to this Facebook Page.",
      config: config as never,
      updated_at: now,
    })
    .eq("workspace_id", workspaceId)
    .eq("channel", "instagram");
  await logIntegration(workspaceId, "meta", "info", `Connected Page "${page.name}"${ig ? ` and Instagram @${ig.username ?? ig.id}` : ""}`);
  return { ok: true as const };
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
  if (channel === "whatsapp") return deliverWhatsApp(workspaceId, recipientId, text);
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

/* ------------------------------ WhatsApp Cloud API ------------------------------ */

const WA = () => (supabaseAdmin as unknown as { from: (t: string) => any }).from("channel_secrets");

export async function getWhatsAppSecrets(workspaceId: string): Promise<WhatsAppSecrets | null> {
  const { data } = await WA().select("secrets").eq("workspace_id", workspaceId).eq("channel", "whatsapp").maybeSingle();
  const s = data?.secrets as Partial<WhatsAppSecrets> | undefined;
  if (s?.access_token && s?.phone_number_id) return s as WhatsAppSecrets;
  // Platform-level fallback: token saved via the secure secret store, phone
  // number ID from the workspace's channel connection config.
  const envToken = process.env["WHATSAPP_ACCESS_TOKEN"];
  if (envToken) {
    const config = await getWhatsAppConfig(workspaceId);
    if (config.phone_number_id) {
      return { access_token: envToken, phone_number_id: config.phone_number_id, waba_id: config.waba_id ?? null };
    }
  }
  return null;
}

export async function saveWhatsAppSecrets(workspaceId: string, secrets: WhatsAppSecrets) {
  const { error } = await WA().upsert(
    { workspace_id: workspaceId, channel: "whatsapp", secrets, updated_at: new Date().toISOString() },
    { onConflict: "workspace_id,channel" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteWhatsAppSecrets(workspaceId: string) {
  await WA().delete().eq("workspace_id", workspaceId).eq("channel", "whatsapp");
}

export async function getWhatsAppConfig(workspaceId: string): Promise<WhatsAppConfig> {
  const { data } = await supabaseAdmin
    .from("channel_connections")
    .select("config")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .maybeSingle();
  return (data?.config ?? {}) as WhatsAppConfig;
}

/** Route a WhatsApp webhook entry (phone number ID) to its workspace. */
export async function findWorkspaceForWhatsAppPhoneId(phoneNumberId: string) {
  const { data } = await supabaseAdmin
    .from("channel_connections")
    .select("workspace_id")
    .eq("channel", "whatsapp")
    .filter("config->>phone_number_id", "eq", phoneNumberId)
    .limit(1)
    .maybeSingle();
  return data?.workspace_id ?? null;
}

/** Verify credentials against Meta, store them and mark WhatsApp connected. */
export async function connectWhatsApp(workspaceId: string, input: WhatsAppSecrets) {
  const now = new Date().toISOString();
  let res: Response;
  try {
    res = await fetch(
      `${GRAPH}/${input.phone_number_id}?fields=display_phone_number,verified_name&access_token=${encodeURIComponent(input.access_token)}`,
    );
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not reach WhatsApp." };
  }
  const json = (await res.json().catch(() => ({}))) as {
    display_phone_number?: string;
    verified_name?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    const error = json.error?.message ?? `WhatsApp returned ${res.status}`;
    await supabaseAdmin
      .from("channel_connections")
      .update({ status: "ERROR", last_error: error, updated_at: now })
      .eq("workspace_id", workspaceId)
      .eq("channel", "whatsapp");
    await logIntegration(workspaceId, "whatsapp", "error", `Connect failed: ${error}`);
    return { ok: false as const, error };
  }

  await saveWhatsAppSecrets(workspaceId, input);
  const config: WhatsAppConfig = {
    phone_number_id: input.phone_number_id,
    display_phone_number: json.display_phone_number ?? null,
    verified_name: json.verified_name ?? null,
    waba_id: input.waba_id ?? null,
  };
  await supabaseAdmin
    .from("channel_connections")
    .update({ status: "CONNECTED", last_error: null, config: config as never, updated_at: now })
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp");
  await logIntegration(workspaceId, "whatsapp", "info", `Connected WhatsApp number ${json.display_phone_number ?? input.phone_number_id}`);
  return { ok: true as const, displayPhoneNumber: json.display_phone_number ?? null, verifiedName: json.verified_name ?? null };
}

async function deliverWhatsApp(
  workspaceId: string,
  recipientId: string,
  text: string,
): Promise<{ delivered: boolean; externalMessageId?: string | undefined; error?: string | undefined }> {
  const { data: conn } = await supabaseAdmin
    .from("channel_connections")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .maybeSingle();
  const secrets = await getWhatsAppSecrets(workspaceId);
  if (!conn || conn.status !== "CONNECTED" || !secrets) {
    const error = "WhatsApp is not connected.";
    await logIntegration(workspaceId, "whatsapp", "warn", `Reply could not be delivered: ${error}`);
    return { delivered: false, error };
  }
  try {
    const res = await fetch(`${GRAPH}/${secrets.phone_number_id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secrets.access_token}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientId,
        type: "text",
        text: { preview_url: false, body: text.slice(0, 4000) },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!res.ok) {
      const error = json.error?.message ?? `WhatsApp returned ${res.status}`;
      await logIntegration(workspaceId, "whatsapp", "error", `Send failed: ${error}`, { status: res.status });
      await setChannelError(workspaceId, "whatsapp", error);
      return { delivered: false, error };
    }
    return { delivered: true, externalMessageId: json.messages?.[0]?.id };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await logIntegration(workspaceId, "whatsapp", "error", `Send failed: ${error}`);
    return { delivered: false, error };
  }
}

type SendResult = { delivered: boolean; externalMessageId?: string | undefined; error?: string | undefined };

/** POST any WhatsApp Cloud API message payload for a workspace. */
async function postWhatsApp(workspaceId: string, payload: Record<string, unknown>): Promise<SendResult> {
  const secrets = await getWhatsAppSecrets(workspaceId);
  if (!secrets) {
    const error = "WhatsApp is not connected.";
    await logIntegration(workspaceId, "whatsapp", "warn", `Message could not be delivered: ${error}`);
    return { delivered: false, error };
  }
  try {
    const res = await fetch(`${GRAPH}/${secrets.phone_number_id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secrets.access_token}` },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...payload }),
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!res.ok) {
      const error = json.error?.message ?? `WhatsApp returned ${res.status}`;
      await logIntegration(workspaceId, "whatsapp", "error", `Send failed: ${error}`, { status: res.status });
      await setChannelError(workspaceId, "whatsapp", error);
      return { delivered: false, error };
    }
    return { delivered: true, externalMessageId: json.messages?.[0]?.id };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await logIntegration(workspaceId, "whatsapp", "error", `Send failed: ${error}`);
    return { delivered: false, error };
  }
}

export type WaChoice = { id: string; title: string; description?: string | null };

/**
 * Send tappable options. Up to 3 → reply buttons; more → a single-select list.
 * WhatsApp limits: button title 20 chars, list row title 24 chars, description 72.
 */
export async function sendWhatsAppChoices(
  workspaceId: string,
  to: string,
  opts: { body: string; footer?: string | null; buttonLabel?: string; choices: WaChoice[] },
): Promise<SendResult> {
  const choices = opts.choices.slice(0, 10);
  if (!choices.length) return { delivered: false, error: "No options to send." };

  if (choices.length <= 3) {
    return postWhatsApp(workspaceId, {
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: opts.body.slice(0, 1024) },
        ...(opts.footer ? { footer: { text: opts.footer.slice(0, 60) } } : {}),
        action: {
          buttons: choices.map((c) => ({ type: "reply", reply: { id: c.id.slice(0, 256), title: c.title.slice(0, 20) } })),
        },
      },
    });
  }

  return postWhatsApp(workspaceId, {
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: opts.body.slice(0, 1024) },
      ...(opts.footer ? { footer: { text: opts.footer.slice(0, 60) } } : {}),
      action: {
        button: (opts.buttonLabel ?? "Choose a time").slice(0, 20),
        sections: [
          {
            title: "Available",
            rows: choices.map((c) => ({
              id: c.id.slice(0, 200),
              title: c.title.slice(0, 24),
              ...(c.description ? { description: c.description.slice(0, 72) } : {}),
            })),
          },
        ],
      },
    },
  });
}

/** Send a message with one tappable link button (WhatsApp interactive cta_url). */
export async function sendWhatsAppLinkButton(
  workspaceId: string,
  to: string,
  opts: { header?: string | null; body: string; footer?: string | null; buttonLabel: string; url: string },
): Promise<SendResult> {
  return postWhatsApp(workspaceId, {
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      ...(opts.header ? { header: { type: "text", text: opts.header.slice(0, 60) } } : {}),
      body: { text: opts.body.slice(0, 1024) },
      ...(opts.footer ? { footer: { text: opts.footer.slice(0, 60) } } : {}),
      action: {
        name: "cta_url",
        parameters: { display_text: opts.buttonLabel.slice(0, 20), url: opts.url },
      },
    },
  });
}

/** Upload a file to WhatsApp media storage and return its media id. */
async function uploadWhatsAppMedia(workspaceId: string, file: Blob, filename: string): Promise<string> {
  const secrets = await getWhatsAppSecrets(workspaceId);
  if (!secrets) throw new Error("WhatsApp is not connected.");
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", file, filename);
  const res = await fetch(`${GRAPH}/${secrets.phone_number_id}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secrets.access_token}` },
    body: form,
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!res.ok || !json.id) throw new Error(json.error?.message ?? `Media upload returned ${res.status}`);
  return json.id;
}

/** Send a calendar (.ics) file the customer can tap to add to their phone calendar. */
export async function sendWhatsAppCalendarFile(
  workspaceId: string,
  to: string,
  opts: { ics: string; filename: string; caption?: string | null },
): Promise<SendResult> {
  try {
    // WhatsApp media rejects text/calendar, so upload as text/plain and keep the .ics filename;
    // phones pick the calendar app from the extension.
    const blob = new Blob([opts.ics], { type: "text/plain" });
    const mediaId = await uploadWhatsAppMedia(workspaceId, blob, opts.filename);
    return await postWhatsApp(workspaceId, {
      to,
      type: "document",
      document: { id: mediaId, filename: opts.filename, ...(opts.caption ? { caption: opts.caption.slice(0, 1024) } : {}) },
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await logIntegration(workspaceId, "whatsapp", "error", `Calendar file failed: ${error}`);
    return { delivered: false, error };
  }
}
