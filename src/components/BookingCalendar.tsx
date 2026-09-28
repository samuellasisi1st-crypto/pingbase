import { useMemo, useState , useEffect, useRef} from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Tabs } from "@/design-system";
import { calendarBusy } from "@/lib/inbox.functions";
import { formatSalonTime, zonedParts, zonedToUtc } from "@/lib/time";

export type CalItem = { id: string; starts_at: string; ends_at: string; status: string; service: { name: string } | null; staff: { name: string } | null; contact: { full_name: string | null } | null };
type View = "day" | "week" | "month";

const HOUR_START = 0, HOUR_END = 24, ROW = 60; // px per hour
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Calendar days as London-local {y,m,d} anchored at noon UTC-ish to avoid DST slips. */
type Day = { y: number; m: number; d: number; wd: number; key: string };
function mkDay(y: number, m: number, d: number): Day {
  const noon = zonedToUtc(y, m, d, 12, 0);
  const p = zonedParts(noon);
  return { y: p.year, m: p.month, d: p.day, wd: p.weekday, key: `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}` };
}
const addDays = (day: Day, n: number) => { const t = new Date(zonedToUtc(day.y, day.m, day.d, 12, 0).getTime() + n * 86400000); const p = zonedParts(t); return mkDay(p.year, p.month, p.day); };
const mondayIndex = (wd: number) => (wd + 6) % 7; // wd: 0=Sun
const dayStart = (d: Day) => zonedToUtc(d.y, d.m, d.d, 0, 0);
const keyOf = (iso: string) => { const p = zonedParts(new Date(iso)); return mkDay(p.year, p.month, p.day).key; };
const minutesOfDay = (iso: string) => { const p = zonedParts(new Date(iso)); return p.hour * 60 + p.minute; };

export function BookingCalendar({ items, onSelect, toolbarLeft }: { items: CalItem[]; onSelect: (id: string) => void; toolbarLeft?: React.ReactNode }) {
  const today = useMemo(() => { const p = zonedParts(new Date()); return mkDay(p.year, p.month, p.day); }, []);
  const [view, setView] = useState<View>(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "week"));
  const [anchor, setAnchor] = useState<Day>(today);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { if (view !== "month" && scroller.current) scroller.current.scrollTop = 7 * ROW; }, [view]);

  const days = useMemo(() => {
    if (view === "day") return [anchor];
    if (view === "week") { const mon = addDays(anchor, -mondayIndex(anchor.wd)); return Array.from({ length: 7 }, (_, i) => addDays(mon, i)); }
    const first = mkDay(anchor.y, anchor.m, 1); const start = addDays(first, -mondayIndex(first.wd));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [view, anchor]);

  const range = { fromISO: dayStart(days[0]!).toISOString(), toISO: dayStart(addDays(days[days.length - 1]!, 1)).toISOString() };
  const busy = useQuery({ queryKey: ["calendar-busy", range.fromISO, range.toISO], queryFn: () => calendarBusy({ data: range }), staleTime: 60_000 });

  const step = (dir: number) => setAnchor(view === "day" ? addDays(anchor, dir) : view === "week" ? addDays(anchor, 7 * dir) : mkDay(anchor.m + dir > 12 ? anchor.y + 1 : anchor.m + dir < 1 ? anchor.y - 1 : anchor.y, ((anchor.m + dir + 11) % 12) + 1, 1));
  const fmt = (d: Day, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "Europe/London" }).format(zonedToUtc(d.y, d.m, d.d, 12, 0));
  const title = view === "week" ? `${fmt(days[0]!, days[0]!.m === days[6]!.m ? { day: "numeric" } : { day: "numeric", month: "short" })} – ${fmt(days[6]!, { day: "numeric", month: "short", year: "numeric" })}` : new Intl.DateTimeFormat("en-GB", view === "day" ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" } : { month: "long", year: "numeric", timeZone: "Europe/London" }).format(zonedToUtc(anchor.y, anchor.m, anchor.d, 12, 0));

  const byDay = useMemo(() => items.reduce<Record<string, CalItem[]>>((acc, a) => { (acc[keyOf(a.starts_at)] ??= []).push(a); return acc; }, {}), [items]);
  const hours = busy.data?.hours ?? {};
  const closed = (d: Day) => Boolean(busy.data) && !hours[String(d.wd)];
  const googleFor = (d: Day) => { const s = dayStart(d).getTime(), e = s + 86400000; return (busy.data?.busy ?? []).filter((b) => new Date(b.start).getTime() < e && new Date(b.end).getTime() > s); };
  const offFor = (d: Day) => { const s = dayStart(d).getTime(), e = s + 86400000; return (busy.data?.timeOff ?? []).filter((b) => new Date(b.starts_at).getTime() < e && new Date(b.ends_at).getTime() > s); };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {toolbarLeft}
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => setAnchor(today)}>Today</Button>
          <Button variant="secondary" size="sm" title="Previous" onClick={() => step(-1)}><ChevronLeft className="size-3.5" /></Button>
          <Button variant="secondary" size="sm" title="Next" onClick={() => step(1)}><ChevronRight className="size-3.5" /></Button>
          <span className="min-w-0 truncate px-1 text-title font-semibold text-foreground">{title}</span>
          <Tabs items={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month" }]} value={view} onChange={(v) => setView(v as View)} variant="segmented" size="sm" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-secondary">
        <Legend className="bg-selected border-outbound-border" label="Booking" />
        <Legend className="busy-stripes border-border-strong" label={busy.data?.connected ? "Busy on Google Calendar" : "Google Calendar not connected"} />
        <Legend className="bg-hover border-border" label="Closed / time off" />
        {busy.isFetching && <span className="text-tertiary">Checking calendar…</span>}
      </div>
      {busy.data?.error && <p className="flex items-center gap-2 rounded-lg border border-border bg-red-soft px-3 py-2 text-[12px] text-red-strong"><AlertTriangle className="size-3.5" />Google Calendar couldn't be read, so busy times may be missing: {busy.data.error}</p>}

      {view === "month" ? (
        <div className="flex h-[calc(100dvh-240px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-xs">
          <div className="grid grid-cols-7 border-b border-border-subtle bg-panel-subtle">{WEEKDAYS.map((d) => <span key={d} className="px-2 py-2 text-[10px] uppercase text-tertiary">{d}</span>)}</div>
          <div className="grid flex-1 grid-cols-7 grid-rows-6">
            {days.map((d) => {
              const rows = byDay[d.key] ?? []; const g = googleFor(d); const inMonth = d.m === anchor.m; const shut = closed(d) || offFor(d).length > 0;
              return (
                <button key={d.key} type="button" onClick={() => { setAnchor(d); setView("day"); }} className={`min-h-0 min-w-0 overflow-hidden border-b border-r border-border-subtle p-1 text-left sm:min-h-24 sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${shut ? "bg-hover" : inMonth ? "bg-panel" : "bg-panel-subtle"} hover:bg-hover`}>
                  <span className={`inline-grid size-5 place-items-center rounded-full text-[11px] ${d.key === today.key ? "bg-primary text-white" : inMonth ? "text-foreground" : "text-tertiary"}`}>{d.d}</span>
                  <div className="mt-1 grid gap-0.5">
                    {g.length > 0 && <span className="busy-stripes truncate rounded px-1 py-0.5 text-[10px] text-secondary">{g.length} busy</span>}
                    {rows.slice(0, 2).map((a) => <span key={a.id} onClick={(e) => { e.stopPropagation(); onSelect(a.id); }} className={`truncate rounded px-1 py-0.5 text-[10px] ${a.status === "CANCELLED" ? "text-tertiary line-through" : "bg-selected text-foreground"}`}><span className="hidden sm:inline">{formatSalonTime(a.starts_at)} </span>{a.contact?.full_name ?? a.service?.name ?? "Booking"}</span>)}
                    {rows.length > 2 && <span className="px-1 text-[10px] text-tertiary">+{rows.length - 2} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-xs">
          <div className="grid border-b border-border-subtle bg-panel-subtle" style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0,1fr))` }}>
            <span />
            {days.map((d) => (
              <button key={d.key} type="button" onClick={() => { setAnchor(d); setView("day"); }} className="flex flex-col items-center gap-0.5 border-l border-border-subtle py-2.5 hover:bg-hover">
                <span className="text-[10px] uppercase text-tertiary">{WEEKDAYS[mondayIndex(d.wd)]}</span>
                <span className={`grid size-7 place-items-center rounded-full text-[13px] ${d.key === today.key ? "bg-primary text-white" : "text-foreground"}`}>{d.d}</span>
              </button>
            ))}
          </div>
          <div ref={scroller} className="h-[calc(100dvh-240px)] min-h-[420px] overflow-y-auto">
            <div className="relative grid" style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0,1fr))`, height: (HOUR_END - HOUR_START) * ROW }}>
              <div className="relative">{Array.from({ length: HOUR_END - HOUR_START }, (_, i) => <span key={i} className="absolute right-2 -translate-y-1/2 text-[10px] text-tertiary" style={{ top: i * ROW }}>{i === 0 ? "" : `${(HOUR_START + i) % 12 || 12}${HOUR_START + i < 12 ? "am" : "pm"}`}</span>)}</div>
              {days.map((d) => {
                const open = hours[String(d.wd)];
                const toMin = (s: string) => { const [h = 0, m = 0] = s.split(":").map(Number); return h * 60 + m; };
                const top = (min: number) => ((min - HOUR_START * 60) / 60) * ROW;
                const clamp = (min: number) => Math.max(HOUR_START * 60, Math.min(HOUR_END * 60, min));
                const block = (sIso: string, eIso: string) => { const s = keyOf(sIso) === d.key ? minutesOfDay(sIso) : 0; const e = keyOf(eIso) === d.key ? minutesOfDay(eIso) : 1440; return { top: top(clamp(s)), height: Math.max(top(clamp(e)) - top(clamp(s)), 0) }; };
                return (
                  <div key={d.key} className="relative border-l border-border-subtle">
                    {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => <div key={i} className="border-t border-border-subtle" style={{ height: ROW }} />)}
                    {busy.data && !open && <div className="absolute inset-0 bg-hover/80" title="Closed"><span className="absolute left-1 top-1 text-[10px] text-tertiary">Closed</span></div>}
                    {open && <>
                      <div className="absolute inset-x-0 top-0 bg-hover/80" style={{ height: Math.max(top(clamp(toMin(open[0]))), 0) }} />
                      <div className="absolute inset-x-0 bottom-0 bg-hover/80" style={{ top: top(clamp(toMin(open[1]))) }} />
                    </>}
                    {offFor(d).map((o, i) => { const b = block(o.starts_at, o.ends_at); return <div key={`o${i}`} className="absolute inset-x-0.5 rounded bg-hover px-1 text-[10px] text-tertiary" style={b}>{o.staff?.name ?? "Staff"} off</div>; })}
                    {googleFor(d).map((g, i) => { const b = block(g.start, g.end); return <div key={`g${i}`} title="Busy on Google Calendar" className="busy-stripes absolute inset-x-0.5 overflow-hidden rounded border border-border-strong px-1 text-[10px] text-secondary" style={b}>Busy (Google)</div>; })}
                    {(byDay[d.key] ?? []).map((a) => { const b = block(a.starts_at, a.ends_at); return (
                      <button key={a.id} type="button" onClick={() => onSelect(a.id)} className={`absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left shadow-xs ${a.status === "CANCELLED" ? "border-border bg-panel-subtle text-tertiary line-through" : "border-outbound-border bg-selected text-foreground"}`} style={{ ...b, minHeight: 22 }}>
                        <span className="block truncate text-[11px]">{a.contact?.full_name ?? "Customer"}</span>
                        <span className="block truncate text-[10px] text-secondary">{formatSalonTime(a.starts_at)} · {a.service?.name}{days.length === 1 && a.staff ? ` · ${a.staff.name}` : ""}</span>
                      </button>); })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Legend({ className, label }: { className: string; label: string }) { return <span className="flex items-center gap-1.5"><span className={`size-3 rounded-sm border ${className}`} />{label}</span>; }
