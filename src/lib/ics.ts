/** Minimal RFC 5545 calendar file builder (UTC timestamps, no external deps). */

function stamp(d: Date) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}T${String(
    d.getUTCHours(),
  ).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}Z`;
}

function esc(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  organizerName?: string | null;
  organizerEmail?: string | null;
  attendeeEmail?: string | null;
  cancelled?: boolean;
  sequence?: number;
};

export function buildIcs(ev: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pingbase//Booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${ev.cancelled ? "CANCEL" : "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `SEQUENCE:${ev.sequence ?? 0}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(new Date(ev.startsAt))}`,
    `DTEND:${stamp(new Date(ev.endsAt))}`,
    `SUMMARY:${esc(ev.title)}`,
    `STATUS:${ev.cancelled ? "CANCELLED" : "CONFIRMED"}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
  if (ev.location) lines.push(`LOCATION:${esc(ev.location)}`);
  if (ev.organizerEmail) lines.push(`ORGANIZER;CN=${esc(ev.organizerName ?? "")}:mailto:${ev.organizerEmail}`);
  if (ev.attendeeEmail)
    lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${ev.attendeeEmail}`);
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(ev.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  // RFC 5545 requires CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}
