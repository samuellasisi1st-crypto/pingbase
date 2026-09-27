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
