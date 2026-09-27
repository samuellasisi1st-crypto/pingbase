import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Zap, CalendarCheck, BellRing, MessageCircleReply, HeartHandshake, CreditCard } from "lucide-react";

import { AppShell, Page, PageHeader, StatCard, EmptyState } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/design-system/components/Badge";
import { Tabs } from "@/design-system/components/Tabs";
import { formatSalonDateTime } from "@/lib/time";

export const Route = createFileRoute("/automations")({
  head: () => ({
    meta: [
      { title: "Automations — Pingbase" },
      { name: "description", content: "Confirmations, reminders and follow-ups sent automatically through each customer's own channel." },
      { property: "og:title", content: "Automations — Pingbase" },
      { property: "og:description", content: "Confirmations, reminders and follow-ups sent automatically through each customer's own channel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AutomationsPage,
});

const FLOWS = [
  { kind: "CONFIRMATION", name: "Booking confirmation", when: "Right after a booking is confirmed", icon: CalendarCheck },
  { kind: "REMINDER_24H", name: "24-hour reminder", when: "One day before the appointment", icon: BellRing },
  { kind: "REMINDER_2H", name: "2-hour reminder", when: "Two hours before the appointment", icon: BellRing },
  { kind: "INCOMPLETE_FOLLOWUP", name: "Unfinished booking follow-up", when: "When a customer stops mid-booking", icon: MessageCircleReply },
  { kind: "POST_VISIT", name: "Thank-you after visit", when: "After the appointment is completed", icon: HeartHandshake },
  { kind: "PAYMENT_REMINDER", name: "Deposit reminder", when: "When a deposit is still unpaid", icon: CreditCard },
];

function AutomationsPage() {
  const [tab, setTab] = useState("automations");
  const [q, setQ] = useState("");
  const events = useQuery({
    queryKey: ["automation-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_events").select("*").order("scheduled_for", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const ev = events.data ?? [];
  const sent = ev.filter((e) => e.status === "SENT").length;
  const pending = ev.filter((e) => e.status === "PENDING" || e.status === "SCHEDULED").length;

  return (
    <AppShell>
      <Page>
        <PageHeader title="Automations" subtitle="Drive your business forward with reliable automations." />
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col justify-center rounded-xl border border-border bg-selected p-8">
            <p className="text-[18px] font-semibold text-foreground">Nia keeps every customer in the loop</p>
            <p className="mt-2 max-w-lg text-[14px] text-secondary">Messages go out through the same app the customer booked on — Instagram, WhatsApp, Messenger or email. Each one is sent once, never twice.</p>
          </div>
          <div className="grid gap-4">
            <StatCard label="Sent" hint="All time" value={sent} />
            <StatCard label="Scheduled" hint="Waiting to go out" value={pending} />
          </div>
        </div>

        <Tabs value={tab} onChange={setTab} variant="segmented" items={[{ value: "automations", label: "Automations" }, { value: "log", label: "Activity log" }]} />

        {tab === "automations" ? (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 size-4 text-tertiary" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 w-full rounded-md border border-border bg-panel pl-8 text-[13px] focus:border-primary focus:outline-none" />
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-border bg-panel-subtle text-secondary">
                  <tr><th className="px-5 py-3 font-medium">Name</th><th className="px-5 py-3 font-medium">Trigger</th><th className="px-5 py-3 font-medium">Messages sent</th><th className="px-5 py-3 font-medium">Status</th></tr>
                </thead>
                <tbody>
                  {FLOWS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).map((f) => (
                    <tr key={f.kind} className="border-b border-border-subtle last:border-0">
                      <td className="px-5 py-3.5"><span className="flex items-center gap-2.5 font-medium text-foreground"><span className="grid size-7 place-items-center rounded-md bg-hover"><f.icon className="size-3.5 text-secondary" /></span>{f.name}</span></td>
                      <td className="px-5 py-3.5 text-secondary">{f.when}</td>
                      <td className="px-5 py-3.5 text-secondary">{ev.filter((e) => e.kind === f.kind && e.status === "SENT").length}</td>
                      <td className="px-5 py-3.5"><Badge variant="green">Active</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border bg-panel-subtle text-secondary">
                <tr><th className="px-5 py-3 font-medium">Automation</th><th className="px-5 py-3 font-medium">Channel</th><th className="px-5 py-3 font-medium">Scheduled for</th><th className="px-5 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody>
                {ev.map((e) => (
                  <tr key={e.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-5 py-3 text-foreground">{FLOWS.find((f) => f.kind === e.kind)?.name ?? e.kind}</td>
                    <td className="px-5 py-3 capitalize text-secondary">{e.channel ?? "—"}</td>
                    <td className="px-5 py-3 text-secondary">{formatSalonDateTime(e.scheduled_for)}</td>
                    <td className="px-5 py-3"><Badge variant={e.status === "SENT" ? "green" : e.status === "FAILED" ? "red" : "cyan"}>{e.status.toLowerCase()}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!events.isLoading && ev.length === 0 && <EmptyState icon={Zap} title="No activity yet" body="Messages appear here as soon as bookings trigger them." />}
          </div>
        )}
      </Page>
    </AppShell>
  );
}
