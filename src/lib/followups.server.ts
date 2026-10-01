import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { deliverOutbound } from "./channels.server";
import { formatSalonDateTime, formatSalonTime } from "./time";

/**
 * Booking follow-up engine, run on a schedule:
 *  1. Sends due appointment reminders (24h / 2h) and rebooking nudges from automation_events.
 *  2. Recovers abandoned enquiries (customer was offered times but went quiet).
 *  3. Queues rebooking nudges for customers who are due again.
 * Every send goes out on the conversation's original channel and is deduped by automation_events.dedupe_key.
 */

const HOUR = 3600000;
const db = () => supabaseAdmin;

async function sendToConversation(conversationId: string, text: string, kind: string) {
  const { data: conv } = await db()
    .from("conversations")
    .select("id,workspace_id,contact_id,channel,handling_mode")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return { delivered: false, error: "conversation missing" };
  const { data: cc } = await db()
    .from("contact_channels")
    .select("external_id")
    .eq("contact_id", conv.contact_id)
    .eq("channel", conv.channel)
    .maybeSingle();
  if (!cc?.external_id) return { delivered: false, error: "no recipient on this channel" };
  const delivery = await deliverOutbound({ workspaceId: conv.workspace_id, channel: conv.channel, recipientId: cc.external_id, text });
  await db().from("messages").insert({
    workspace_id: conv.workspace_id,
    conversation_id: conv.id,
    contact_id: conv.contact_id,
    channel: conv.channel,
    direction: "outbound",
    sender_type: "AI",
    sender_name: "AI",
    body: text,
    external_message_id: delivery.externalMessageId ?? null,
    metadata: { automation: kind, delivered: delivery.delivered, delivery_error: delivery.error ?? null } as never,
  });
  await db().from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv.id);
  return delivery;
}

type Appt = {
  id: string; starts_at: string; status: string; contact_id: string; conversation_id: string | null;
  service: { name: string } | null; staff: { name: string } | null; contact: { full_name: string | null } | null;
};

function firstName(a: Appt) {
  return a.contact?.full_name?.split(" ")[0] ?? "there";
}

function reminderText(kind: string, a: Appt): string | null {
  const svc = a.service?.name ?? "appointment";
  const who = a.staff?.name ? ` with ${a.staff.name}` : "";
  if (kind === "REMINDER_24H")
    return `Hi ${firstName(a)}, a quick reminder of your ${svc}${who} tomorrow, ${formatSalonDateTime(a.starts_at)}. Reply YES to confirm, or tell me if you need to reschedule and I'll find you a new time.`;
  if (kind === "REMINDER_2H")
    return `Hi ${firstName(a)}, see you at ${formatSalonTime(a.starts_at)} for your ${svc}${who}. Running late or can't make it? Just reply here.`;
  if (kind === "REBOOK")
    return `Hi ${firstName(a)}, it's been a few weeks since your ${svc}${who}. Would you like me to find you a time for the next one?`;
  return null;
}

async function sendDueEvents() {
  const now = new Date();
  const { data: due } = await db()
    .from("automation_events")
    .select("id,kind,appointment_id,conversation_id,scheduled_for")
    .eq("status", "SCHEDULED")
    .lte("scheduled_for", now.toISOString())
    .gte("scheduled_for", new Date(now.getTime() - 6 * HOUR).toISOString())
    .in("kind", ["REMINDER_24H", "REMINDER_2H", "REBOOK"])
    .limit(50);
  let sent = 0;
  for (const ev of due ?? []) {
    // Claim the event first so overlapping runs never double-send.
    const { data: claimed } = await db().from("automation_events").update({ status: "SENDING" }).eq("id", ev.id).eq("status", "SCHEDULED").select("id");
    if (!claimed?.length) continue;
    const { data: appt } = await db()
      .from("appointments")
      .select("id,starts_at,status,contact_id,conversation_id,service:service_id(name),staff:staff_id(name),contact:contact_id(full_name)")
      .eq("id", ev.appointment_id ?? "")
      .maybeSingle();
    const a = appt as unknown as Appt | null;
    const convId = ev.conversation_id ?? a?.conversation_id;
    const live = a && (ev.kind === "REBOOK" ? a.status === "COMPLETED" || a.status === "CONFIRMED" : a.status === "CONFIRMED" || a.status === "PENDING");
    const text = a ? reminderText(ev.kind, a) : null;
    if (!live || !text || !convId) {
      await db().from("automation_events").update({ status: "SKIPPED" }).eq("id", ev.id);
      continue;
    }
    if (ev.kind === "REBOOK") {
      const { count } = await db().from("appointments").select("id", { count: "exact", head: true })
        .eq("contact_id", a.contact_id).gt("starts_at", now.toISOString()).in("status", ["CONFIRMED", "PENDING"]);
      if (count) { await db().from("automation_events").update({ status: "SKIPPED" }).eq("id", ev.id); continue; }
    }
    const r = await sendToConversation(convId, text, ev.kind);
    await db().from("automation_events").update({ status: r.delivered ? "SENT" : "FAILED", sent_at: new Date().toISOString() }).eq("id", ev.id);
    if (r.delivered) sent++;
  }
  return sent;
}

/** Customer was offered times (or we were mid-booking) and stopped replying 3–20h ago. */
async function recoverAbandoned() {
  const now = Date.now();
  const { data: convs } = await db()
    .from("conversations")
    .select("id,workspace_id,contact_id,channel,state,last_message_at")
    .eq("handling_mode", "AI")
    .in("state", ["AWAITING_SLOT_SELECTION", "CHECKING_AVAILABILITY", "AWAITING_DETAILS"])
    .lte("last_message_at", new Date(now - 3 * HOUR).toISOString())
    .gte("last_message_at", new Date(now - 20 * HOUR).toISOString())
    .neq("channel", "test")
    .limit(30);
  let sent = 0;
  for (const c of convs ?? []) {
    const { data: last } = await db().from("messages").select("direction,sender_type,metadata").eq("conversation_id", c.id)
      .neq("direction", "internal").order("created_at", { ascending: false }).limit(1).maybeSingle();
    // Only nudge when the AI spoke last and it wasn't already a nudge.
    if (!last || last.direction !== "outbound" || last.sender_type !== "AI" || (last.metadata as { automation?: string } | null)?.automation) continue;
    const { count } = await db().from("appointments").select("id", { count: "exact", head: true })
      .eq("contact_id", c.contact_id).gt("starts_at", new Date().toISOString()).in("status", ["CONFIRMED", "PENDING"]);
    if (count) continue;
    const dedupe = `${c.id}:RECOVERY:${String(c.last_message_at).slice(0, 13)}`;
    const { data: ins, error } = await db().from("automation_events").insert({
      workspace_id: c.workspace_id, conversation_id: c.id, kind: "ENQUIRY_RECOVERY", channel: c.channel,
      scheduled_for: new Date().toISOString(), status: "SENDING", dedupe_key: dedupe,
    }).select("id").maybeSingle();
    if (error || !ins) continue; // already nudged
    const { data: contact } = await db().from("contacts").select("full_name").eq("id", c.contact_id).maybeSingle();
    const name = contact?.full_name?.split(" ")[0];
    const text = `Hi${name ? ` ${name}` : ""}, just checking in. Would you still like one of those times? I can hold one for you or find another day that suits better.`;
    const r = await sendToConversation(c.id, text, "ENQUIRY_RECOVERY");
    await db().from("automation_events").update({ status: r.delivered ? "SENT" : "FAILED", sent_at: new Date().toISOString() }).eq("id", ins.id);
    if (r.delivered) sent++;
  }
  return sent;
}

/** Queue a rebooking nudge ~5 weeks after each confirmed/completed appointment that ended recently. */
async function queueRebooking() {
  const now = Date.now();
  const { data: appts } = await db()
    .from("appointments")
    .select("id,workspace_id,conversation_id,starts_at,conversations:conversation_id(channel)")
    .in("status", ["CONFIRMED", "COMPLETED"])
    .lte("starts_at", new Date(now).toISOString())
    .gte("starts_at", new Date(now - 3 * 24 * HOUR).toISOString())
    .not("conversation_id", "is", null)
    .limit(200);
  const rows = (appts ?? []).map((a) => ({
    workspace_id: a.workspace_id, appointment_id: a.id, conversation_id: a.conversation_id,
    channel: (a.conversations as unknown as { channel: string } | null)?.channel ?? null,
    kind: "REBOOK", scheduled_for: new Date(new Date(a.starts_at).getTime() + 35 * 24 * HOUR).toISOString(),
    dedupe_key: `${a.id}:REBOOK`,
  }));
  if (rows.length) await db().from("automation_events").upsert(rows, { onConflict: "workspace_id,dedupe_key", ignoreDuplicates: true });
  return rows.length;
}

export async function runFollowups() {
  const [reminders, recovered, queued] = [await sendDueEvents(), await recoverAbandoned(), await queueRebooking()];
  return { reminders, recovered, queued };
}
