import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, ArrowRight, Bot, CalendarClock, CalendarDays, CheckCircle2, CreditCard, Instagram, MailOpen, MessageCircle, UserCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { getGoogleCalendarStatus } from "@/lib/channels.functions";
import { formatSalonTime, money } from "@/lib/time";
import dashboardSculpture from "@/assets/dashboard-glass-sculpture.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Pingbase" },
      { name: "description", content: "Today's bookings, what needs your attention and how your business is doing at a glance." },
      { property: "og:title", content: "Dashboard — Pingbase" },
      { property: "og:description", content: "Today's bookings, what needs your attention and how your business is doing at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const DAY = 86400000;
type Appt = { id: string; starts_at: string; status: string; price_pence: number; deposit_status: string; contact: { full_name: string | null } | null; service: { name: string } | null; staff: { name: string } | null };

function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const now = Date.now();
      const from = new Date(now - 30 * DAY).toISOString();
      const to = new Date(now + 14 * DAY).toISOString();
      const [appts, convs, hand, pays, msgs, chans, know, members] = await Promise.all([
        supabase.from("appointments").select("id,starts_at,status,price_pence,deposit_status,contact:contact_id(full_name),service:service_id(name),staff:staff_id(name)").gte("starts_at", from).lte("starts_at", to).order("starts_at"),
        supabase.from("conversations").select("id,unread,needs_attention,handling_mode,channel"),
        supabase.from("handoffs").select("id").eq("status", "OPEN"),
        supabase.from("payments").select("id,amount_pence").eq("status", "PENDING"),
        supabase.from("messages").select("channel,sender_type,created_at").gte("created_at", from),
        supabase.from("channel_connections").select("channel,status,last_error"),
        supabase.from("knowledge_sources").select("id", { count: "exact", head: true }),
        supabase.from("workspace_members").select("id", { count: "exact", head: true }),
      ]);
      return {
        appts: (appts.data ?? []) as unknown as Appt[],
        convs: convs.data ?? [], handoffs: hand.data ?? [], pays: pays.data ?? [], msgs: msgs.data ?? [],
        chans: chans.data ?? [], knowledge: know.count ?? 0, members: members.count ?? 0,
      };
    },
  });
}

function Dashboard() {
  const q = useDashboard();
  const gStatus = useServerFn(getGoogleCalendarStatus);
  const google = useQuery({
    queryKey: ["gcal-status"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return null;
      try { return await gStatus(); } catch { return null; }
    },
    retry: false,
  });
  const now = Date.now();
  const d = q.data;
  const live = (d?.appts ?? []).filter((a) => a.status !== "CANCELLED");
  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
  const today = live.filter((a) => isToday(a.starts_at));
  const upcoming = live.filter((a) => +new Date(a.starts_at) >= now);
  const next = upcoming[0];
  const past = (days: number) => live.filter((a) => { const t = +new Date(a.starts_at); return t < now && t >= now - days * DAY; });
  const rev = (list: Appt[]) => list.reduce((s, a) => s + a.price_pence, 0);
  const waiting = (d?.convs ?? []).filter((c) => c.needs_attention || c.handling_mode !== "AI").length;
  const unread = (d?.convs ?? []).filter((c) => c.unread).length;
  const unpaid = live.filter((a) => a.deposit_status === "REQUIRED" && +new Date(a.starts_at) >= now);
  const soon = upcoming.filter((a) => +new Date(a.starts_at) < now + DAY);
  const chanErr = (d?.chans ?? []).filter((c) => c.last_error || c.status === "ERROR");
  const msgs = d?.msgs ?? [];
  const byChannel = ["whatsapp", "instagram", "messenger"].map((c) => ({ c, n: msgs.filter((m) => m.channel === c).length }));
  const replies = msgs.filter((m) => m.sender_type !== "CUSTOMER");
  const aiShare = replies.length ? Math.round((replies.filter((m) => m.sender_type === "AI").length / replies.length) * 100) : 0;
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((l, i) => ({ l, n: live.filter((a) => (new Date(a.starts_at).getDay() + 6) % 7 === i).length }));
  const maxDay = Math.max(1, ...weekdays.map((w) => w.n));
  const maxCh = Math.max(1, ...byChannel.map((b) => b.n));
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todos: { icon: ComponentType<{ className?: string }>; label: string; to: string; tone: "red" | "yellow" | "cyan" }[] = [];
  if (d?.handoffs.length) todos.push({ icon: UserCheck, label: `${d.handoffs.length} customer${d.handoffs.length > 1 ? "s" : ""} asked for a person`, to: "/inbox", tone: "red" });
  if (unpaid.length) todos.push({ icon: CreditCard, label: `${unpaid.length} upcoming booking${unpaid.length > 1 ? "s" : ""} with an unpaid deposit`, to: "/appointments", tone: "yellow" });
  if (unread) todos.push({ icon: MailOpen, label: `${unread} unread conversation${unread > 1 ? "s" : ""}`, to: "/inbox", tone: "cyan" });
  if (soon.length) todos.push({ icon: CalendarClock, label: `${soon.length} booking${soon.length > 1 ? "s" : ""} in the next 24 hours`, to: "/appointments", tone: "cyan" });
  for (const c of chanErr) todos.push({ icon: AlertTriangle, label: `${c.channel} connection needs attention`, to: "/settings", tone: "red" });

  const steps = [
    { done: google.data?.status === "CONNECTED", label: "Connect Google Calendar", body: "Stop double-bookings by blocking your busy times.", section: "channels" },
    { done: (d?.knowledge ?? 0) >= 3, label: "Add knowledge", body: "Give Nia answers about prices, aftercare and parking.", section: "files" },
    { done: false, label: "Approve a WhatsApp template", body: "Reach customers after the 24-hour window closes.", section: "templates" },
    { done: (d?.members ?? 0) > 1, label: "Add team members", body: "Let your team reply from the same inbox.", section: "team" },
  ].filter((s) => !s.done);

  const focus = unpaid[0] ?? next;
  const focusNeeds = focus && focus.deposit_status === "REQUIRED" ? "Deposit still unpaid" : focus ? "Your next booking" : null;
  const bookedWeek = past(7).length;
  const weekAppointments = past(7);
  const weekRevenue = rev(weekAppointments);
  const revenueByService = Object.entries(weekAppointments.reduce<Record<string, number>>((totals, appointment) => {
    const service = appointment.service?.name ?? "Other services";
    totals[service] = (totals[service] ?? 0) + appointment.price_pence;
    return totals;
  }, {})).sort((a, b) => b[1] - a[1]);
  const topRevenue = revenueByService.slice(0, 4);

  return (
    <AppShell>
      <div className="w-full space-y-6 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl text-foreground">{hello}</h1>
            <p className="mt-1 text-[13px] text-secondary">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · here's what needs you today.</p>
          </div>
          <Link to="/inbox"><Button size="sm">Open inbox<ArrowRight className="size-3.5" /></Button></Link>
        </header>

        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          <div className="grid gap-4 lg:col-span-8">
          <section className="relative overflow-hidden rounded-xl border border-border bg-panel-subtle">
            <img src={dashboardSculpture} width={1024} height={768} alt="" aria-hidden className="pointer-events-none absolute -right-[30%] top-0 hidden h-[190%] w-[110%] object-contain object-top opacity-95 md:block dark:brightness-[.78] dark:saturate-[.82]" />
            <div className="relative flex min-h-[310px] flex-col justify-center gap-4 p-6 md:max-w-[58%] md:p-9">
              {focus ? (
                <>
                  <Badge variant={focus.deposit_status === "REQUIRED" ? "yellow" : "cyan"} className="w-fit">{focusNeeds}</Badge>
                  <div>
                    <p className="max-w-md text-3xl leading-tight text-foreground">{focus.contact?.full_name ?? "Customer"} is your next booking.</p>
                    <p className="mt-1 text-[14px] text-secondary">{focus.service?.name ?? "Service"} with {focus.staff?.name ?? "team"} · {money(focus.price_pence)}</p>
                    <p className="mt-2 text-[13px] text-tertiary">{new Date(focus.starts_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })} at {formatSalonTime(focus.starts_at)} · {until(+new Date(focus.starts_at) - now)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2"><Link to="/appointments"><Button size="sm" variant="secondary">View booking</Button></Link><Link to="/inbox"><Button size="sm" variant="tertiary">Message customer</Button></Link></div>
                </>
              ) : (
                <>
                  <p className="text-xl text-foreground">No upcoming bookings yet</p>
                  <p className="text-[14px] text-secondary">When Nia books someone, the booking that needs you most will show here.</p>
                  <Link to="/inbox"><Button size="sm" variant="secondary">Go to inbox</Button></Link>
                </>
              )}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={CalendarDays} label="Bookings today" value={String(today.length)} />
            <Stat icon={MessageCircle} label="Waiting on you" value={String(waiting)} />
            <Stat icon={Bot} label="Replies by Nia" value={`${aiShare}%`} />
            <Stat icon={CreditCard} label="Revenue, 30 days" value={money(rev(past(30)))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Meter label="Today's pace" hint={`${soon.length} booking${soon.length === 1 ? "" : "s"} in the next 24 hours`} value={today.length} max={Math.max(today.length, 8)} />
            <Meter label="Nia handling" hint="Share of replies in the last 30 days" value={aiShare} max={100} suffix="%" />
          </div>
          </div>

          <div className="grid grid-rows-[auto_1fr] gap-4 lg:col-span-4">
            <Card className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[11px] uppercase tracking-wide text-tertiary">Revenue this week</p><p className="mt-2 text-3xl text-foreground">{money(weekRevenue)}</p></div>
                <div className="grid size-9 place-items-center rounded-lg bg-blue-soft text-primary"><CreditCard className="size-4" /></div>
              </div>
              <p className="mt-1 text-[12px] text-secondary">From {bookedWeek} completed or active booking{bookedWeek === 1 ? "" : "s"}</p>
              <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-hover">
                {topRevenue.map(([service, amount], index) => <span key={service} className={index === 0 ? "bg-primary" : index === 1 ? "bg-blue-mid" : index === 2 ? "bg-cyan-mid" : "bg-green-strong"} style={{ width: `${weekRevenue ? (amount / weekRevenue) * 100 : 0}%` }} />)}
              </div>
              <div className="mt-5 flex-1 divide-y divide-border-subtle">
                {topRevenue.length === 0 && <p className="py-5 text-[12px] text-secondary">Revenue from this week's appointments will appear here.</p>}
                {topRevenue.map(([service, amount], index) => (
                  <div key={service} className="flex items-center gap-2 py-2.5 text-[12px]"><span className={`size-2 rounded-full ${index === 0 ? "bg-primary" : index === 1 ? "bg-blue-mid" : index === 2 ? "bg-cyan-mid" : "bg-green-strong"}`} /><span className="min-w-0 flex-1 truncate text-secondary">{service}</span><span className="text-foreground">{money(amount)}</span><span className="w-9 text-right text-tertiary">{weekRevenue ? Math.round((amount / weekRevenue) * 100) : 0}%</span></div>
                ))}
              </div>
            </Card>
            <Panel title="Needs your attention">
              <div className="grid h-full auto-rows-fr gap-2">
                {todos.length === 0 && <p className="flex items-center gap-2 text-[13px] text-secondary"><CheckCircle2 className="size-4 text-green-strong" />You're all caught up.</p>}
                {todos.map((t) => (
                  <Link key={t.label} to={t.to} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-[12px] text-foreground hover:bg-hover">
                    <Badge variant={t.tone}><t.icon className="size-3" /></Badge><span className="flex-1">{t.label}</span><ArrowRight className="size-3.5 text-tertiary" />
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

        </div>

        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-[15px] text-foreground">Upcoming bookings</h2><Link to="/appointments" className="text-[12px] text-secondary hover:text-foreground">View all</Link></div>
          <div className="overflow-hidden rounded-xl border border-border bg-panel">
            <div className="hidden grid-cols-[10rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_6rem_7rem] bg-panel-subtle px-5 py-3 text-[12px] text-secondary md:grid"><span>When</span><span>Customer</span><span>Service</span><span>With</span><span>Price</span><span>Status</span></div>
            {upcoming.length === 0 && <p className="px-5 py-8 text-[13px] text-secondary">Nothing booked in the next two weeks.</p>}
            {upcoming.slice(0, 8).map((a) => (
              <Link to="/appointments" key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 border-t border-border-subtle px-5 py-3 text-[13px] hover:bg-hover md:grid-cols-[10rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_6rem_7rem]">
                <span className="text-secondary md:text-foreground">{isToday(a.starts_at) ? "Today" : new Date(a.starts_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, {formatSalonTime(a.starts_at)}</span>
                <span className="order-first col-span-2 truncate text-foreground md:order-none md:col-span-1">{a.contact?.full_name ?? "Customer"}</span>
                <span className="hidden truncate text-secondary md:block">{a.service?.name}</span>
                <span className="hidden truncate text-secondary md:block">{a.staff?.name}</span>
                <span className="hidden text-foreground md:block">{money(a.price_pence)}</span>
                <span><Badge variant={a.deposit_status === "REQUIRED" ? "yellow" : "green"}>{a.deposit_status === "REQUIRED" ? "Deposit due" : "Confirmed"}</Badge></span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Next best steps">
            <div className="grid h-full auto-rows-fr gap-2">
              {steps.length === 0 && <p className="flex items-center gap-2 text-[13px] text-secondary"><CheckCircle2 className="size-4 text-green-strong" />You're all set up.</p>}
              {steps.map((s, i) => (
                <Link key={s.label} to="/settings" search={{ section: s.section } as never} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-[12px] text-foreground hover:bg-hover">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-soft text-[11px] text-primary">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate">{s.label}</span><span className="block truncate text-[11px] text-secondary">{s.body}</span></span>
                  <ArrowRight className="size-3.5 text-tertiary" />
                </Link>
              ))}
            </div>
          </Panel>
          <Panel title="Messages by channel (30 days)">
            <div className="flex h-full flex-col justify-between gap-3">
              {byChannel.map((b) => (
                <Bar key={b.c} label={b.c === "whatsapp" ? "WhatsApp" : b.c === "instagram" ? "Instagram" : "Messenger"} icon={b.c === "instagram" ? Instagram : MessageCircle} n={b.n} pct={(b.n / maxCh) * 100} />
              ))}
            </div>
          </Panel>
          <Panel title="Busiest days">
            <div className="flex h-28 items-end gap-2">
              {weekdays.map((w) => (
                <div key={w.l} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-md bg-primary/80" style={{ height: `${Math.max(4, (w.n / maxDay) * 88)}px` }} title={`${w.n} bookings`} />
                  <span className="text-[10px] text-tertiary">{w.l}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

      </div>
    </AppShell>
  );
}

function Meter({ label, hint, value, max, suffix = "" }: { label: string; hint: string; value: number; max: number; suffix?: string }) {
  return (
    <Card className="flex flex-col justify-between p-5">
      <div><p className="text-[11px] uppercase tracking-wide text-foreground">{label}</p><p className="mt-1 text-[12px] text-secondary">{hint}</p></div>
      <div className="mt-6"><div className="mb-2 flex justify-between text-[13px]"><span className="text-foreground">{value}{suffix}</span><span className="text-tertiary">{value}{suffix} / {max}{suffix}</span></div><div className="h-1.5 rounded-full bg-hover"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} /></div></div>
    </Card>
  );
}

function until(ms: number) { const h = Math.round(ms / 3600000); if (h < 1) return "starting soon"; if (h < 24) return `in ${h}h`; return `in ${Math.round(h / 24)} days`; }
function Stat({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return <Card className="p-4"><Icon className="size-4 text-primary" /><p className="mt-3 text-[11px] text-tertiary">{label}</p><p className="mt-0.5 text-xl text-foreground">{value}</p></Card>;
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="flex h-full flex-col p-5"><p className="mb-3 text-[11px] uppercase tracking-wide text-tertiary">{title}</p><div className="min-h-0 flex-1">{children}</div></Card>;
}
function Bar({ label, icon: Icon, n, pct }: { label: string; icon: ComponentType<{ className?: string }>; n: number; pct: number }) {
  return <div><div className="mb-1 flex items-center justify-between text-[12px]"><span className="flex items-center gap-1.5 text-secondary"><Icon className="size-3.5" />{label}</span><span className="text-foreground">{n}</span></div><div className="h-1.5 rounded-full bg-hover"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div></div>;
}
