import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, ArrowRight, Bot, CalendarClock, CalendarDays, CheckCircle2, CreditCard, Instagram, MailOpen, MessageCircle, Sparkles, UserCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { getGoogleCalendarStatus } from "@/lib/channels.functions";
import { formatSalonTime, money } from "@/lib/time";

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
  const google = useQuery({ queryKey: ["gcal-status"], queryFn: () => gStatus() });
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

  const todos: { icon: ComponentType<{ className?: string }>; label: string; to: string; tone: "red" | "amber" | "cyan" }[] = [];
  if (d?.handoffs.length) todos.push({ icon: UserCheck, label: `${d.handoffs.length} customer${d.handoffs.length > 1 ? "s" : ""} asked for a person`, to: "/inbox", tone: "red" });
  if (unpaid.length) todos.push({ icon: CreditCard, label: `${unpaid.length} upcoming booking${unpaid.length > 1 ? "s" : ""} with an unpaid deposit`, to: "/appointments", tone: "amber" });
  if (unread) todos.push({ icon: MailOpen, label: `${unread} unread conversation${unread > 1 ? "s" : ""}`, to: "/inbox", tone: "cyan" });
  if (soon.length) todos.push({ icon: CalendarClock, label: `${soon.length} booking${soon.length > 1 ? "s" : ""} in the next 24 hours`, to: "/appointments", tone: "cyan" });
  for (const c of chanErr) todos.push({ icon: AlertTriangle, label: `${c.channel} connection needs attention`, to: "/settings", tone: "red" });

  const steps = [
    { done: google.data?.status === "CONNECTED", label: "Connect Google Calendar", body: "Stop double-bookings by blocking your busy times.", section: "channels" },
    { done: (d?.knowledge ?? 0) >= 3, label: "Add knowledge", body: "Give Nia answers about prices, aftercare and parking.", section: "files" },
    { done: false, label: "Approve a WhatsApp template", body: "Reach customers after the 24-hour window closes.", section: "templates" },
    { done: (d?.members ?? 0) > 1, label: "Add team members", body: "Let your team reply from the same inbox.", section: "team" },
  ].filter((s) => !s.done);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-5 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] text-tertiary">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1 text-2xl text-foreground">{hello}</h1>
          </div>
          <Link to="/inbox"><Button size="sm" variant="secondary">Open inbox<ArrowRight className="size-3.5" /></Button></Link>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={CalendarDays} label="Bookings today" value={String(today.length)} />
          <Stat icon={MessageCircle} label="Waiting on you" value={String(waiting)} />
          <Stat icon={CreditCard} label="Today's revenue" value={money(rev(today))} />
          <Stat icon={Bot} label="Replies by Nia" value={`${aiShare}%`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card className="p-5">
            <p className="text-[11px] uppercase tracking-wide text-tertiary">Next booking</p>
            {next ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xl text-foreground">{next.contact?.full_name ?? "Customer"}</p>
                  <p className="mt-1 text-[13px] text-secondary">{next.service?.name ?? "Service"} with {next.staff?.name ?? "team"}</p>
                  <p className="mt-2 text-[12px] text-tertiary">{new Date(next.starts_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {formatSalonTime(next.starts_at)} · {until(+new Date(next.starts_at) - now)}</p>
                </div>
                <Link to="/appointments"><Button size="sm">View booking</Button></Link>
              </div>
            ) : <p className="mt-3 text-[13px] text-secondary">No upcoming bookings yet. When Nia books someone, they'll show here.</p>}
          </Card>
          <Card className="p-5">
            <p className="text-[11px] uppercase tracking-wide text-tertiary">Needs your attention</p>
            <div className="mt-3 space-y-1.5">
              {todos.length === 0 && <p className="flex items-center gap-2 text-[13px] text-secondary"><CheckCircle2 className="size-4 text-green-strong" />You're all caught up.</p>}
              {todos.map((t) => (
                <Link key={t.label} to={t.to} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-[12px] text-foreground hover:bg-hover">
                  <Badge variant={t.tone}><t.icon className="size-3" /></Badge><span className="flex-1">{t.label}</span><ArrowRight className="size-3.5 text-tertiary" />
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {steps.length > 0 && (
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-tertiary"><Sparkles className="size-3" />Next best steps</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <Link key={s.label} to="/settings" search={{ section: s.section } as never} className="rounded-xl border border-border bg-panel p-4 shadow-xs hover:border-border-strong hover:bg-panel-subtle">
                  <p className="text-[13px] text-foreground">{s.label}</p><p className="mt-1 text-[12px] text-secondary">{s.body}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Bookings & revenue">
            <div className="grid grid-cols-2 gap-3">
              <Mini label="Last 7 days" a={`${past(7).length} bookings`} b={money(rev(past(7)))} />
              <Mini label="Last 30 days" a={`${past(30).length} bookings`} b={money(rev(past(30)))} />
            </div>
          </Panel>
          <Panel title="Messages by channel (30 days)">
            {byChannel.map((b) => (
              <Bar key={b.c} label={b.c === "whatsapp" ? "WhatsApp" : b.c === "instagram" ? "Instagram" : "Messenger"} icon={b.c === "instagram" ? Instagram : MessageCircle} n={b.n} pct={(b.n / maxCh) * 100} />
            ))}
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

        <Panel title="Coming up">
          {upcoming.length === 0 && <p className="text-[12px] text-secondary">Nothing booked in the next two weeks.</p>}
          <div className="divide-y divide-border-subtle">
            {upcoming.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
                <span className="w-24 shrink-0 text-tertiary">{isToday(a.starts_at) ? "Today" : new Date(a.starts_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })} {formatSalonTime(a.starts_at)}</span>
                <span className="min-w-0 flex-1 truncate text-foreground">{a.contact?.full_name ?? "Customer"} · {a.service?.name}</span>
                <span className="hidden text-secondary sm:inline">{a.staff?.name}</span>
                <Badge variant={a.deposit_status === "REQUIRED" ? "amber" : "green"}>{a.deposit_status === "REQUIRED" ? "Deposit due" : "Confirmed"}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function until(ms: number) { const h = Math.round(ms / 3600000); if (h < 1) return "starting soon"; if (h < 24) return `in ${h}h`; return `in ${Math.round(h / 24)} days`; }
function Stat({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return <Card className="p-4"><Icon className="size-4 text-primary" /><p className="mt-3 text-[11px] text-tertiary">{label}</p><p className="mt-0.5 text-xl text-foreground">{value}</p></Card>;
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="p-5"><p className="mb-3 text-[11px] uppercase tracking-wide text-tertiary">{title}</p>{children}</Card>;
}
function Mini({ label, a, b }: { label: string; a: string; b: string }) {
  return <div className="rounded-lg bg-panel-subtle p-3"><p className="text-[10px] text-tertiary">{label}</p><p className="mt-1 text-[13px] text-foreground">{a}</p><p className="text-[12px] text-secondary">{b}</p></div>;
}
function Bar({ label, icon: Icon, n, pct }: { label: string; icon: ComponentType<{ className?: string }>; n: number; pct: number }) {
  return <div className="mb-2.5"><div className="mb-1 flex items-center justify-between text-[12px]"><span className="flex items-center gap-1.5 text-secondary"><Icon className="size-3.5" />{label}</span><span className="text-foreground">{n}</span></div><div className="h-1.5 rounded-full bg-hover"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div></div>;
}
