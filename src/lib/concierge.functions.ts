import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DEMO_WORKSPACE = "11111111-1111-1111-1111-111111111111";

/** Attach the signed-in user to the demo workspace so they can run the inbox. */
export const joinWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: (context.claims.email as string) ?? null }, { onConflict: "id" });
    await supabaseAdmin
      .from("workspace_members")
      .upsert({ workspace_id: DEMO_WORKSPACE, user_id: userId, role: "owner" }, { onConflict: "workspace_id,user_id" });
    return { workspaceId: DEMO_WORKSPACE };
  });

/** Customer-side inbound message on the internal test channel. */
export const sendCustomerMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        visitorId: z.string().min(6),
        name: z.string().optional().nullable(),
        body: z.string().min(1).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { processInboundMessage } = await import("./pipeline.server");
    const result = await processInboundMessage({
      workspaceId: DEMO_WORKSPACE,
      channel: "test",
      externalId: data.visitorId,
      externalMessageId: `${data.visitorId}-${Date.now()}`,
      displayName: data.name ?? null,
      body: data.body,
    });
    return result;
  });

/** Customer-side transcript for the test chat (no auth: scoped to their visitor id). */
export const getCustomerThread = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ visitorId: z.string().min(6) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link } = await supabaseAdmin
      .from("contact_channels")
      .select("contact_id")
      .eq("workspace_id", DEMO_WORKSPACE)
      .eq("channel", "test")
      .eq("external_id", data.visitorId)
      .maybeSingle();
    if (!link) return { messages: [], payments: [], handledBy: "AI" as string };

    const { data: conversation } = await supabaseAdmin
      .from("conversations")
      .select("id, handling_mode, state")
      .eq("contact_id", link.contact_id)
      .eq("channel", "test")
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!conversation) return { messages: [], payments: [], handledBy: "AI" as string };

    const [{ data: messages }, { data: payments }] = await Promise.all([
      supabaseAdmin
        .from("messages")
        .select("id,direction,sender_type,sender_name,body,created_at")
        .eq("conversation_id", conversation.id)
        .neq("direction", "internal")
        .order("created_at"),
      supabaseAdmin
        .from("payments")
        .select("id,amount_pence,status,provider")
        .eq("conversation_id", conversation.id)
        .order("created_at"),
    ]);
    return {
      messages: messages ?? [],
      payments: payments ?? [],
      handledBy: conversation.handling_mode,
      state: conversation.state,
    };
  });

/** Test-mode deposit payment. Mirrors what the Stripe webhook will do once connected. */
export const payDepositTestMode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ paymentId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!payment) throw new Error("Payment not found");
    if (payment.provider !== "test") throw new Error("This payment must be completed through Stripe.");
    if (payment.status === "PAID") return { ok: true, alreadyPaid: true };

    await supabaseAdmin
      .from("payments")
      .update({ status: "PAID", paid_at: new Date().toISOString() })
      .eq("id", payment.id);

    if (payment.appointment_id) {
      const { data: appt } = await supabaseAdmin
        .from("appointments")
        .update({ status: "CONFIRMED", deposit_status: "PAID" })
        .eq("id", payment.appointment_id)
        .select("*")
        .single();
      await supabaseAdmin.from("appointment_status_history").insert({
        workspace_id: payment.workspace_id,
        appointment_id: payment.appointment_id,
        from_status: "PENDING",
        to_status: "CONFIRMED",
        reason: "Deposit paid",
        actor: "SYSTEM",
      });
      const start = new Date(appt?.starts_at ?? new Date().toISOString()).getTime();
      await supabaseAdmin.from("automation_events").upsert(
        [
          { kind: "CONFIRMATION", scheduled_for: new Date().toISOString() },
          { kind: "REMINDER_24H", scheduled_for: new Date(start - 24 * 3600000).toISOString() },
          { kind: "REMINDER_2H", scheduled_for: new Date(start - 2 * 3600000).toISOString() },
          { kind: "FOLLOW_UP", scheduled_for: new Date(start + 26 * 3600000).toISOString() },
        ].map((r) => ({
          workspace_id: payment.workspace_id,
          appointment_id: payment.appointment_id,
          conversation_id: payment.conversation_id,
          kind: r.kind,
          scheduled_for: r.scheduled_for,
          dedupe_key: `${payment.appointment_id}:${r.kind}`,
        })),
        { onConflict: "workspace_id,dedupe_key" },
      );
      if (payment.conversation_id) {
        await supabaseAdmin.from("conversations").update({ state: "BOOKED" }).eq("id", payment.conversation_id);
      }
    }

    // Let the agent confirm in its own words, through the real pipeline.
    if (payment.conversation_id) {
      const { data: link } = await supabaseAdmin
        .from("contact_channels")
        .select("external_id, channel")
        .eq("contact_id", payment.contact_id!)
        .eq("channel", "test")
        .maybeSingle();
      if (link) {
        const { processInboundMessage } = await import("./pipeline.server");
        await processInboundMessage({
          workspaceId: payment.workspace_id,
          channel: "test",
          externalId: link.external_id,
          externalMessageId: `payment-${payment.id}`,
          body: "I've just paid the deposit.",
        });
      }
    }
    return { ok: true };
  });

/** Staff reply from the inbox; routes back out through the original channel. */
export const sendHumanReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ conversationId: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conversation, error } = await context.supabase
      .from("conversations")
      .select("*")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (error || !conversation) throw new Error("Conversation not found");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name,email")
      .eq("id", context.userId)
      .maybeSingle();

    const { deliverOutbound } = await import("@/lib/channels.server");
    const { data: link } = await supabaseAdmin
      .from("contact_channels")
      .select("external_id")
      .eq("workspace_id", conversation.workspace_id)
      .eq("contact_id", conversation.contact_id)
      .eq("channel", conversation.channel)
      .maybeSingle();
    const delivery = link
      ? await deliverOutbound({
          workspaceId: conversation.workspace_id,
          channel: conversation.channel,
          recipientId: link.external_id,
          text: data.body,
        })
      : { delivered: false, error: "No channel identity for this contact", externalMessageId: undefined };

    await supabaseAdmin.from("messages").insert({
      workspace_id: conversation.workspace_id,
      conversation_id: conversation.id,
      contact_id: conversation.contact_id,
      channel: conversation.channel,
      direction: "outbound",
      sender_type: "HUMAN",
      sender_name: profile?.full_name ?? profile?.email ?? "Team",
      body: data.body,
      external_message_id: delivery.externalMessageId ?? null,
      metadata: { delivered: delivery.delivered, delivery_error: delivery.error ?? null } as never,
    });

    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        unread: false,
        handling_mode: conversation.handling_mode === "AI" ? "HUMAN" : conversation.handling_mode,
        needs_attention: false,
        assigned_to: context.userId,
      })
      .eq("id", conversation.id);

    return { ok: true, delivered: conversation.channel === "test" };
  });

/** Take over / hand back to the AI. */
export const setHandlingMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        mode: z.enum(["AI", "HUMAN", "PAUSED"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conversation } = await context.supabase
      .from("conversations")
      .select("id, workspace_id")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conversation) throw new Error("Conversation not found");

    await supabaseAdmin
      .from("conversations")
      .update({
        handling_mode: data.mode,
        needs_attention: data.mode === "PAUSED",
        assigned_to: data.mode === "HUMAN" ? context.userId : null,
      })
      .eq("id", conversation.id);

    if (data.mode !== "PAUSED") {
      await supabaseAdmin
        .from("handoffs")
        .update({ status: data.mode === "HUMAN" ? "TAKEN" : "RESOLVED", taken_by: context.userId, resolved_at: new Date().toISOString() })
        .eq("conversation_id", conversation.id)
        .eq("status", "OPEN");
    }
    return { ok: true };
  });

/** Public payment details for the hosted deposit link. */
export const getPaymentPublic = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ paymentId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id,amount_pence,currency,status,provider,kind")
      .eq("id", data.paymentId)
      .maybeSingle();
    return payment ?? null;
  });
