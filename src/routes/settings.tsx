import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money } from "@/lib/time";
import { MetaConnectForm } from "@/components/MetaConnectForm";
import { WhatsAppConnectForm } from "@/components/WhatsAppConnectForm";
import { WhatsAppTestConsole } from "@/components/WhatsAppTestConsole";
import { GoogleCalendarConnectForm } from "@/components/GoogleCalendarConnectForm";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Pingbase" },
      { name: "description", content: "Services, staff, policies, knowledge and channel connections for the concierge." },
      { property: "og:title", content: "Settings — Pingbase" },
      { property: "og:description", content: "Services, staff, policies, knowledge and channel connections for the concierge." },
    ],
  }),
  component: SettingsPage,
});

const CHANNEL_LABEL: Record<string, string> = {
  NOT_CONNECTED: "Not connected",
  CONNECTING: "Connecting",
  CONNECTED: "Connected",
  ERROR: "Error",
  NEEDS_REAUTH: "Needs reauthorisation",
};

function SettingsPage() {
  const data = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const [business, services, staff, hours, policies, knowledge, agent, channels] = await Promise.all([
        supabase.from("business_settings").select("*").maybeSingle(),
        supabase.from("services").select("*").order("name"),
        supabase.from("staff").select("*").order("name"),
        supabase.from("staff_working_hours").select("*, staff:staff_id(name)").order("weekday"),
        supabase.from("business_policies").select("*").order("policy_type"),
        supabase.from("knowledge_sources").select("*").order("title"),
        supabase.from("ai_agent_settings").select("*").maybeSingle(),
        supabase.from("channel_connections").select("*").order("channel"),
      ]);
      return {
        business: business.data,
        services: services.data ?? [],
        staff: staff.data ?? [],
        hours: hours.data ?? [],
        policies: policies.data ?? [],
        knowledge: knowledge.data ?? [],
        agent: agent.data,
        channels: channels.data ?? [],
      };
    },
  });

  if (data.isLoading || !data.data) {
    return (
      <AppShell title="Settings">
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  const d = data.data;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <AppShell title="Settings">
      <div className="p-6">
        <Tabs defaultValue="services">
          <TabsList className="flex-wrap">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="staff">Staff &amp; hours</TabsTrigger>
            <TabsTrigger value="rules">Booking rules</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="agent">AI agent</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4 grid gap-3">
            {(d.services as unknown as Array<{ id: string; name: string; description: string | null; duration_minutes: number; price_pence: number; deposit_pence: number; active: boolean }>).map((s) => (
              <div key={s.id} className="rounded-xl border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge variant="outline">{money(s.price_pence)}</Badge>
                    <Badge variant="outline">{s.duration_minutes} min</Badge>
                    <Badge variant={s.deposit_pence ? "default" : "secondary"}>
                      {s.deposit_pence ? `${money(s.deposit_pence)} deposit` : "No deposit"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="staff" className="mt-4 grid gap-3">
            {(d.staff as unknown as Array<{ id: string; name: string; role: string | null }>).map((s) => (
              <div key={s.id} className="rounded-xl border bg-surface p-4">
                <p className="font-display text-lg">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.role}</p>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {(d.hours as unknown as Array<{ id: string; staff_id: string; weekday: number; start_time: string; end_time: string }>)
                    .filter((h) => h.staff_id === s.id)
                    .map((h) => (
                      <li key={h.id}>
                        {days[h.weekday]} · {h.start_time.slice(0, 5)}–{h.end_time.slice(0, 5)}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="rules" className="mt-4 space-y-3">
            {d.business && (
              <div className="rounded-xl border bg-surface p-4 text-sm">
                <p className="font-display text-lg">Booking rules</p>
                <p className="mt-2 text-muted-foreground">
                  Buffer between appointments: {(d.business as { buffer_minutes: number }).buffer_minutes} min ·
                  Minimum notice: {(d.business as { min_notice_minutes: number }).min_notice_minutes} min ·
                  Bookable up to {(d.business as { max_days_ahead: number }).max_days_ahead} days ahead
                </p>
              </div>
            )}
            {(d.policies as unknown as Array<{ id: string; policy_type: string; title: string; body: string }>).map((p) => (
              <div key={p.id} className="rounded-xl border bg-surface p-4">
                <p className="font-medium">{p.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="knowledge" className="mt-4 grid gap-3">
            {(d.knowledge as unknown as Array<{ id: string; title: string; body: string; source_type: string }>).map((k) => (
              <div key={k.id} className="rounded-xl border bg-surface p-4">
                <p className="font-medium">{k.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{k.body}</p>
                <Badge variant="outline" className="mt-2">{k.source_type}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="agent" className="mt-4">
            {d.agent && (
              <div className="space-y-3 rounded-xl border bg-surface p-5 text-sm">
                <p className="font-display text-lg">{(d.agent as { agent_name: string }).agent_name}</p>
                <p className="text-muted-foreground">Tone: {(d.agent as { tone: string }).tone}</p>
                <p className="text-muted-foreground">Autonomy: {(d.agent as { autonomy_level: string }).autonomy_level}</p>
                <div>
                  <p className="font-medium">Instructions</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {(d.agent as { instructions: string }).instructions}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Escalates when</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {(d.agent as { escalation_rules: string }).escalation_rules}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="channels" className="mt-4 grid gap-3">
            <MetaConnectForm
              connected={(d.channels as unknown as Array<{ channel: string; status: string }>).some(
                (c) => c.channel === "messenger" && c.status === "CONNECTED",
              )}
            />
            <WhatsAppConnectForm />
            <GoogleCalendarConnectForm />
            {(d.channels as unknown as Array<{ channel: string; status: string }>).some(
              (c) => c.channel === "whatsapp" && c.status === "CONNECTED",
            ) && <WhatsAppTestConsole />}
            {(d.channels as unknown as Array<{ id: string; channel: string; status: string; last_error: string | null }>)
              .filter((c) => c.channel !== "whatsapp")
              .map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border bg-surface p-4">
                <div>
                  <p className="font-medium capitalize">{c.channel === "test" ? "Internal test chat" : c.channel}</p>
                  {c.last_error && <p className="text-xs text-destructive">{c.last_error}</p>}
                </div>
                <Badge variant={c.status === "CONNECTED" ? "default" : c.status === "ERROR" ? "destructive" : "secondary"}>
                  {CHANNEL_LABEL[c.status] ?? c.status}
                </Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Instagram, Messenger and WhatsApp go live once connected above. Telegram, Gmail and Outlook still need their
              credentials before they can receive messages.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
