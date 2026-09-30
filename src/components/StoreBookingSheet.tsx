import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, Loader2, X } from "lucide-react";
import { createStoreBooking, getStoreSlots } from "@/lib/store-booking.functions";
import { formatSalonDateTime, formatSalonTime, money, zonedToUtc } from "@/lib/time";

type Service = { id: string; name: string; price_pence: number; duration_minutes: number; deposit_pence: number; location_type: string; payment_mode: string };
type Slot = { starts_at: string; ends_at: string; staff_id: string; staff_name: string };

function londonDay(offset: number) {
  const d = new Date(Date.now() + offset * 86400000);
  const [y, m, day] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(d).split("-").map(Number);
  return { key: `${y}-${m}-${day}`, start: zonedToUtc(y, m, day, 0, 0), label: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric" }).format(d) };
}

export function BookingSheet({ slug, service, onClose }: { slug: string; service: Service; onClose: () => void }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => londonDay(i)), []);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [f, setF] = useState({ name: "", phone: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ starts_at: string; staff_name: string | null; invite: boolean } | null>(null);
  const fetchSlots = useServerFn(getStoreSlots);
  const book = useServerFn(createStoreBooking);
  const slots = useQuery({ queryKey: ["store-slots", slug, service.id, days[day].key], queryFn: () => fetchSlots({ data: { slug, serviceId: service.id, fromISO: days[day].start.toISOString() } }) });
  const call = service.location_type === "online";
  const payNote = service.payment_mode === "in_store" ? "Pay at your appointment" : "Pay in store for now — online payment is coming soon";

  const submit = async () => {
    if (!slot) return;
    setBusy(true);
    try { setDone(await book({ data: { slug, serviceId: service.id, staffId: slot.staff_id, startsAt: slot.starts_at, ...f } })); }
    catch (e) { const m = e instanceof Error ? e.message : "Couldn't book."; toast.error(m.includes("[") ? "Please add your name and a phone number or email." : m); if (m.includes("taken")) { setSlot(null); void slots.refetch(); } }
    finally { setBusy(false); }
  };
  const input = "h-10 w-full rounded-md border border-border bg-panel px-3 text-[14px] text-foreground focus:border-primary focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-panel p-5 sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            {slot && !done && <button type="button" aria-label="Back" onClick={() => setSlot(null)}><ChevronLeft className="mt-0.5 size-5 text-secondary" /></button>}
            <div><p className="text-[16px] text-foreground">{call ? "Book a call" : "Book"} · {service.name}</p><p className="text-[12px] text-secondary">{service.duration_minutes} min · {service.price_pence ? money(service.price_pence) : "Free"}{service.deposit_pence ? ` · ${money(service.deposit_pence)} deposit` : ""}</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X className="size-5 text-secondary" /></button>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <p className="mt-3 text-foreground">You're booked!</p>
            <p className="mt-1 text-[13px] text-secondary">{formatSalonDateTime(done.starts_at)}{done.staff_name ? ` with ${done.staff_name}` : ""}</p>
            <p className="mt-1 text-[12px] text-tertiary">{done.invite ? "A calendar invite is on its way to your email. " : ""}{payNote}.</p>
            <button type="button" onClick={onClose} className="mt-5 h-9 rounded-md border border-border px-4 text-[13px] text-foreground">Done</button>
          </div>
        ) : !slot ? (
          <>
            <div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {days.map((d, i) => <button key={d.key} type="button" onClick={() => setDay(i)} className={`shrink-0 rounded-md border px-3 py-2 text-[12px] ${day === i ? "border-primary bg-primary text-primary-foreground" : "border-border text-secondary hover:bg-hover"}`}>{i === 0 ? "Today" : d.label}</button>)}
            </div>
            <div className="mt-4 min-h-40">
              {slots.isFetching && <p className="flex items-center gap-2 text-[13px] text-secondary"><Loader2 className="size-4 animate-spin" />Checking open times…</p>}
              {!slots.isFetching && slots.data?.error && <p className="text-[13px] text-red-strong">{slots.data.error}</p>}
              {!slots.isFetching && slots.data && !slots.data.error && slots.data.slots.length === 0 && <p className="text-[13px] text-secondary">No open times this day. Try another day.</p>}
              {!slots.isFetching && <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.data?.slots.map((s) => <button key={s.starts_at + s.staff_id} type="button" onClick={() => setSlot(s)} className="rounded-md border border-border px-2 py-2 text-left hover:border-primary hover:bg-hover"><span className="block text-[13px] text-foreground">{formatSalonTime(s.starts_at)}</span><span className="block truncate text-[11px] text-tertiary">{s.staff_name}</span></button>)}
              </div>}
            </div>
          </>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="rounded-md bg-panel-subtle px-3 py-2 text-[13px] text-foreground">{formatSalonDateTime(slot.starts_at)} with {slot.staff_name}</p>
            <input className={input} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className={input} placeholder="Email (for your invite)" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input className={input} placeholder={call ? "Phone number to call" : "Phone"} type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <textarea className={`${input} h-20 py-2`} placeholder="Anything we should know? (optional)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            <p className="text-[12px] text-tertiary">{payNote}.</p>
            <button type="button" disabled={busy || !f.name || (!f.email && !f.phone)} onClick={() => void submit()} className="h-10 rounded-md bg-primary text-[14px] text-primary-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Booking…" : "Confirm booking"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
