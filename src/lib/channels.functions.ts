import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WORKSPACE = "11111111-1111-1111-1111-111111111111";

async function assertMember(supabase: { from: (t: string) => any }) {
  const { data } = await supabase.from("channel_connections").select("id").eq("workspace_id", WORKSPACE).limit(1);
  if (!data?.length) throw new Error("You don't have access to this workspace.");
}

/** Non-secret setup info: webhook path, verify token, connected page. */
export const getMetaSetup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { getMetaConfig, getMetaSecrets } = await import("@/lib/channels.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let config = await getMetaConfig(WORKSPACE);
    if (!config.verify_token) {
      const verify_token = `pinkos_${crypto.randomUUID().replace(/-/g, "")}`;
      config = { ...config, verify_token };
      await supabaseAdmin
        .from("channel_connections")
        .update({ config: config as never })
        .eq("workspace_id", WORKSPACE)
        .in("channel", ["instagram", "messenger"]);
    }
    const hasSecrets = Boolean(await getMetaSecrets(WORKSPACE));
    return {
      webhookPath: `/api/public/webhooks/meta/${WORKSPACE}`,
      verifyToken: config.verify_token!,
      pageId: config.page_id ?? "",
      pageName: config.page_name ?? null,
      igUsername: config.ig_username ?? null,
      hasSecrets,
    };
  });

export const connectMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        pageId: z.string().trim().regex(/^\d{5,25}$/, "Page ID should be numbers only"),
        pageAccessToken: z.string().trim().min(20).max(1000),
        appSecret: z.string().trim().regex(/^[a-f0-9]{32}$/i, "App secret should be 32 characters"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertMember(context.supabase as never);
    const { GRAPH, getMetaConfig, saveMetaSecrets, logIntegration } = await import("@/lib/channels.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = encodeURIComponent(data.pageAccessToken);
    const now = new Date().toISOString();
    const fail = async (msg: string) => {
      await supabaseAdmin
        .from("channel_connections")
        .update({ status: "ERROR", last_error: msg, updated_at: now })
        .eq("workspace_id", WORKSPACE)
        .in("channel", ["instagram", "messenger"]);
      await logIntegration(WORKSPACE, "meta", "error", `Connect failed: ${msg}`);
      return { ok: false as const, error: msg };
    };

    await supabaseAdmin
      .from("channel_connections")
      .update({ status: "CONNECTING", last_error: null, updated_at: now })
      .eq("workspace_id", WORKSPACE)
      .in("channel", ["instagram", "messenger"]);

    // 1. Verify the token really belongs to this Page and read the linked Instagram account.
    const pageRes = await fetch(
      `${GRAPH}/${data.pageId}?fields=name,instagram_business_account{id,username}&access_token=${token}`,
    );
    const page = (await pageRes.json().catch(() => ({}))) as {
      name?: string;
      instagram_business_account?: { id: string; username?: string };
      error?: { message?: string };
    };
    if (!pageRes.ok || !page.name) return fail(page.error?.message ?? "Could not read this Facebook Page with that token.");

    // 2. Subscribe the Page to this app's webhook so messages are delivered.
    const subRes = await fetch(`${GRAPH}/${data.pageId}/subscribed_apps?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "subscribed_fields=messages,messaging_postbacks",
    });
    const sub = (await subRes.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
    if (!subRes.ok || !sub.success) return fail(sub.error?.message ?? "Could not subscribe the Page to webhooks.");

    await saveMetaSecrets(WORKSPACE, { page_access_token: data.pageAccessToken, app_secret: data.appSecret });
    const prev = await getMetaConfig(WORKSPACE);
    const ig = page.instagram_business_account ?? null;
    const config = {
      ...prev,
      page_id: data.pageId,
      page_name: page.name,
      ig_account_id: ig?.id ?? null,
      ig_username: ig?.username ?? null,
    };
    await supabaseAdmin
      .from("channel_connections")
      .update({ status: "CONNECTED", last_error: null, config: config as never, updated_at: now })
      .eq("workspace_id", WORKSPACE)
      .eq("channel", "messenger");
    await supabaseAdmin
      .from("channel_connections")
      .update({
        status: ig ? "CONNECTED" : "ERROR",
        last_error: ig ? null : "No Instagram professional account is linked to this Facebook Page.",
        config: config as never,
        updated_at: now,
      })
      .eq("workspace_id", WORKSPACE)
      .eq("channel", "instagram");
    await logIntegration(WORKSPACE, "meta", "info", `Connected Page "${page.name}"${ig ? ` and Instagram @${ig.username ?? ig.id}` : ""}`);
    return { ok: true as const, pageName: page.name, igUsername: ig?.username ?? null, instagramLinked: Boolean(ig) };
  });

export const disconnectMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMember(context.supabase as never);
    const { getMetaConfig, deleteMetaSecrets, logIntegration } = await import("@/lib/channels.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const prev = await getMetaConfig(WORKSPACE);
    await deleteMetaSecrets(WORKSPACE);
    await supabaseAdmin
      .from("channel_connections")
      .update({
        status: "NOT_CONNECTED",
        last_error: null,
        config: { verify_token: prev.verify_token } as never,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", WORKSPACE)
      .in("channel", ["instagram", "messenger"]);
    await logIntegration(WORKSPACE, "meta", "info", "Disconnected Instagram and Messenger");
    return { ok: true };
  });
