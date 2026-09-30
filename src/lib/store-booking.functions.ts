import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function storeService(slug: string, serviceId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ws } = await supabaseAdmin.from("workspaces").select("id,name").eq("slug", slug).eq("store_enabled", true).maybeSingle();
  if (!ws) throw new Error("This store isn't available.");
  const { data: s } = await supabaseAdmin.from("services").select("*").eq("id", serviceId).eq("workspace_id", ws.id).maybeSingle();
  if (!s || !s.active || s.archived || !s.visible_in_store || !s.online_booking) throw new Error("This service can't be booked online.");
  return { db: supabaseAdmin, ws, service: s };
}

export const getStoreSlots = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(60), serviceId: z.string().uuid(), fromISO: z.string().datetime() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { ws } = await storeService(data.slug, data.serviceId);
      const { findAvailableSlots } = await import("./availability.server");
      const from = new Date(Math.max(Date.parse(data.fromISO), Date.now()));
      const to = new Date(Date.parse(data.fromISO) + 86400000);
      const slots = await findAvailableSlots({ workspaceId: ws.id, serviceId: data.serviceId, fromISO: from.toISOString(), toISO: to.toISOString(), limit: 40 });
      return { slots: slots.map((s) => ({ starts_at: s.starts_at, ends_at: s.ends_at, staff_id: s.staff_id, staff_name: s.staff_name })), error: null as string | null };
    } catch (e) {
      console.error("store slots", e);
      return { slots: [], error: "We couldn't check open times right now. Please message us instead." };
    }
  });

export const createStoreBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    slug: z.string().min(1).max(60), serviceId: z.string().uuid(), staffId: z.string().uuid(), startsAt: z.string().datetime(),
    name: z.string().trim().min(1).max(100), phone: z.string().trim().max(30).default(""),
    email: z.string().trim().email().max(200).or(z.literal("")).default(""), notes: z.string().trim().max(1000).default(""),
  }).refine((v) => v.phone || v.email, { message: "Add a phone number or email." }).parse(d))
  .handler(async ({ data }) => {
    const { db, ws, service } = await storeService(data.slug, data.serviceId);
    const { isSlotStillFree } = await import("./availability.server");
    const start = new Date(data.startsAt);
    const end = new Date(start.getTime() + service.duration_minutes * 60000);
    const { data: link } = await db.from("staff_services").select("id").eq("service_id", service.id).eq("staff_id", data.staffId).maybeSingle();
    if (!link) throw new Error("That time is no longer available.");
    if (start.getTime() < Date.now()) throw new Error("That time has passed.");
    const free = await isSlotStillFree({ workspaceId: ws.id, staffId: data.staffId, startsAt: start.toISOString(), endsAt: end.toISOString() });
    if (!free) throw new Error("Sorry, that time was just taken. Please pick another.");

    // Reuse an existing contact only on an exact email/phone match inside this business.
    let contactId: string | null = null;
    if (data.email) contactId = (await db.from("contacts").select("id").eq("workspace_id", ws.id).ilike("email", data.email).limit(1).maybeSingle()).data?.id ?? null;
    if (!contactId && data.phone) contactId = (await db.from("contacts").select("id").eq("workspace_id", ws.id).eq("phone", data.phone).limit(1).maybeSingle()).data?.id ?? null;
    if (!contactId) {
      const { data: c, error } = await db.from("contacts").insert({ workspace_id: ws.id, full_name: data.name, email: data.email || null, phone: data.phone || null, tags: ["store"] }).select("id").single();
      if (error) throw new Error("Couldn't save your booking. Please try again.");
      contactId = c.id;
    }
    await db.from("contacts").update({ last_interaction_at: new Date().toISOString() }).eq("id", contactId);

    // Everyone pays in person on the day until online payments exist.
    const pay = "in person on the day";
    const { data: appt, error } = await db.from("appointments").insert({
      workspace_id: ws.id, contact_id: contactId, service_id: service.id, staff_id: data.staffId,
      starts_at: start.toISOString(), ends_at: end.toISOString(), status: "CONFIRMED",
      price_pence: service.price_pence, deposit_pence: service.deposit_pence,
      deposit_status: service.deposit_pence > 0 ? "PAY_IN_STORE" : "NOT_REQUIRED",
      notes: [data.notes, `Booked online via store · Payment: ${pay}`].filter(Boolean).join(" · "),
    }).select("id,starts_at,ends_at, staff:staff_id(name)").single();
    if (error || !appt) throw new Error("Couldn't save your booking. Please try again.");
    await db.from("appointment_status_history").insert({ workspace_id: ws.id, appointment_id: appt.id, to_status: "CONFIRMED", reason: "Booked by customer on the online store", actor: "CUSTOMER" });
    await db.from("booking_events").insert({ workspace_id: ws.id, appointment_id: appt.id, kind: "CREATED", payload: { source: "store", payment_method: "IN_STORE" } as never });

    let invite = false;
    try {
      const { upsertGoogleEvent } = await import("./gcal.server");
      const { data: bs } = await db.from("business_settings").select("address").eq("workspace_id", ws.id).maybeSingle();
      const r = await upsertGoogleEvent(ws.id, {
        appointmentId: appt.id, summary: `${service.name} — ${data.name}`,
        description: `${service.name}. Booked online with ${ws.name}.`, location: service.location_type === "online" ? "Phone / video call" : bs?.address ?? null,
        startISO: appt.starts_at, endISO: appt.ends_at, attendeeEmail: data.email || null, attendeeName: data.name, timeZone: "Europe/London",
      });
      invite = Boolean(r);
    } catch (e) { console.error("store booking calendar sync", e); }

    return { id: appt.id, starts_at: appt.starts_at, staff_name: (appt.staff as { name?: string } | null)?.name ?? null, invite };
  });
