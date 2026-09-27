import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { zonedToUtc, zonedParts, SALON_TZ } from "./time";

export type Slot = {
  starts_at: string;
  ends_at: string;
  staff_id: string;
  staff_name: string;
  service_id: string;
  service_name: string;
};

type Options = {
  workspaceId: string;
  serviceId: string;
  staffId?: string | null;
  fromISO?: string | null;
  toISO?: string | null;
  timeOfDay?: "morning" | "afternoon" | "evening" | "any" | null;
  limit?: number;
  ignoreAppointmentId?: string | null;
};

const STEP_MINUTES = 15;

export async function findAvailableSlots(opts: Options): Promise<Slot[]> {
  const db = supabaseAdmin;
  const limit = opts.limit ?? 8;

  const [{ data: service }, { data: settings }] = await Promise.all([
    db.from("services").select("*").eq("id", opts.serviceId).maybeSingle(),
    db
      .from("business_settings")
      .select("*")
      .eq("workspace_id", opts.workspaceId)
      .maybeSingle(),
  ]);
  if (!service) throw new Error("Service not found");

  const buffer = settings?.buffer_minutes ?? 15;
  const minNotice = settings?.min_notice_minutes ?? 120;
  const maxDays = settings?.max_days_ahead ?? 90;
  const openingHours = (settings?.opening_hours ?? {}) as Record<
    string,
    [string, string] | null
  >;

  const now = new Date();
  const earliest = new Date(now.getTime() + minNotice * 60000);
  const rangeStart = opts.fromISO ? new Date(opts.fromISO) : earliest;
  const hardEnd = new Date(now.getTime() + maxDays * 86400000);
  let rangeEnd = opts.toISO ? new Date(opts.toISO) : new Date(rangeStart.getTime() + 7 * 86400000);
  if (rangeEnd > hardEnd) rangeEnd = hardEnd;
  if (rangeEnd <= rangeStart) rangeEnd = new Date(rangeStart.getTime() + 86400000);

  const { data: eligible } = await db
    .from("staff_services")
    .select("staff_id, staff:staff_id(id,name,active)")
    .eq("service_id", opts.serviceId)
    .eq("workspace_id", opts.workspaceId);

  let staffList = (eligible ?? [])
    .map((r) => r.staff as unknown as { id: string; name: string; active: boolean } | null)
    .filter((s): s is { id: string; name: string; active: boolean } => !!s && s.active);
  if (opts.staffId) staffList = staffList.filter((s) => s.id === opts.staffId);
  if (!staffList.length) return [];

  const staffIds = staffList.map((s) => s.id);

  const [{ data: hours }, { data: timeOff }, { data: appts }] = await Promise.all([
    db.from("staff_working_hours").select("*").in("staff_id", staffIds),
    db
      .from("staff_time_off")
      .select("*")
      .in("staff_id", staffIds)
      .lt("starts_at", rangeEnd.toISOString())
      .gt("ends_at", rangeStart.toISOString()),
    db
      .from("appointments")
      .select("id,staff_id,starts_at,ends_at,status")
      .in("staff_id", staffIds)
      .in("status", ["PENDING", "CONFIRMED"])
      .lt("starts_at", new Date(rangeEnd.getTime() + 86400000).toISOString())
      .gt("ends_at", new Date(rangeStart.getTime() - 86400000).toISOString()),
  ]);

  const busy = (appts ?? []).filter((a) => a.id !== opts.ignoreAppointmentId);

  const slots: Slot[] = [];
  const duration = service.duration_minutes;

  // Walk day by day in salon local time.
  const firstDay = zonedParts(rangeStart);
  for (let dayOffset = 0; dayOffset < maxDays + 1 && slots.length < limit * 3; dayOffset++) {
    const dayAnchor = zonedToUtc(firstDay.year, firstDay.month, firstDay.day, 12, 0);
    const dayDate = new Date(dayAnchor.getTime() + dayOffset * 86400000);
    const d = zonedParts(dayDate);
    const dayStart = zonedToUtc(d.year, d.month, d.day, 0, 0);
    if (dayStart > rangeEnd) break;

    const open = openingHours[String(d.weekday)];
    if (!open) continue;
    const [openH = 0, openM = 0] = String(open[0]).split(":").map(Number);
    const [closeH = 0, closeM = 0] = String(open[1]).split(":").map(Number);
    const openAt = zonedToUtc(d.year, d.month, d.day, openH, openM);
    const closeAt = zonedToUtc(d.year, d.month, d.day, closeH, closeM);

    for (const staff of staffList) {
      const shifts = (hours ?? []).filter(
        (h) => h.staff_id === staff.id && h.weekday === d.weekday,
      );
      for (const shift of shifts) {
        const [sh = 0, sm = 0] = shift.start_time.split(":").map(Number);
        const [eh = 0, em = 0] = shift.end_time.split(":").map(Number);
        const shiftStart = zonedToUtc(d.year, d.month, d.day, sh, sm);
        const shiftEnd = zonedToUtc(d.year, d.month, d.day, eh, em);

        const windowStart = new Date(Math.max(shiftStart.getTime(), openAt.getTime()));
        const windowEnd = new Date(Math.min(shiftEnd.getTime(), closeAt.getTime()));

        for (
          let t = windowStart.getTime();
          t + duration * 60000 <= windowEnd.getTime();
          t += STEP_MINUTES * 60000
        ) {
          const start = new Date(t);
          const end = new Date(t + duration * 60000);
          if (start < earliest || start < rangeStart) continue;
          if (start > rangeEnd) break;

          if (opts.timeOfDay && opts.timeOfDay !== "any") {
            const localHour = zonedParts(start).hour;
            if (opts.timeOfDay === "morning" && localHour >= 12) continue;
            if (opts.timeOfDay === "afternoon" && (localHour < 12 || localHour >= 17)) continue;
            if (opts.timeOfDay === "evening" && localHour < 17) continue;
          }

          const offClash = (timeOff ?? []).some(
            (o) =>
              o.staff_id === staff.id &&
              new Date(o.starts_at) < end &&
              new Date(o.ends_at) > start,
          );
          if (offClash) continue;

          const clash = busy.some(
            (a) =>
              a.staff_id === staff.id &&
              new Date(a.starts_at).getTime() - buffer * 60000 < end.getTime() &&
              new Date(a.ends_at).getTime() + buffer * 60000 > start.getTime(),
          );
          if (clash) continue;

          slots.push({
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            staff_id: staff.id,
            staff_name: staff.name,
            service_id: service.id,
            service_name: service.name,
          });
        }
      }
    }
  }

  slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  // Spread results: at most 3 per day so options feel useful.
  const perDay: Record<string, number> = {};
  const picked: Slot[] = [];
  for (const s of slots) {
    const key = s.starts_at.slice(0, 10) + s.staff_id;
    perDay[key] = (perDay[key] ?? 0) + 1;
    if (perDay[key] > 3) continue;
    picked.push(s);
    if (picked.length >= limit) break;
  }
  return picked;
}

export async function isSlotStillFree(params: {
  workspaceId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  ignoreAppointmentId?: string | null;
}) {
  const db = supabaseAdmin;
  const { data: settings } = await db
    .from("business_settings")
    .select("buffer_minutes")
    .eq("workspace_id", params.workspaceId)
    .maybeSingle();
  const buffer = settings?.buffer_minutes ?? 15;
  const start = new Date(params.startsAt);
  const end = new Date(params.endsAt);
  const { data } = await db
    .from("appointments")
    .select("id,starts_at,ends_at")
    .eq("staff_id", params.staffId)
    .in("status", ["PENDING", "CONFIRMED"]);
  return !(data ?? []).some(
    (a) =>
      a.id !== params.ignoreAppointmentId &&
      new Date(a.starts_at).getTime() - buffer * 60000 < end.getTime() &&
      new Date(a.ends_at).getTime() + buffer * 60000 > start.getTime(),
  );
}

export const SALON_TIMEZONE = SALON_TZ;
