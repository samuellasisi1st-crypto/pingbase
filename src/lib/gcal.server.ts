// Salon's Google Calendar (workspace-owned connection via the connector gateway).
// Internal DB stays the source of truth; Google is mirrored + its busy blocks respected.
const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

function headers() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const conn = process.env["GOOGLE_CALENDAR_API_KEY"];
  if (!lovable || !conn) return null;
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn, "Content-Type": "application/json" };
}

/** Google event id derived from our appointment id (UUID hex is valid base32hex). */
export const eventIdFor = (appointmentId: string) => `pb${appointmentId.replace(/-/g, "")}`;

export async function getGoogleBusy(fromISO: string, toISO: string): Promise<Array<{ start: string; end: string }>> {
  const h = headers();
  if (!h) return [];
  try {
    const res = await fetch(`${GATEWAY}/freeBusy`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ timeMin: fromISO, timeMax: toISO, items: [{ id: "primary" }] }),
    });
    if (!res.ok) {
      console.error(`Google freeBusy failed [${res.status}]: ${await res.text()}`);
      return [];
    }
    const json = (await res.json()) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> };
    return json.calendars?.["primary"]?.busy ?? [];
  } catch (e) {
    console.error("Google freeBusy error", e);
    return [];
  }
}

/** Busy blocks that are not our own mirrored appointments. */
export async function getExternalBusy(fromISO: string, toISO: string, ownEventIds: Set<string>) {
  const h = headers();
  if (!h) return [];
  try {
    const q = new URLSearchParams({ timeMin: fromISO, timeMax: toISO, singleEvents: "true", maxResults: "250" });
    const res = await fetch(`${GATEWAY}/calendars/primary/events?${q}`, { headers: h });
    if (!res.ok) {
      console.error(`Google events list failed [${res.status}]: ${await res.text()}`);
      return getGoogleBusy(fromISO, toISO);
    }
    const json = (await res.json()) as {
      items?: Array<{ id: string; status?: string; transparency?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }>;
    };
    return (json.items ?? [])
      .filter((e) => e.status !== "cancelled" && e.transparency !== "transparent" && !e.id.startsWith("pb") && !ownEventIds.has(e.id))
      .map((e) => ({ start: e.start?.dateTime ?? e.start?.date ?? "", end: e.end?.dateTime ?? e.end?.date ?? "" }))
      .filter((b) => b.start && b.end);
  } catch (e) {
    console.error("Google events error", e);
    return [];
  }
}

export async function upsertGoogleEvent(ev: {
  appointmentId: string;
  title: string;
  description: string;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  attendeeEmail?: string | null;
}): Promise<{ ok: boolean; error?: string; invited?: boolean }> {
  const h = headers();
  if (!h) return { ok: false, error: "Google Calendar is not connected." };
  const id = eventIdFor(ev.appointmentId);
  const body = {
    id,
    summary: ev.title,
    description: ev.description,
    ...(ev.location ? { location: ev.location } : {}),
    start: { dateTime: ev.startsAt },
    end: { dateTime: ev.endsAt },
    ...(ev.attendeeEmail ? { attendees: [{ email: ev.attendeeEmail }] } : {}),
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 120 }] },
  };
  const q = "sendUpdates=all";
  let res = await fetch(`${GATEWAY}/calendars/primary/events/${id}?${q}`, { method: "PUT", headers: h, body: JSON.stringify(body) });
  if (res.status === 404) {
    res = await fetch(`${GATEWAY}/calendars/primary/events?${q}`, { method: "POST", headers: h, body: JSON.stringify(body) });
  }
  if (!res.ok) {
    const error = `Google Calendar [${res.status}]: ${await res.text()}`;
    console.error(error);
    return { ok: false, error };
  }
  return { ok: true, invited: !!ev.attendeeEmail };
}

export async function cancelGoogleEvent(appointmentId: string) {
  const h = headers();
  if (!h) return { ok: false };
  const res = await fetch(`${GATEWAY}/calendars/primary/events/${eventIdFor(appointmentId)}?sendUpdates=all`, {
    method: "DELETE",
    headers: h,
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    console.error(`Google delete failed [${res.status}]: ${await res.text()}`);
    return { ok: false };
  }
  return { ok: true };
}

/** Mirror an appointment onto the salon calendar and invite the customer by email if we have it. */
export async function syncAppointmentToGoogle(workspaceId: string, appointmentId: string) {
  try {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: appt } = await db
      .from("appointments")
      .select("*, service:service_id(name), staff:staff_id(name), contact:contact_id(full_name,email)")
      .eq("id", appointmentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (!appt) return { ok: false, error: "Appointment not found" };
    if (appt.status === "CANCELLED") return cancelGoogleEvent(appointmentId);
    const { data: settings } = await db.from("business_settings").select("legal_name,address").eq("workspace_id", workspaceId).maybeSingle();
    const service = (appt.service as unknown as { name: string } | null)?.name ?? "Appointment";
    const staff = (appt.staff as unknown as { name: string } | null)?.name ?? "";
    const contact = appt.contact as unknown as { full_name: string | null; email: string | null } | null;
    const business = settings?.legal_name ?? "Salon";
    const result = await upsertGoogleEvent({
      appointmentId,
      title: `${service}${contact?.full_name ? ` — ${contact.full_name}` : ""} (${business})`,
      description: `${service}${staff ? ` with ${staff}` : ""}. Status: ${appt.status}. Booked via Pingbase.`,
      location: settings?.address ?? null,
      startsAt: appt.starts_at,
      endsAt: appt.ends_at,
      attendeeEmail: contact?.email ?? null,
    });
    await db.from("integration_logs").insert({
      workspace_id: workspaceId,
      channel: "google_calendar",
      level: result.ok ? "info" : "error",
      message: result.ok ? `Synced appointment ${appointmentId}` : `Sync failed: ${result.error}`,
    } as never);
    return result;
  } catch (e) {
    console.error("Google sync error", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
