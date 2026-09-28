import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadConversation(supabase: any, id: string) {
  const { data, error } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Conversation not found");
  return data as { id: string; workspace_id: string; contact_id: string; channel: string; handling_mode: string };
}

/** Send an uploaded attachment (already in the private bucket) to the customer. */
export const sendAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ conversationId: z.string().uuid(), path: z.string().min(3).max(500), filename: z.string().max(200), mime: z.string().max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const c = await loadConversation(context.supabase, data.conversationId);
    if (!data.path.startsWith(`${c.workspace_id}/`)) throw new Error("Invalid attachment path");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deliverAttachment } = await import("@/lib/channels.server");
    const { data: signed, error } = await supabaseAdmin.storage.from("attachments").createSignedUrl(data.path, 60 * 60 * 24 * 7);
    if (error || !signed) throw new Error("Could not prepare the file");
    const { data: link } = await supabaseAdmin.from("contact_channels").select("external_id")
      .eq("workspace_id", c.workspace_id).eq("contact_id", c.contact_id).eq("channel", c.channel).maybeSingle();
    const kind = data.mime.startsWith("image/") ? "image" : "file";
    const delivery = link
      ? await deliverAttachment({ workspaceId: c.workspace_id, channel: c.channel, recipientId: link.external_id, url: signed.signedUrl, kind, filename: data.filename })
      : { delivered: false, error: "No channel identity for this contact", externalMessageId: undefined };
    await supabaseAdmin.from("messages").insert({
      workspace_id: c.workspace_id, conversation_id: c.id, contact_id: c.contact_id, channel: c.channel,
      direction: "outbound", sender_type: "HUMAN", sender_name: "Team",
      content_type: kind, body: `📎 ${data.filename}`,
      attachments: [{ path: data.path, filename: data.filename, mime: data.mime }] as never,
      external_message_id: delivery.externalMessageId ?? null,
      metadata: { delivered: delivery.delivered, delivery_error: delivery.error ?? null } as never,
    });
    await supabaseAdmin.from("conversations").update({
      last_message_at: new Date().toISOString(),
      handling_mode: c.handling_mode === "AI" ? "HUMAN" : c.handling_mode, assigned_to: context.userId,
    }).eq("id", c.id);
    if (!delivery.delivered) throw new Error(delivery.error ?? "The file could not be delivered");
    return { ok: true };
  });

/** Real open slots for the composer's calendar picker. */
export const composerSlots = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid(), serviceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const c = await loadConversation(context.supabase, data.conversationId);
    const { findAvailableSlots } = await import("@/lib/availability.server");
    try {
      return { slots: await findAvailableSlots({ workspaceId: c.workspace_id, serviceId: data.serviceId, limit: 6 }), error: null };
    } catch (e) {
      return { slots: [], error: e instanceof Error ? e.message : "Availability could not be checked" };
    }
  });

/** Google Calendar busy blocks for the date range shown on the Appointments calendar. */
export const calendarBusy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ fromISO: z.string(), toISO: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: m } = await context.supabase.from("workspace_members").select("workspace_id").eq("user_id", context.userId).limit(1).maybeSingle();
    if (!m) return { connected: false, busy: [], hours: {}, timeOff: [], error: null as string | null };
    const { getGoogleBusy, getGoogleStatus } = await import("@/lib/gcal.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [status, settings, timeOff] = await Promise.all([
      getGoogleStatus(m.workspace_id),
      supabaseAdmin.from("business_settings").select("opening_hours").eq("workspace_id", m.workspace_id).maybeSingle(),
      supabaseAdmin.from("staff_time_off").select("starts_at,ends_at,reason,staff:staff_id(name)").eq("workspace_id", m.workspace_id)
        .lt("starts_at", data.toISO).gt("ends_at", data.fromISO),
    ]);
    const hours = (settings.data?.opening_hours ?? {}) as Record<string, [string, string] | null>;
    const connected = Boolean(status && (status as { status?: string }).status === "CONNECTED");
    let busy: Array<{ start: string; end: string }> = [];
    let error: string | null = null;
    if (connected) {
      try { busy = await getGoogleBusy(m.workspace_id, data.fromISO, data.toISO); }
      catch (e) { error = e instanceof Error ? e.message : "Google Calendar could not be read"; }
    }
    return { connected, busy, hours, timeOff: (timeOff.data ?? []) as unknown as Array<{ starts_at: string; ends_at: string; reason: string | null; staff: { name: string } | null }>, error };
  });

/** AI drafts a reply for the team member to edit — never sent automatically. */
export const draftReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid(), hint: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const c = await loadConversation(context.supabase, data.conversationId);
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveAgentForConversation } = await import("@/lib/agent.server");
    const [agent, { data: history }, { data: settings }] = await Promise.all([
      resolveAgentForConversation(c.workspace_id, c.id),
      supabaseAdmin.from("messages").select("direction,sender_type,body").eq("conversation_id", c.id).neq("direction", "internal").order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("business_settings").select("legal_name").eq("workspace_id", c.workspace_id).maybeSingle(),
    ]);
    const transcript = (history ?? []).reverse().map((m) => `${m.direction === "inbound" ? "Customer" : m.sender_type === "AI" ? "Assistant" : "Team"}: ${m.body}`).join("\n");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const openai = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
    const result = streamText({
      model: openai.responses("openai/gpt-6-astra"),
      system: `You draft a reply for a human team member at ${settings?.legal_name ?? "the business"}. Tone: ${agent?.tone ?? "warm, concise"}. Never invent prices, availability or bookings; if unknown, say you'll check. Reply with only the message text, under 80 words.`,
      prompt: `${transcript}\n\n${data.hint ? `Team note: ${data.hint}\n` : ""}Draft the next Team reply.`,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    const text = (await result.text).trim();
    if (!text) throw new Error("No draft was produced");
    return { text };
  });
