import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runAgent } from "./agent.server";

export const DEMO_WORKSPACE_ID = "11111111-1111-1111-1111-111111111111";

export type InboundMessage = {
  workspaceId: string;
  channel: string;
  externalId: string; // sender identity on that channel
  externalMessageId?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  body: string;
  threadId?: string | null;
  subject?: string | null;
  metadata?: Record<string, unknown>;
  attachments?: Array<{ path: string; filename: string; mime: string; kind: string }>;
};

async function resolveContact(msg: InboundMessage) {
  const db = supabaseAdmin;
  const { data: existing } = await db
    .from("contact_channels")
    .select("contact_id")
    .eq("workspace_id", msg.workspaceId)
    .eq("channel", msg.channel)
    .eq("external_id", msg.externalId)
    .maybeSingle();
  if (existing) return existing.contact_id;

  // Conservative identity matching: only verified email or phone links accounts.
  let contactId: string | null = null;
  if (msg.email) {
    const { data } = await db
      .from("contacts")
      .select("id")
      .eq("workspace_id", msg.workspaceId)
      .ilike("email", msg.email)
      .maybeSingle();
    contactId = data?.id ?? null;
  }
  if (!contactId && msg.phone) {
    const { data } = await db
      .from("contacts")
      .select("id")
      .eq("workspace_id", msg.workspaceId)
      .eq("phone", msg.phone)
      .maybeSingle();
    contactId = data?.id ?? null;
  }
  if (!contactId) {
    const { data, error } = await db
      .from("contacts")
      .insert({
        workspace_id: msg.workspaceId,
        full_name: msg.displayName ?? null,
        email: msg.email ?? null,
        phone: msg.phone ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    contactId = data.id;
  }

  await db.from("contact_channels").upsert(
    {
      workspace_id: msg.workspaceId,
      contact_id: contactId,
      channel: msg.channel,
      external_id: msg.externalId,
      display_name: msg.displayName ?? null,
      verified: Boolean(msg.email || msg.phone),
    },
    { onConflict: "workspace_id,channel,external_id" },
  );

  return contactId;
}

async function resolveConversation(msg: InboundMessage, contactId: string) {
  const db = supabaseAdmin;
  let query = db
    .from("conversations")
    .select("*")
    .eq("workspace_id", msg.workspaceId)
    .eq("contact_id", contactId)
    .eq("channel", msg.channel)
    .neq("status", "CLOSED")
    .order("last_message_at", { ascending: false })
    .limit(1);
  if (msg.threadId) query = query.eq("external_thread_id", msg.threadId);
  const { data } = await query;
  const existing = data?.[0];
  if (existing) return existing;

  const { data: created, error } = await db
    .from("conversations")
    .insert({
      workspace_id: msg.workspaceId,
      contact_id: contactId,
      channel: msg.channel,
      external_thread_id: msg.threadId ?? null,
      subject: msg.subject ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return created;
}

/** Full inbound pipeline: normalise, dedupe, persist, then let the AI respond. */
export async function processInboundMessage(msg: InboundMessage) {
  const db = supabaseAdmin;

  if (msg.externalMessageId) {
    const { data: dupe } = await db
      .from("messages")
      .select("id, conversation_id")
      .eq("workspace_id", msg.workspaceId)
      .eq("channel", msg.channel)
      .eq("external_message_id", msg.externalMessageId)
      .maybeSingle();
    if (dupe) return { conversationId: dupe.conversation_id, duplicate: true };
  }

  const contactId = await resolveContact(msg);
  const conversation = await resolveConversation(msg, contactId);

  // Voice notes: transcribe so Nia (and the team) can read what was said.
  let body = msg.body;
  const transcripts: string[] = [];
  for (const att of msg.attachments ?? []) {
    const { isAudio, transcribeStoredAudio } = await import("./media-understanding.server");
    if (!isAudio(att)) continue;
    try {
      const text = await transcribeStoredAudio(att.path, att.mime, att.filename);
      if (text) transcripts.push(text);
    } catch (e) {
      console.error("Voice note transcription error", e);
    }
  }
  if (transcripts.length) {
    body = `🎤 Voice note: "${transcripts.join(" ")}"`;
  }

  await db.from("messages").insert({
    workspace_id: msg.workspaceId,
    conversation_id: conversation.id,
    contact_id: contactId,
    channel: msg.channel,
    external_message_id: msg.externalMessageId ?? null,
    direction: "inbound",
    sender_type: "CUSTOMER",
    body,
    content_type: msg.attachments?.length ? (msg.attachments[0]!.kind === "image" ? "image" : "file") : "text",
    attachments: (msg.attachments ?? []) as never,
    metadata: { ...(msg.metadata ?? {}), ...(transcripts.length ? { transcript: transcripts.join(" ") } : {}) } as never,
  });

  const nowIso = new Date().toISOString();
  await db
    .from("conversations")
    .update({ last_message_at: nowIso, unread: true })
    .eq("id", conversation.id);
  await db.from("contacts").update({ last_interaction_at: nowIso }).eq("id", contactId);

  if (conversation.handling_mode !== "AI") {
    return { conversationId: conversation.id, aiReplied: false, reason: conversation.handling_mode };
  }

  // Simple lock so two workers never answer the same conversation at once.
  const lockCutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: locked } = await db
    .from("conversations")
    .update({ ai_lock_at: nowIso })
    .eq("id", conversation.id)
    .or(`ai_lock_at.is.null,ai_lock_at.lt.${lockCutoff}`)
    .select("id");
  if (!locked || !locked.length) {
    return { conversationId: conversation.id, aiReplied: false, reason: "BUSY" };
  }

  try {
    const reply = await runAgent({
      workspaceId: msg.workspaceId,
      conversationId: conversation.id,
      contactId,
      channel: msg.channel,
    });
    if (reply) {
      const { deliverOutbound } = await import("./channels.server");
      const delivery = await deliverOutbound({
        workspaceId: msg.workspaceId,
        channel: msg.channel,
        recipientId: msg.externalId,
        text: reply,
      });
      await db.from("messages").insert({
        workspace_id: msg.workspaceId,
        conversation_id: conversation.id,
        contact_id: contactId,
        channel: msg.channel,
        direction: "outbound",
        sender_type: "AI",
        sender_name: "AI",
        body: reply,
        external_message_id: delivery.externalMessageId ?? null,
        metadata: { delivered: delivery.delivered, delivery_error: delivery.error ?? null } as never,
      });
      await db
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
    }
    return { conversationId: conversation.id, aiReplied: Boolean(reply), reply };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.from("integration_logs").insert({
      workspace_id: msg.workspaceId,
      channel: msg.channel,
      level: "error",
      message: `AI agent failed: ${message}`,
    });
    await db.from("handoffs").insert({
      workspace_id: msg.workspaceId,
      conversation_id: conversation.id,
      reason: "AI unavailable",
      summary: `The assistant could not process this message: ${message}`,
      recommended_action: "Reply manually to the customer.",
    });
    await db
      .from("conversations")
      .update({ handling_mode: "PAUSED", needs_attention: true, state: "NEEDS_HUMAN" })
      .eq("id", conversation.id);
    return { conversationId: conversation.id, aiReplied: false, error: message };
  } finally {
    await db.from("conversations").update({ ai_lock_at: null }).eq("id", conversation.id);
  }
}
