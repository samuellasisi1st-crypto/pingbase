import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BellRing, Bot, CalendarCheck, Check, ChevronRight, Clock3, CreditCard, Handshake, Maximize2, MessageCircleReply, Minus, MoreHorizontal, Plus, Search, Send, Sparkles, Undo2, Zap } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/design-system/components/Badge";
import { Button } from "@/design-system/components/Button";
import { formatSalonDateTime } from "@/lib/time";

export const Route = createFileRoute("/automations")({
  head: () => ({ meta: [
    { title: "Automations — Pingbase" },
    { name: "description", content: "Booking confirmations, reminders and follow-ups delivered across every connected channel." },
    { property: "og:title", content: "Automations — Pingbase" },
    { property: "og:description", content: "Booking confirmations, reminders and follow-ups delivered across every connected channel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AutomationsPage,
});

const FLOWS = [
  { kind: "CONFIRMATION", name: "Booking confirmation", when: "Right after a booking is confirmed", icon: CalendarCheck, branch: "Confirm appointment" },
  { kind: "REMINDER_24H", name: "24-hour reminder", when: "One day before the appointment", icon: BellRing, branch: "Send reminder" },
  { kind: "REMINDER_2H", name: "2-hour reminder", when: "Two hours before the appointment", icon: Clock3, branch: "Final reminder" },
  { kind: "INCOMPLETE_FOLLOWUP", name: "Unfinished booking follow-up", when: "When a customer stops mid-booking", icon: MessageCircleReply, branch: "Help them finish" },
  { kind: "POST_VISIT", name: "Thank-you after visit", when: "After the appointment is completed", icon: Handshake, branch: "Send follow-up" },
  { kind: "PAYMENT_REMINDER", name: "Deposit reminder", when: "When a deposit is still unpaid", icon: CreditCard, branch: "Request deposit" },
] as const;

function AutomationsPage() {
  const [selected, setSelected] = useState<string>(FLOWS[0].kind);
  const [mobileFlowOpen, setMobileFlowOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [q, setQ] = useState("");
  const events = useQuery({
    queryKey: ["automation-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_events").select("*").order("scheduled_for", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const flow = FLOWS.find((item) => item.kind === selected) ?? FLOWS[0];
  const filtered = useMemo(() => FLOWS.filter((item) => item.name.toLowerCase().includes(q.toLowerCase())), [q]);
  const sent = (events.data ?? []).filter((event) => event.kind === flow.kind && event.status === "SENT").length;
  const FlowIcon = flow.icon;

  return (
    <AppShell>
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-panel-subtle md:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className={`${mobileFlowOpen ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-border-subtle bg-panel p-3`}>
          <div className="mb-3 flex items-center justify-between px-1"><p className="text-[13px] font-normal text-foreground">Automations</p><Button size="sm" className="px-2" title="New automation" disabled><Plus className="size-3.5" /></Button></div>
          <div className="relative mb-3"><Search className="absolute left-2.5 top-2.5 size-3.5 text-tertiary"/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-8 w-full rounded-lg border border-border bg-panel pl-8 pr-2 text-[12px] focus:border-primary focus:outline-none" /></div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filtered.map((item) => { const Icon = item.icon; const active = item.kind === selected; return <button key={item.kind} type="button" onClick={() => { setSelected(item.kind); setMobileFlowOpen(true); }} className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-[12px] font-normal ${active ? "border-border bg-panel-subtle shadow-xs" : "border-transparent text-secondary hover:bg-hover"}`}><span className="grid size-7 shrink-0 place-items-center rounded-md bg-cyan-soft text-primary-dark"><Icon className="size-3.5"/></span><span className="min-w-0 flex-1"><span className="block truncate text-foreground">{item.name}</span><span className="block truncate text-[10px] text-tertiary">Active · {(events.data ?? []).filter((e) => e.kind === item.kind && e.status === "SENT").length} sent</span></span><ChevronRight className="size-3.5 text-tertiary md:hidden"/></button>; })}
          </div>
          <button type="button" onClick={() => setActivityOpen(true)} className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[12px] text-secondary hover:bg-hover"><span>Activity log</span><ChevronRight className="size-3.5"/></button>
        </aside>

        <section className={`${mobileFlowOpen ? "block" : "hidden md:block"} relative min-h-0 min-w-0 overflow-hidden`}>
          <header className="absolute inset-x-3 top-3 z-20 flex h-11 items-center justify-between rounded-xl border border-border bg-panel px-2.5 shadow-sm">
             <div className="flex min-w-0 items-center gap-2"><Button variant="tertiary" size="sm" title="Back" onClick={() => setMobileFlowOpen(false)}><ArrowLeft className="size-4"/></Button><span className="h-5 w-px bg-border-subtle"/><p className="truncate text-[13px] font-normal text-foreground">{flow.name}</p><Badge variant="green"><Check className="size-3"/>Active</Badge></div>
            <div className="flex items-center gap-1"><Button variant="tertiary" size="sm" title="More options"><MoreHorizontal className="size-4"/></Button><Button size="sm" disabled>Publish</Button></div>
          </header>

          <div className="automation-grid absolute inset-0 overflow-auto pt-20">
            <div className="relative mx-auto h-[660px] min-w-[980px] max-w-[1160px] origin-top" style={{ transform: `scale(${zoom / 100})` }}>
              <Connector className="left-[286px] top-[203px] h-[72px] w-[160px]" />
              <Connector className="left-[691px] top-[203px] h-[72px] w-[130px]" />
              <Connector className="left-[691px] top-[365px] h-[72px] w-[130px]" />
              <FlowCard className="left-10 top-32 w-[250px]" accent icon={<Zap className="size-4"/>} title="Booking event" eyebrow="Trigger">
                <Field label="When" value={flow.when} />
                <p className="mt-4 text-right text-[10px] text-tertiary">Then do the following <span className="ml-1 inline-block size-2 rounded-full bg-tertiary"/></p>
              </FlowCard>
              <FlowCard className="left-[430px] top-28 w-[265px]" icon={<FlowIcon className="size-4"/>} title={flow.name} eyebrow="Message">
                <Field label="Delivery" value="Customer's original channel" />
                <div className="mt-3 rounded-lg border border-border bg-panel-subtle px-3 py-2 text-[11px] text-secondary">Personalised with booking, staff and appointment details.</div>
                <p className="mt-4 text-right text-[10px] text-tertiary">Next step <span className="ml-1 inline-block size-2 rounded-full bg-tertiary"/></p>
              </FlowCard>
              <FlowCard className="left-[815px] top-28 w-[260px]" icon={<Bot className="size-4"/>} title="Nia verifies delivery" eyebrow="AI guardrail">
                <Field label="Action" value="Send once and record status" />
                <Field label="Successful deliveries" value={`${sent} sent`} />
              </FlowCard>
              <FlowCard className="left-[815px] top-[350px] w-[260px]" icon={<Send className="size-4"/>} title={flow.branch} eyebrow="Fallback">
                <Field label="If delivery fails" value="Log failure for the team" />
                <div className="mt-3 flex items-center gap-2 text-[11px] text-secondary"><Sparkles className="size-3.5 text-primary"/>No duplicate retries</div>
              </FlowCard>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border bg-panel p-1.5 shadow-md">
            <Button variant="tertiary" size="sm" title="Undo" disabled><Undo2 className="size-4"/></Button><span className="mx-1 h-5 w-px bg-border-subtle"/><Button variant="tertiary" size="sm" title="Zoom out" onClick={() => setZoom((v) => Math.max(80, v - 10))}><Minus className="size-4"/></Button><span className="min-w-12 text-center text-[11px] text-secondary">{zoom}%</span><Button variant="tertiary" size="sm" title="Zoom in" onClick={() => setZoom((v) => Math.min(120, v + 10))}><Plus className="size-4"/></Button><Button variant="tertiary" size="sm" title="Fit to screen" onClick={() => setZoom(100)}><Maximize2 className="size-4"/></Button>
          </div>
        </section>
      </div>

      {activityOpen && <div className="fixed inset-0 z-40 flex justify-end bg-foreground/20" onClick={() => setActivityOpen(false)}><aside className="h-full w-full overflow-y-auto bg-panel pb-20 shadow-lg sm:m-2 sm:h-[calc(100%-1rem)] sm:max-w-lg sm:rounded-xl sm:border sm:border-border sm:pb-0" onClick={(e) => e.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-panel px-4 py-4 sm:px-5"><div><p className="text-[14px] font-normal text-foreground">Activity log</p><p className="mt-0.5 text-[11px] text-tertiary">Every scheduled and delivered automation</p></div><Button variant="tertiary" size="sm" onClick={() => setActivityOpen(false)}>Close</Button></div><div className="divide-y divide-border-subtle">{(events.data ?? []).map((event) => <div key={event.id} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3 text-[12px]"><div><p className="text-foreground">{FLOWS.find((item) => item.kind === event.kind)?.name ?? event.kind}</p><p className="mt-1 capitalize text-tertiary">{event.channel ?? "Channel unavailable"} · {formatSalonDateTime(event.scheduled_for)}</p></div><Badge variant={event.status === "SENT" ? "green" : event.status === "FAILED" ? "red" : "cyan"}>{event.status.toLowerCase()}</Badge></div>)}{!events.isLoading && (events.data ?? []).length === 0 && <p className="px-5 py-12 text-center text-[12px] text-tertiary">No automation activity yet.</p>}</div></aside></div>}
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="mt-3"><p className="mb-1 text-[10px] text-secondary">{label}</p><div className="rounded-lg border border-border bg-panel-subtle px-3 py-2 text-[11px] text-secondary">{value}</div></div>;
}

function FlowCard({ className, accent, icon, title, eyebrow, children }: { className: string; accent?: boolean; icon: ReactNode; title: string; eyebrow: string; children: ReactNode }) {
  return <article className={`absolute rounded-xl border bg-panel p-3.5 shadow-md ${accent ? "border-primary" : "border-border"} ${className}`}><div className="flex items-center gap-2 border-b border-border-subtle pb-3"><span className="grid size-7 place-items-center rounded-md bg-cyan-soft text-primary-dark">{icon}</span><div><p className="text-[10px] text-tertiary">{eyebrow}</p><h2 className="text-[12px] font-normal text-foreground">{title}</h2></div></div>{children}</article>;
}

function Connector({ className }: { className: string }) {
  return <svg aria-hidden="true" className={`pointer-events-none absolute overflow-visible ${className}`} viewBox="0 0 160 72" preserveAspectRatio="none"><path d="M0 12 C 58 12, 68 60, 160 60" fill="none" stroke="var(--border-strong)" strokeWidth="1.5"/><circle cx="0" cy="12" r="4" fill="var(--text-tertiary)"/><path d="M153 55 L160 60 L153 65" fill="none" stroke="var(--border-strong)" strokeWidth="1.5"/></svg>;
}