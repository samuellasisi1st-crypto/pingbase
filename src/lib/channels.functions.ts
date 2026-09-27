import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WORKSPACE = "11111111-1111-1111-1111-111111111111";

async function assertMember(supabase: { from: (t: string) => any }) {
  const { data } = await supabase.from("channel_connections").select("id").eq("workspace_id", WORKSPACE).limit(1);
  if (!data?.length) throw new Error("You don't have access to this workspace.");
}

/** What the business sees: connected Page / Instagram and any Pages waiting to be picked. No secrets. */
export const getMetaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { getMetaConfig, getMetaSecrets, getPendingPages } = await import("@/lib/channels.server");
    const config = await getMetaConfig(WORKSPACE);
    const connected = Boolean(await getMetaSecrets(WORKSPACE));
    const pending = await getPendingPages(WORKSPACE);
    return {
      connected,
      pageName: connected ? (config.page_name ?? null) : null,
      igUsername: connected ? (config.ig_username ?? null) : null,
      pendingPages: pending.map((p) => ({ id: p.id, name: p.name, igUsername: p.instagram_business_account?.username ?? null })),
    };
  });

/** Build the Facebook Login URL for this workspace. */
export const startMetaConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { metaPlatform, signState, META_SCOPES } = await import("@/lib/channels.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const { appId } = metaPlatform();
    const serverOrigin = new URL(getRequest().url).origin;
    const state = signState({ w: WORKSPACE, u: context.userId, o: data.origin });
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: `${serverOrigin}/api/public/oauth/meta/callback`,
      state,
      response_type: "code",
      scope: META_SCOPES.join(","),
    });
    return { url: `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}` };
  });

export const selectMetaPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ pageId: z.string().regex(/^\d{5,25}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { getPendingPages, connectMetaPage } = await import("@/lib/channels.server");
    const page = (await getPendingPages(WORKSPACE)).find((p) => p.id === data.pageId);
    if (!page) return { ok: false as const, error: "That choice expired. Please connect again." };
    return connectMetaPage(WORKSPACE, page);
  });

export const disconnectMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { GRAPH, getMetaConfig, getMetaSecrets, deleteMetaSecrets, logIntegration } = await import("@/lib/channels.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [config, secrets] = [await getMetaConfig(WORKSPACE), await getMetaSecrets(WORKSPACE)];
    if (config.page_id && secrets) {
      await fetch(`${GRAPH}/${config.page_id}/subscribed_apps?access_token=${encodeURIComponent(secrets.page_access_token)}`, {
        method: "DELETE",
      }).catch(() => null);
    }
    await deleteMetaSecrets(WORKSPACE);
    await supabaseAdmin
      .from("channel_connections")
      .update({ status: "NOT_CONNECTED", last_error: null, config: {} as never, updated_at: new Date().toISOString() })
      .eq("workspace_id", WORKSPACE)
      .in("channel", ["instagram", "messenger"]);
    await logIntegration(WORKSPACE, "meta", "info", "Disconnected Instagram and Messenger");
    return { ok: true };
  });

/** WhatsApp connection status. Never returns the token. */
export const getWhatsAppStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { getWhatsAppConfig, getWhatsAppSecrets } = await import("@/lib/channels.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const config = await getWhatsAppConfig(WORKSPACE);
    const connected = Boolean(await getWhatsAppSecrets(WORKSPACE));
    const { data } = await supabaseAdmin
      .from("channel_connections")
      .select("status,last_error")
      .eq("workspace_id", WORKSPACE)
      .eq("channel", "whatsapp")
      .maybeSingle();
    return {
      connected,
      status: (data?.status as string | undefined) ?? "NOT_CONNECTED",
      lastError: data?.last_error ?? null,
      displayPhoneNumber: connected ? (config.display_phone_number ?? null) : null,
      verifiedName: connected ? (config.verified_name ?? null) : null,
    };
  });

export const saveWhatsAppCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        phoneNumberId: z.string().regex(/^\d{5,25}$/, "Phone Number ID should be digits only."),
        wabaId: z.string().regex(/^\d{5,25}$/).optional().or(z.literal("")),
        accessToken: z.string().min(20).max(5000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { connectWhatsApp } = await import("@/lib/channels.server");
    return connectWhatsApp(WORKSPACE, {
      access_token: data.accessToken.trim(),
      phone_number_id: data.phoneNumberId.trim(),
      waba_id: data.wabaId ? data.wabaId.trim() : null,
    });
  });

export const disconnectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { deleteWhatsAppSecrets, logIntegration } = await import("@/lib/channels.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await deleteWhatsAppSecrets(WORKSPACE);
    await supabaseAdmin
      .from("channel_connections")
      .update({ status: "NOT_CONNECTED", last_error: null, config: {} as never, updated_at: new Date().toISOString() })
      .eq("workspace_id", WORKSPACE)
      .eq("channel", "whatsapp");
    await logIntegration(WORKSPACE, "whatsapp", "info", "Disconnected WhatsApp");
    return { ok: true };
  });

/** Public settings the browser needs to open Meta's WhatsApp Embedded Signup popup. */
export const getEmbeddedSignupConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      appId: process.env['META_APP_ID'] ?? null,
      configId: process.env['META_WA_CONFIG_ID'] ?? null,
    };
  });

/** Finish Embedded Signup: swap the code for the business's token, subscribe our app, register the number. */
export const completeEmbeddedSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().min(10).max(2000).optional(),
        accessToken: z.string().min(20).max(4000).optional(),
        wabaId: z.string().regex(/^\d{5,25}$/).optional(),
        phoneNumberId: z.string().regex(/^\d{5,25}$/).optional(),
        pageUrl: z.string().url().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { connectWhatsApp, logIntegration } = await import("@/lib/channels.server");
    const GRAPH = "https://graph.facebook.com/v21.0";
    const appId = process.env['META_APP_ID'];
    const appSecret = process.env['META_APP_SECRET'];
    if (!appId || !appSecret) return { ok: false as const, error: "Pingbase's Meta app isn't configured yet." };

    let tokenValue: string | null = null;
    if (data.accessToken) {
      // Token straight from Meta's popup: swap it for a long-lived one (no redirect address involved).
      const llRes = await fetch(
        `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(data.accessToken)}`,
      );
      const ll = (await llRes.json().catch(() => ({}))) as { access_token?: string; error?: { message?: string } };
      if (!llRes.ok || !ll.access_token) {
        const error = ll.error?.message ?? `Meta returned ${llRes.status}`;
        await logIntegration(WORKSPACE, "whatsapp", "error", `Embedded signup token upgrade failed: ${error}`);
        return { ok: false as const, error };
      }
      tokenValue = ll.access_token;
    } else if (!data.code) {
      return { ok: false as const, error: "Meta didn't return a sign-in. Please try again." };
    }

    // Codes from Meta's JS popup are tied to whichever redirect the popup used, which varies.
    // Try the known variants; a mismatched attempt doesn't use up the code.
    if (!tokenValue) {
      const redirects: Array<string | null> = [null, ""];
      if (data.pageUrl) {
        const u = new URL(data.pageUrl);
        redirects.push(`${u.origin}/`, u.origin, `${u.origin}${u.pathname}`, data.pageUrl);
      }
      let tokenRes: Response | null = null;
      let tokenJson: { access_token?: string; error?: { message?: string } } = {};
      for (const r of Array.from(new Set(redirects))) {
        const rq = r === null ? "" : `&redirect_uri=${encodeURIComponent(r)}`;
        tokenRes = await fetch(
          `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${encodeURIComponent(data.code!)}${rq}`,
        );
        tokenJson = (await tokenRes.json().catch(() => ({}))) as typeof tokenJson;
        if (tokenRes.ok && tokenJson.access_token) break;
        if (!/redirect_uri/i.test(tokenJson.error?.message ?? "")) break;
      }
      if (!tokenRes || !tokenRes.ok || !tokenJson.access_token) {
        const error = tokenJson.error?.message ?? `Meta returned ${tokenRes?.status}`;
        await logIntegration(WORKSPACE, "whatsapp", "error", `Embedded signup token exchange failed: ${error}`);
        return { ok: false as const, error };
      }
      tokenValue = tokenJson.access_token;
    }
    const token = tokenValue;
    const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // Meta doesn't always post the picked account/number back to the page. When it's missing,
    // find what the business granted us from the token itself.
    let wabaId = data.wabaId;
    let phoneNumberId = data.phoneNumberId;
    if (!wabaId || !phoneNumberId) {
      const dbg = await fetch(
        `${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
      );
      const dbgJson = (await dbg.json().catch(() => ({}))) as {
        data?: { granular_scopes?: Array<{ scope: string; target_ids?: string[] }> };
      };
      const scopes = dbgJson.data?.granular_scopes ?? [];
      const wabaIds = Array.from(
        new Set(
          scopes
            .filter((s) => s.scope === "whatsapp_business_management" || s.scope === "whatsapp_business_messaging")
            .flatMap((s) => s.target_ids ?? []),
        ),
      );
      const candidates = wabaId ? [wabaId] : wabaIds;
      const numbers: Array<{ wabaId: string; id: string; display: string | null }> = [];
      for (const w of candidates) {
        const r = await fetch(`${GRAPH}/${w}/phone_numbers?fields=id,display_phone_number`, { headers: auth });
        const j = (await r.json().catch(() => ({}))) as { data?: Array<{ id: string; display_phone_number?: string }> };
        for (const n of j.data ?? []) numbers.push({ wabaId: w, id: n.id, display: n.display_phone_number ?? null });
      }
      const match = phoneNumberId ? numbers.find((n) => n.id === phoneNumberId) : numbers.length === 1 ? numbers[0] : undefined;
      if (!match) {
        const detail =
          numbers.length === 0
            ? "No WhatsApp number was shared with Pingbase. Try again and pick your WhatsApp Business account and number when Meta asks."
            : `Several WhatsApp numbers were shared (${numbers.map((n) => n.display ?? n.id).join(", ")}). Try again and pick just one.`;
        await logIntegration(WORKSPACE, "whatsapp", "error", `Embedded signup: ${detail} (accounts: ${wabaIds.join(",") || "none"})`);
        return { ok: false as const, error: detail };
      }
      wabaId = match.wabaId;
      phoneNumberId = match.id;
    }

    // Route this business's WhatsApp webhooks to Pingbase's platform webhook.
    const sub = await fetch(`${GRAPH}/${wabaId}/subscribed_apps`, { method: "POST", headers: auth });
    if (!sub.ok) {
      const body = await sub.text();
      await logIntegration(WORKSPACE, "whatsapp", "error", `Subscribing to WhatsApp account failed: ${body}`);
      return { ok: false as const, error: "Couldn't subscribe Pingbase to this WhatsApp account." };
    }

    // Register the number for Cloud API. Already-registered numbers return an error we can ignore.
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const reg = await fetch(`${GRAPH}/${phoneNumberId}/register`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ messaging_product: "whatsapp", pin }),
    });
    if (!reg.ok) await logIntegration(WORKSPACE, "whatsapp", "warn", `Number registration: ${await reg.text()}`);

    return connectWhatsApp(WORKSPACE, { access_token: token, phone_number_id: phoneNumberId, waba_id: wabaId });
  });

// ---------- WhatsApp test console (App Review proof) ----------

async function waContext() {
  const { GRAPH, getWhatsAppSecrets, getWhatsAppConfig, logIntegration } = await import("@/lib/channels.server");
  const secrets = await getWhatsAppSecrets(WORKSPACE);
  if (!secrets) throw new Error("Connect WhatsApp first.");
  const config = await getWhatsAppConfig(WORKSPACE);
  const wabaId = secrets.waba_id || config.waba_id || null;
  return { GRAPH, secrets, wabaId, logIntegration };
}

function graphError(json: any, fallback: string) {
  return (json?.error?.error_user_msg || json?.error?.message || fallback) as string;
}

export const sendWhatsAppTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        to: z.string().regex(/^\+?\d{7,15}$/, "Use the full number with country code, digits only."),
        mode: z.enum(["text", "template"]),
        text: z.string().max(4000).optional(),
        templateName: z.string().regex(/^[a-z0-9_]{1,512}$/).optional(),
        language: z.string().regex(/^[a-zA-Z_]{2,10}$/).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { GRAPH, secrets, logIntegration } = await waContext();
    const to = data.to.replace(/^\+/, "");
    const body =
      data.mode === "text"
        ? { messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: (data.text ?? "").trim() || "Hello from Pingbase" } }
        : { messaging_product: "whatsapp", to, type: "template", template: { name: data.templateName ?? "hello_world", language: { code: data.language ?? "en_US" } } };
    const res = await fetch(`${GRAPH}/${secrets.phone_number_id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secrets.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const error = graphError(json, `Meta returned ${res.status}`);
      await logIntegration(WORKSPACE, "whatsapp", "error", `Test send failed: ${error}`);
      return { ok: false as const, error };
    }
    const id = json?.messages?.[0]?.id ?? null;
    await logIntegration(WORKSPACE, "whatsapp", "info", `Test ${data.mode} sent to +${to} (${id})`);
    return { ok: true as const, messageId: id as string | null };
  });

export const listWhatsAppTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { GRAPH, secrets, wabaId } = await waContext();
    if (!wabaId) return { ok: false as const, error: "No WhatsApp Business Account ID saved.", templates: [] };
    const res = await fetch(`${GRAPH}/${wabaId}/message_templates?fields=name,status,category,language&limit=50`, {
      headers: { Authorization: `Bearer ${secrets.access_token}` },
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) return { ok: false as const, error: graphError(json, `Meta returned ${res.status}`), templates: [] };
    const templates = ((json.data ?? []) as any[]).map((t) => ({
      id: String(t.id),
      name: String(t.name),
      status: String(t.status),
      category: String(t.category),
      language: String(t.language),
    }));
    return { ok: true as const, error: null, templates };
  });

export const createWhatsAppTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().regex(/^[a-z0-9_]{1,512}$/, "Lowercase letters, numbers and underscores only."),
        category: z.enum(["UTILITY", "MARKETING"]),
        language: z.string().regex(/^[a-zA-Z_]{2,10}$/),
        body: z.string().min(1).max(1024),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { GRAPH, secrets, wabaId, logIntegration } = await waContext();
    if (!wabaId) return { ok: false as const, error: "No WhatsApp Business Account ID saved." };
    const res = await fetch(`${GRAPH}/${wabaId}/message_templates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secrets.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        category: data.category,
        language: data.language,
        components: [{ type: "BODY", text: data.body }],
      }),
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const error = graphError(json, `Meta returned ${res.status}`);
      await logIntegration(WORKSPACE, "whatsapp", "error", `Template create failed: ${error}`);
      return { ok: false as const, error };
    }
    await logIntegration(WORKSPACE, "whatsapp", "info", `Template ${data.name} created (${json.status})`);
    return { ok: true as const, id: String(json.id), status: String(json.status ?? "PENDING") };
  });

// ---------- WhatsApp inbox (real messages only) ----------

export const listWhatsAppInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data, error } = await sb
      .from("messages")
      .select("id, direction, sender_type, sender_name, body, created_at, contact_id, contacts(full_name, phone)")
      .eq("workspace_id", WORKSPACE)
      .eq("channel", "whatsapp")
      .like("external_message_id", "wamid%")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return ((data ?? []) as any[]).map((m) => ({
      id: String(m.id),
      direction: String(m.direction) as "inbound" | "outbound",
      sender: String(m.sender_type ?? ""),
      name: (m.contacts?.full_name ?? m.sender_name ?? null) as string | null,
      phone: (m.contacts?.phone ?? null) as string | null,
      body: String(m.body ?? ""),
      createdAt: String(m.created_at),
    }));
  });

/** Tells Meta to forward this WhatsApp account's incoming messages to Pingbase's webhook. */
export const subscribeWhatsAppWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { GRAPH, secrets, wabaId, logIntegration } = await waContext();
    if (!wabaId) return { ok: false as const, error: "No WhatsApp Business Account ID saved." };
    const res = await fetch(`${GRAPH}/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secrets.access_token}` },
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const error = graphError(json, `Meta returned ${res.status}`);
      await logIntegration(WORKSPACE, "whatsapp", "error", `Webhook subscribe failed: ${error}`);
      return { ok: false as const, error };
    }
    await logIntegration(WORKSPACE, "whatsapp", "info", `Subscribed WABA ${wabaId} to webhook`);
    return { ok: true as const, error: null };
  });

/** Google Calendar connection status for this business (no tokens). */
export const getGoogleCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { getGoogleStatus } = await import("@/lib/gcal.server");
    const configured = Boolean(process.env["GOOGLE_OAUTH_CLIENT_ID"] && process.env["GOOGLE_OAUTH_CLIENT_SECRET"]);
    return { configured, ...(await getGoogleStatus(WORKSPACE)) };
  });

/** Build the Google consent URL for this business. */
export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { googlePlatform, GOOGLE_SCOPES } = await import("@/lib/gcal.server");
    const { signState } = await import("@/lib/channels.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const { clientId } = googlePlatform();
    const serverOrigin = new URL(getRequest().url).origin;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${serverOrigin}/api/public/oauth/google/callback`,
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state: signState({ w: WORKSPACE, u: context.userId, o: data.origin }),
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { disconnectGoogle } = await import("@/lib/gcal.server");
    await disconnectGoogle(WORKSPACE);
    return { ok: true };
  });
