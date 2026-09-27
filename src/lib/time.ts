export const SALON_TZ = "Europe/London";

function parts(date: Date, tz: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  return map;
}

export function tzOffsetMinutes(date: Date, tz = SALON_TZ) {
  const p = parts(date, tz);
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
    Number(p.second),
  );
  return (asUTC - date.getTime()) / 60000;
}

/** Build a UTC Date from a wall-clock time in the salon timezone. */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz = SALON_TZ,
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = tzOffsetMinutes(new Date(guess), tz);
  return new Date(guess - offset * 60000);
}

export function zonedParts(date: Date, tz = SALON_TZ) {
  const p = parts(date, tz);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    weekday: weekdayMap[p.weekday] ?? 0,
  };
}

export function formatSalonDateTime(iso: string, tz = SALON_TZ) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatSalonTime(iso: string, tz = SALON_TZ) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function money(pence: number) {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}
