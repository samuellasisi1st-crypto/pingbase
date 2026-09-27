import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot, Headset, CalendarHeart, Wand2 } from "lucide-react";

import { AppShell, Page, PageHeader, StatCard } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/design-system/components/Badge";
import { Button } from "@/design-system/components/Button";

export const Route = createFileRoute("/ai-agents")({
  head: () => ({
    meta: [
      { title: "AI Agents — Pingbase" },
      { name: "description", content: "Your AI concierge answers questions and books appointments 24/7." },
      { property: "og:title", content: "AI Agents — Pingbase" },
      { property: "og:description", content: "Your AI concierge answers questions and books appointments 24/7." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const data = useQuery({
    queryKey: ["agent-overview"],
    queryFn: async () => {
      const [settings, actions, handoffs, booked] = await Promise.all([
        supabase.from("ai_agent_settings").select("*").maybeSingle(),
        supabase.from("ai_action_logs").select("id", { count: "exact", head: true }),
        supabase.from("handoffs").select("id", { count: "exact", head: true }),
        supabase.from("booking_events").select("id", { count: "exact", head: true }),
      ]);
      return { s: settings.data, actions: actions.count ?? 0, handoffs: handoffs.count ?? 0, booked: booked.count ?? 0 };
    },
  });
  const s = data.data?.s;

  return (
    <AppShell>
      <Page>
        <PageHeader title="AI Agents" subtitle="Your team of smart AI agents, working for you 24/7." />
        <div className="rounded-xl border border-border p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-cyan-soft"><Bot className="size-7 text-primary" /></span>
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold text-foreground">{s?.agent_name ?? "Nia"} <Badge variant={s?.enabled === false ? "neutral" : "green"}>{s?.enabled === false ? "Off" : "Live"}</Badge></p>
                <p className="text-[13px] text-secondary">Booking concierge · {s?.tone ?? "Warm, concise, professional"}</p>
              </div>
            </div>
            <Link to="/settings"><Button variant="secondary">Edit agent</Button></Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatCard label="Actions taken" value={data.data?.actions ?? "—"} hint="Tool calls checked against real data" />
            <StatCard label="Booking events" value={data.data?.booked ?? "—"} hint="Created, moved or cancelled" />
            <StatCard label="Handed to team" value={data.data?.handoffs ?? "—"} hint="Refunds, complaints, requests for a person" />
          </div>
        </div>

        <p className="pt-4 text-center text-[15px] font-medium text-foreground">Add another agent</p>
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            { icon: Headset, t: "Support Agent", d: "Answers customer questions instantly and around the clock." },
            { icon: CalendarHeart, t: "Rebooking Agent", d: "Reaches out to lapsed regulars and fills quiet days." },
            { icon: Wand2, t: "Custom Agent", d: "You describe what it should do, and we build it for you." },
          ].map((a) => (
            <div key={a.t} className="rounded-xl border border-dashed border-border p-2">
              <div className="grid h-36 place-items-center rounded-lg bg-hover"><a.icon className="size-10 text-tertiary" /></div>
              <div className="p-3">
                <p className="text-[14px] font-semibold text-foreground">{a.t}</p>
                <p className="mt-1 text-[12px] text-secondary">{a.d}</p>
                <Button variant="secondary" size="sm" className="mt-4 w-full" disabled>Coming soon</Button>
              </div>
            </div>
          ))}
        </div>
      </Page>
    </AppShell>
  );
}
