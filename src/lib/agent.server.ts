import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { findAvailableSlots, isSlotStillFree } from "./availability.server";
import { formatSalonDateTime, money, SALON_TZ } from "./time";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER))
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

type Ctx = {
  workspaceId: string;
  conversationId: string;
  contactId: string;
  channel: string;
};

async function logAction(
  ctx: Ctx,
  toolName: string,
  input: unknown,
  output: unknown,
  success = true,
  error?: string,
) {
  await supabaseAdmin.from("ai_action_logs").insert({
    workspace_id: ctx.workspaceId,
    conversation_id: ctx.conversationId,
    tool_name: toolName,
    input: input as never,
    output: output as never,
    success,
    error: error ?? null,
  });
}

function wrap<T>(ctx: Ctx, name: string, fn: (args: T) => Promise<unknown>) {
  return async (args: T) => {
    try {
      const result = await fn(args);
      await logAction(ctx, name, args, result);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await logAction(ctx, name, args, { error: message }, false, message);
      return { ok: false, error: message };
    }
  };
}

async function scheduleAutomations(ctx: Ctx, appointmentId: string, startsAt: string) {
  const start = new Date(startsAt).getTime();
  const rows = [
    { kind: "CONFIRMATION", scheduled_for: new Date().toISOString() },
    { kind: "REMINDER_24H", scheduled_for: new Date(start - 24 * 3600000).toISOString() },
    { kind: "REMINDER_2H", scheduled_for: new Date(start - 2 * 3600000).toISOString() },
    { kind: "FOLLOW_UP", scheduled_for: new Date(start + 26 * 3600000).toISOString() },
  ].map((r) => ({
    workspace_id: ctx.workspaceId,
    conversation_id: ctx.conversationId,
    appointment_id: appointmentId,
    channel: ctx.channel,
    kind: r.kind,
    scheduled_for: r.scheduled_for,
    dedupe_key: `${appointmentId}:${r.kind}`,
  }));
  await supabaseAdmin.from("automation_events").upsert(rows, { onConflict: "workspace_id,dedupe_key" });
}

export function buildTools(ctx: Ctx) {
  const db = supabaseAdmin;

  return {
    search_services: tool({
      description: "List or search the services this business offers, with price, duration and deposit.",
      inputSchema: z.object({ query: z.string().nullable() }),
      execute: wrap(ctx, "search_services", async ({ query }) => {
        const { data } = await db
          .from("services")
          .select("id,name,description,price_pence,duration_minutes,deposit_pence")
          .eq("workspace_id", ctx.workspaceId)
          .eq("active", true);
        const list = (data ?? []).filter((s) =>
          query ? s.name.toLowerCase().includes(query.toLowerCase()) : true,
        );
        return (list.length ? list : (data ?? [])).map((s) => ({
          ...s,
          price: money(s.price_pence),
          deposit: s.deposit_pence ? money(s.deposit_pence) : "none",
        }));
      }),
    }),

    get_service_details: tool({
      description: "Get full details of one service, including which staff can perform it.",
      inputSchema: z.object({ service_id: z.string() }),
      execute: wrap(ctx, "get_service_details", async ({ service_id }) => {
        const { data: service } = await db.from("services").select("*").eq("id", service_id).maybeSingle();
        if (!service) return { ok: false, error: "Service not found" };
        const { data: staff } = await db
          .from("staff_services")
          .select("staff:staff_id(id,name,role_title)")
          .eq("service_id", service_id);
        return {
          ...service,
          price: money(service.price_pence),
          deposit: service.deposit_pence ? money(service.deposit_pence) : "none",
          staff: (staff ?? []).map((s) => s.staff),
        };
      }),
    }),

    get_staff: tool({
      description: "List the team members of the business.",
      inputSchema: z.object({}),
      execute: wrap(ctx, "get_staff", async () => {
        const { data } = await db
          .from("staff")
          .select("id,name,role_title,active")
          .eq("workspace_id", ctx.workspaceId);
        return data ?? [];
      }),
    }),

    find_available_slots: tool({
      description:
        "Find genuinely available appointment slots for a service. Always call before offering any time. Dates are ISO strings; the business timezone is Europe/London.",
      inputSchema: z.object({
        service_id: z.string(),
        staff_id: z.string().nullable(),
        from: z.string().nullable(),
        to: z.string().nullable(),
        time_of_day: z.enum(["morning", "afternoon", "evening", "any"]).nullable(),
      }),
      execute: wrap(ctx, "find_available_slots", async (args) => {
        const slots = await findAvailableSlots({
          workspaceId: ctx.workspaceId,
          serviceId: args.service_id,
          staffId: args.staff_id,
          fromISO: args.from,
          toISO: args.to,
          timeOfDay: args.time_of_day,
          limit: 8,
        });
        return {
          count: slots.length,
          slots: slots.map((s) => ({ ...s, label: `${formatSalonDateTime(s.starts_at)} with ${s.staff_name}` })),
        };
      }),
    }),

    get_customer: tool({
      description: "Get the profile of the customer in this conversation.",
      inputSchema: z.object({}),
      execute: wrap(ctx, "get_customer", async () => {
        const { data } = await db.from("contacts").select("*").eq("id", ctx.contactId).maybeSingle();
        return data ?? { ok: false, error: "Contact missing" };
      }),
    }),

    create_or_update_contact: tool({
      description: "Save details the customer gives you, such as their name, phone number or email.",
      inputSchema: z.object({
        full_name: z.string().nullable(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        notes: z.string().nullable(),
      }),
      execute: wrap(ctx, "create_or_update_contact", async (args) => {
        const patch: Record<string, string> = {};
        if (args.full_name) patch.full_name = args.full_name;
        if (args.email) patch.email = args.email;
        if (args.phone) patch.phone = args.phone;
        if (args.notes) patch.notes = args.notes;
        if (!Object.keys(patch).length) return { ok: true, updated: false };
        const { data, error } = await db
          .from("contacts")
          .update(patch)
          .eq("id", ctx.contactId)
          .select()
          .maybeSingle();
        if (error) throw error;
        return { ok: true, contact: data };
      }),
    }),

    find_customer_bookings: tool({
      description: "List this customer's appointments, upcoming and past.",
      inputSchema: z.object({ scope: z.enum(["upcoming", "past", "all"]).nullable() }),
      execute: wrap(ctx, "find_customer_bookings", async ({ scope }) => {
        let q = db
          .from("appointments")
          .select("id,starts_at,ends_at,status,deposit_status,price_pence,deposit_pence,service:service_id(name),staff:staff_id(name)")
          .eq("contact_id", ctx.contactId)
          .order("starts_at");
        if (scope === "upcoming") q = q.gte("starts_at", new Date().toISOString());
        if (scope === "past") q = q.lt("starts_at", new Date().toISOString());
        const { data } = await q;
        return (data ?? []).map((a) => ({
          ...a,
          when: formatSalonDateTime(a.starts_at),
        }));
      }),
    }),

    create_booking: tool({
      description:
        "Create an appointment. Only call with a slot returned by find_available_slots. Returns the booking and whether a deposit is required.",
      inputSchema: z.object({
        service_id: z.string(),
        staff_id: z.string(),
        starts_at: z.string(),
        notes: z.string().nullable(),
      }),
      execute: wrap(ctx, "create_booking", async (args) => {
        const { data: service } = await db.from("services").select("*").eq("id", args.service_id).maybeSingle();
        if (!service) return { ok: false, error: "Service not found" };
        const start = new Date(args.starts_at);
        const end = new Date(start.getTime() + service.duration_minutes * 60000);
        const free = await isSlotStillFree({
          workspaceId: ctx.workspaceId,
          staffId: args.staff_id,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
        });
        if (!free) return { ok: false, error: "SLOT_TAKEN", message: "That slot was just taken. Offer alternatives." };

        const { data: appt, error } = await db
          .from("appointments")
          .insert({
            workspace_id: ctx.workspaceId,
            contact_id: ctx.contactId,
            conversation_id: ctx.conversationId,
            service_id: args.service_id,
            staff_id: args.staff_id,
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            status: service.deposit_pence > 0 ? "PENDING" : "CONFIRMED",
            price_pence: service.price_pence,
            deposit_pence: service.deposit_pence,
            deposit_status: service.deposit_pence > 0 ? "REQUIRED" : "NOT_REQUIRED",
            notes: args.notes,
          })
          .select("*, service:service_id(name), staff:staff_id(name)")
          .single();
        if (error) throw error;

        await db.from("appointment_status_history").insert({
          workspace_id: ctx.workspaceId,
          appointment_id: appt.id,
          to_status: appt.status,
          reason: "Created by AI agent",
          actor: "AI",
        });
        await db.from("booking_events").insert({
          workspace_id: ctx.workspaceId,
          appointment_id: appt.id,
          conversation_id: ctx.conversationId,
          kind: "CREATED",
        });
        await db
          .from("conversations")
          .update({ state: service.deposit_pence > 0 ? "AWAITING_PAYMENT" : "BOOKED" })
          .eq("id", ctx.conversationId);
        if (service.deposit_pence === 0) await scheduleAutomations(ctx, appt.id, appt.starts_at);

        return {
          ok: true,
          appointment: { ...appt, when: formatSalonDateTime(appt.starts_at) },
          deposit_required: service.deposit_pence > 0,
          deposit: money(service.deposit_pence),
          status: appt.status,
        };
      }),
    }),

    reschedule_booking: tool({
      description: "Move an existing appointment to a new slot returned by find_available_slots.",
      inputSchema: z.object({
        appointment_id: z.string(),
        starts_at: z.string(),
        staff_id: z.string().nullable(),
      }),
      execute: wrap(ctx, "reschedule_booking", async (args) => {
        const { data: appt } = await db
          .from("appointments")
          .select("*, service:service_id(duration_minutes,name)")
          .eq("id", args.appointment_id)
          .maybeSingle();
        if (!appt) return { ok: false, error: "Appointment not found" };
        const duration = (appt.service as unknown as { duration_minutes: number }).duration_minutes;
        const staffId = args.staff_id ?? appt.staff_id;
        const start = new Date(args.starts_at);
        const end = new Date(start.getTime() + duration * 60000);
        const free = await isSlotStillFree({
          workspaceId: ctx.workspaceId,
          staffId,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          ignoreAppointmentId: appt.id,
        });
        if (!free) return { ok: false, error: "SLOT_TAKEN" };
        const { data: updated, error } = await db
          .from("appointments")
          .update({ starts_at: start.toISOString(), ends_at: end.toISOString(), staff_id: staffId })
          .eq("id", appt.id)
          .select("*, service:service_id(name), staff:staff_id(name)")
          .single();
        if (error) throw error;
        await db.from("appointment_status_history").insert({
          workspace_id: ctx.workspaceId,
          appointment_id: appt.id,
          from_status: appt.status,
          to_status: updated.status,
          reason: `Rescheduled from ${appt.starts_at}`,
          actor: "AI",
        });
        await db.from("booking_events").insert({
          workspace_id: ctx.workspaceId,
          appointment_id: appt.id,
          conversation_id: ctx.conversationId,
          kind: "RESCHEDULED",
          payload: { from: appt.starts_at, to: updated.starts_at } as never,
        });
        await scheduleAutomations(ctx, appt.id, updated.starts_at);
        return { ok: true, appointment: { ...updated, when: formatSalonDateTime(updated.starts_at) } };
      }),
    }),

    cancel_booking: tool({
      description: "Cancel an appointment after confirming with the customer and checking the policy.",
      inputSchema: z.object({ appointment_id: z.string(), reason: z.string().nullable() }),
      execute: wrap(ctx, "cancel_booking", async (args) => {
        const { data: appt } = await db
          .from("appointments")
          .select("*")
          .eq("id", args.appointment_id)
          .maybeSingle();
        if (!appt) return { ok: false, error: "Appointment not found" };
        const { error } = await db
          .from("appointments")
          .update({ status: "CANCELLED" })
          .eq("id", appt.id);
        if (error) throw error;
        await db.from("appointment_status_history").insert({
          workspace_id: ctx.workspaceId,
          appointment_id: appt.id,
          from_status: appt.status,
          to_status: "CANCELLED",
          reason: args.reason,
          actor: "AI",
        });
        await db
          .from("automation_events")
          .update({ status: "CANCELLED" })
          .eq("appointment_id", appt.id)
          .eq("status", "SCHEDULED");
        return { ok: true, cancelled: true, hours_notice: Math.round((new Date(appt.starts_at).getTime() - Date.now()) / 3600000) };
      }),
    }),

    send_payment_link: tool({
      description:
        "Create a deposit payment request for an appointment and return the payment link to share with the customer.",
      inputSchema: z.object({ appointment_id: z.string() }),
      execute: wrap(ctx, "send_payment_link", async ({ appointment_id }) => {
        const { data: appt } = await db.from("appointments").select("*").eq("id", appointment_id).maybeSingle();
        if (!appt) return { ok: false, error: "Appointment not found" };
        if (appt.deposit_pence <= 0) return { ok: true, deposit_required: false };
        const { data: existing } = await db
          .from("payments")
          .select("*")
          .eq("appointment_id", appointment_id)
          .eq("status", "PENDING")
          .maybeSingle();
        if (existing) return { ok: true, payment: existing, link: existing.link_url };
        const { data: conn } = await db
          .from("channel_connections")
          .select("status")
          .eq("workspace_id", ctx.workspaceId)
          .eq("channel", "stripe")
          .maybeSingle();
        const { data: payment, error } = await db
          .from("payments")
          .insert({
            workspace_id: ctx.workspaceId,
            contact_id: ctx.contactId,
            conversation_id: ctx.conversationId,
            appointment_id,
            amount_pence: appt.deposit_pence,
            kind: "DEPOSIT",
            status: "PENDING",
            provider: conn?.status === "CONNECTED" ? "stripe" : "test",
          })
          .select()
          .single();
        if (error) throw error;
        const link = `/pay/${payment.id}`;
        await db.from("payments").update({ link_url: link }).eq("id", payment.id);
        return {
          ok: true,
          amount: money(appt.deposit_pence),
          link,
          note: conn?.status === "CONNECTED" ? "Stripe checkout link" : "Stripe is not connected yet; this is a test-mode deposit request.",
        };
      }),
    }),

    check_payment_status: tool({
      description: "Check whether a deposit has actually been paid.",
      inputSchema: z.object({ appointment_id: z.string() }),
      execute: wrap(ctx, "check_payment_status", async ({ appointment_id }) => {
        const { data } = await db
          .from("payments")
          .select("id,status,amount_pence,paid_at")
          .eq("appointment_id", appointment_id)
          .order("created_at", { ascending: false });
        return { payments: data ?? [] };
      }),
    }),

    search_business_knowledge: tool({
      description:
        "Search the business knowledge base and policies. Use this for any question about the business rather than guessing.",
      inputSchema: z.object({ query: z.string() }),
      execute: wrap(ctx, "search_business_knowledge", async ({ query }) => {
        const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
        const [{ data: knowledge }, { data: policies }] = await Promise.all([
          db.from("knowledge_sources").select("title,body,kind,tags").eq("workspace_id", ctx.workspaceId).eq("active", true),
          db.from("business_policies").select("title,body,kind").eq("workspace_id", ctx.workspaceId),
        ]);
        const all = [...(knowledge ?? []), ...(policies ?? [])];
        const scored = all
          .map((item) => {
            const hay = `${item.title} ${item.body} ${"tags" in item ? (item.tags ?? []).join(" ") : ""}`.toLowerCase();
            const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
            return { item, score };
          })
          .sort((a, b) => b.score - a.score);
        const top = scored.filter((s) => s.score > 0).slice(0, 5).map((s) => s.item);
        return { results: top.length ? top : all.slice(0, 5) };
      }),
    }),

    escalate_to_human: tool({
      description:
        "Hand the conversation to a member of staff. Use for refunds, complaints, policy exceptions, explicit requests for a person, or when you are unsure.",
      inputSchema: z.object({
        reason: z.string(),
        summary: z.string(),
        recommended_action: z.string().nullable(),
      }),
      execute: wrap(ctx, "escalate_to_human", async (args) => {
        await db.from("handoffs").insert({
          workspace_id: ctx.workspaceId,
          conversation_id: ctx.conversationId,
          reason: args.reason,
          summary: args.summary,
          recommended_action: args.recommended_action,
        });
        await db
          .from("conversations")
          .update({ handling_mode: "PAUSED", needs_attention: true, state: "NEEDS_HUMAN", unread: true })
          .eq("id", ctx.conversationId);
        return { ok: true, escalated: true };
      }),
    }),

    add_internal_note: tool({
      description: "Add a private note for the business team. The customer never sees it.",
      inputSchema: z.object({ note: z.string() }),
      execute: wrap(ctx, "add_internal_note", async ({ note }) => {
        await db.from("messages").insert({
          workspace_id: ctx.workspaceId,
          conversation_id: ctx.conversationId,
          contact_id: ctx.contactId,
          channel: ctx.channel,
          direction: "internal",
          sender_type: "AI",
          sender_name: "AI note",
          body: note,
        });
        return { ok: true };
      }),
    }),

    set_conversation_state: tool({
      description:
        "Record where the conversation currently is. One of DISCOVERY, COLLECTING_REQUIREMENTS, CHECKING_AVAILABILITY, AWAITING_SLOT_SELECTION, AWAITING_DETAILS, AWAITING_PAYMENT, BOOKED, RESCHEDULING, CANCELLING, NEEDS_HUMAN, COMPLETED.",
      inputSchema: z.object({
        state: z.string(),
        intent: z.string().nullable(),
      }),
      execute: wrap(ctx, "set_conversation_state", async ({ state, intent }) => {
        await db
          .from("conversations")
          .update({ state, ...(intent ? { intent } : {}) })
          .eq("id", ctx.conversationId);
        return { ok: true };
      }),
    }),
  };
}

export async function runAgent(ctx: Ctx): Promise<string> {
  const db = supabaseAdmin;
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const [
    { data: settings },
    { data: agent },
    { data: contact },
    { data: conversation },
    { data: history },
    { data: services },
    { data: staff },
    { data: appointments },
  ] = await Promise.all([
    db.from("business_settings").select("*").eq("workspace_id", ctx.workspaceId).maybeSingle(),
    db.from("ai_agent_settings").select("*").eq("workspace_id", ctx.workspaceId).maybeSingle(),
    db.from("contacts").select("*").eq("id", ctx.contactId).maybeSingle(),
    db.from("conversations").select("*").eq("id", ctx.conversationId).maybeSingle(),
    db
      .from("messages")
      .select("direction,sender_type,sender_name,body,created_at")
      .eq("conversation_id", ctx.conversationId)
      .order("created_at")
      .limit(60),
    db.from("services").select("id,name,price_pence,duration_minutes,deposit_pence").eq("workspace_id", ctx.workspaceId).eq("active", true),
    db.from("staff").select("id,name,role_title").eq("workspace_id", ctx.workspaceId).eq("active", true),
    db
      .from("appointments")
      .select("id,starts_at,status,deposit_status,service:service_id(name),staff:staff_id(name)")
      .eq("contact_id", ctx.contactId)
      .order("starts_at"),
  ]);

  const now = new Date();
  const system = [
    `You are ${agent?.agent_name ?? "the assistant"}, the booking concierge for ${settings?.legal_name ?? "this business"}.`,
    `Tone: ${agent?.tone ?? "warm and concise"}.`,
    agent?.instructions ?? "",
    `Escalation rules: ${agent?.escalation_rules ?? ""}`,
    `Never discuss: ${agent?.forbidden_topics ?? "n/a"}`,
    "",
    `Current date and time: ${formatSalonDateTime(now.toISOString())} (${SALON_TZ}). ISO: ${now.toISOString()}.`,
    `Address: ${settings?.address ?? ""}. Phone: ${settings?.phone ?? ""}.`,
    `Booking rules: minimum ${settings?.min_notice_minutes ?? 120} minutes notice, up to ${settings?.max_days_ahead ?? 90} days ahead, ${settings?.buffer_minutes ?? 15} minutes buffer between appointments.`,
    "",
    "Services (id | name | price | duration | deposit):",
    ...(services ?? []).map(
      (s) => `- ${s.id} | ${s.name} | ${money(s.price_pence)} | ${s.duration_minutes} min | ${s.deposit_pence ? money(s.deposit_pence) : "no deposit"}`,
    ),
    "Team:",
    ...(staff ?? []).map((s) => `- ${s.id} | ${s.name} (${s.role_title ?? ""})`),
    "",
    `Customer: ${contact?.full_name ?? "unknown name"}${contact?.email ? `, ${contact.email}` : ""}${contact?.phone ? `, ${contact.phone}` : ""}. Channel: ${ctx.channel}.`,
    `Their appointments: ${(appointments ?? []).length ? (appointments ?? []).map((a) => `${a.id} ${formatSalonDateTime(a.starts_at)} ${(a.service as unknown as { name: string })?.name} with ${(a.staff as unknown as { name: string })?.name} [${a.status}/${a.deposit_status}]`).join("; ") : "none"}`,
    `Conversation state: ${conversation?.state ?? "DISCOVERY"}.`,
    "",
    "RULES:",
    "- Never invent availability, prices, services, policies, payments or appointments. Always use your tools.",
    "- Never say an appointment is booked, moved, cancelled or paid unless the matching tool returned success.",
    "- Offer at most 3 options at a time and keep replies short, like a real person messaging.",
    "- Remember what the customer already told you. Never re-ask for information you already have.",
    "- Ask only for information you genuinely still need (name is required before booking).",
    "- When a deposit is required, create the booking first, then send the payment link, and explain the slot is held until the deposit is paid.",
    "- Use escalate_to_human for refunds, complaints, policy exceptions, requests for a person, or repeated tool failures. After escalating, tell the customer a team member will pick it up, and stop.",
    "- Keep set_conversation_state up to date.",
    "- Reply as plain conversational text. No markdown headings or bullet lists unless listing slot options.",
  ].join("\n");

  const transcript = (history ?? [])
    .filter((m) => m.direction !== "internal")
    .map((m) => ({
      role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
      content:
        m.direction === "outbound" && m.sender_type === "HUMAN"
          ? `[staff member ${m.sender_name ?? ""}] ${m.body}`
          : m.body,
    }));

  const runIdFetch = createRunIdFetch();
  const openai = createOpenAI({
    apiKey,
    baseURL: GATEWAY_URL,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch as typeof fetch,
  });

  const result = streamText({
    model: openai.responses(MODEL),
    system,
    messages: transcript,
    tools: buildTools(ctx),
    stopWhen: stepCountIs(30),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return (await result.text).trim();
}
