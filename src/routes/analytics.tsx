import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell, Page, PageHeader, StatCard } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/time";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Pingbase" },
      { name: "description", content: "Conversations, bookings and revenue handled by your AI concierge." },
      { property: "og:title", content: "Analytics — Pingbase" },
      { property: "og:description", content: "Conversations, bookings and revenue handled by your AI concierge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const q = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [convs, appts] = await Promise.all([
        supabase.from("conversations").select("channel,handling_mode,needs_attention"),
        supabase.from("appointments").select("status,price_pence,starts_at"),
      ]);
      return { convs: convs.data ?? [], appts: appts.data ?? [] };
    },
  });
  const convs = q.data?.convs ?? [];
  const appts = q.data?.appts ?? [];
  const booked = appts.filter((a) => a.status !== "CANCELLED");
  const revenue = booked.reduce((s, a) => s + (a.price_pence ?? 0), 0);
  const aiShare = convs.length ? Math.round((convs.filter((c) => c.handling_mode === "AI").length / convs.length) * 100) : 0;
  const byChannel = Object.entries(convs.reduce<Record<string, number>>((m, c) => ((m[c.channel] = (m[c.channel] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...byChannel.map((x) => x[1]));
  const status = Object.entries(appts.reduce<Record<string, number>>((m, a) => ((m[a.status] = (m[a.status] ?? 0) + 1), m), {}));

  return (
    <AppShell>
      <Page>
        <PageHeader title="Analytics" subtitle="How Pingbase is working for Studio Nine Hair." />
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Conversations" value={convs.length} hint="All channels" />
          <StatCard label="Handled by AI" value={`${aiShare}%`} hint="No team reply needed" />
          <StatCard label="Appointments" value={booked.length} hint="Not cancelled" />
          <StatCard label="Booked value" value={money(revenue)} hint="Service prices" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-5">
            <p className="text-[14px] font-semibold text-foreground">Conversations by channel</p>
            <div className="mt-4 space-y-3">
              {byChannel.map(([ch, n]) => (
                <div key={ch}>
                  <div className="flex justify-between text-[13px]"><span className="capitalize text-secondary">{ch}</span><span className="text-foreground">{n}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-hover"><div className="h-2 rounded-full bg-primary" style={{ width: `${(n / max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-[14px] font-semibold text-foreground">Appointment status</p>
            <div className="mt-4 divide-y divide-border-subtle">
              {status.map(([s, n]) => (
                <div key={s} className="flex justify-between py-2.5 text-[13px]"><span className="text-secondary">{s.toLowerCase()}</span><span className="font-medium text-foreground">{n}</span></div>
              ))}
            </div>
          </div>
        </div>
      </Page>
    </AppShell>
  );
}
