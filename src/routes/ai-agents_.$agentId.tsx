import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, CalendarCheck, Handshake, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Page, PageHeader } from "@/components/AppShell";
import { Badge, Button, Card, Input, Select, Switch, Textarea } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ai-agents_/$agentId")({
  head: () => ({ meta: [
    { title: "Agent settings — Pingbase" },
    { name: "description", content: "Configure this AI agent's identity, instructions, guardrails and channels." },
    { property: "og:title", content: "Agent settings — Pingbase" },
    { property: "og:description", content: "Configure this AI agent's identity, instructions, guardrails and channels." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AgentDetail,
});

const CHANNELS = [{ v: "whatsapp", l: "WhatsApp" }, { v: "instagram", l: "Instagram" }, { v: "messenger", l: "Messenger" }, { v: "test", l: "Web chat" }];
type Agent = { id: string; workspace_id: string; name: string; purpose: string; tone: string; instructions: string; autonomy_level: string; escalation_rules: string; forbidden_topics: string; channels: string[]; is_default: boolean; enabled: boolean };

function AgentDetail() {
  const { agentId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const data = useQuery({
    queryKey: ["ai-agent", agentId],
    queryFn: async () => {
      const [a, actions, handoffs, convs] = await Promise.all([
        supabase.from("ai_agents").select("*").eq("id", agentId).maybeSingle(),
        supabase.from("ai_action_logs").select("id", { count: "exact", head: true }),
        supabase.from("handoffs").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("agent_id", agentId),
      ]);
      if (a.error) throw a.error;
      return { a: a.data as Agent | null, actions: actions.count ?? 0, handoffs: handoffs.count ?? 0, convs: convs.count ?? 0 };
    },
  });
  useEffect(() => { if (data.data?.a) setForm(data.data.a); }, [data.data?.a]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    if (form.is_default) await supabase.from("ai_agents").update({ is_default: false }).eq("workspace_id", form.workspace_id).neq("id", form.id);
    const { error } = await supabase.from("ai_agents").update({
      name: form.name, purpose: form.purpose, tone: form.tone, instructions: form.instructions, autonomy_level: form.autonomy_level,
      escalation_rules: form.escalation_rules, forbidden_topics: form.forbidden_topics, channels: form.channels, is_default: form.is_default, enabled: form.enabled,
    }).eq("id", form.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${form.name} saved`);
    await qc.invalidateQueries({ queryKey: ["ai-agents"] });
    await qc.invalidateQueries({ queryKey: ["ai-agent", agentId] });
  };
  const remove = async () => {
    if (!form || !confirm(`Delete ${form.name}?`)) return;
    const { error } = await supabase.from("ai_agents").delete().eq("id", form.id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["ai-agents"] });
    void navigate({ to: "/ai-agents" });
  };
  const set = <K extends keyof Agent>(k: K, v: Agent[K]) => form && setForm({ ...form, [k]: v });

  return (
    <AppShell>
      <Page>
        <Link to="/ai-agents" className="mb-2 inline-flex items-center gap-1 text-[12px] text-secondary hover:text-foreground"><ArrowLeft className="size-3.5" />All agents</Link>
        <PageHeader title={form?.name ?? "Agent"} subtitle={form?.purpose || "Configure this agent."}
          actions={<div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!form} onClick={() => void remove()}><Trash2 className="size-3.5" /></Button><Button size="sm" disabled={!form || saving} onClick={() => void save()}><Save className="size-3.5" />{saving ? "Saving…" : "Save changes"}</Button></div>} />
        {!form ? <p className="text-[12px] text-secondary">{data.isLoading ? "Loading…" : "Agent not found."}</p> : (
          <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
            <aside className="grid gap-3 lg:sticky lg:top-4">
              <Card className="p-4">
                <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-soft text-primary"><Bot className="size-5" /></span>
                  <div className="min-w-0"><p className="flex items-center gap-2 truncate text-[15px] text-foreground">{form.name}<Badge variant={form.enabled ? "green" : "neutral"}>{form.enabled ? "Live" : "Off"}</Badge></p><p className="truncate text-[11px] text-secondary">{form.purpose || "AI agent"}</p></div></div>
                <div className="mt-4 grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-panel-subtle px-3 py-2"><span className="text-[11px] text-secondary">Replies to customers</span><Switch label="Agent enabled" checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} /></div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-panel-subtle px-3 py-2"><span className="text-[11px] text-secondary">Default agent</span><Switch label="Default agent" checked={form.is_default} onCheckedChange={(v) => set("is_default", v)} /></div>
                </div>
              </Card>
              <Card className="p-0"><Stat label="Conversations" value={data.data?.convs ?? 0} /><Stat label="Actions taken (all agents)" value={data.data?.actions ?? 0} /><Stat label="Handed to team (all agents)" value={data.data?.handoffs ?? 0} /></Card>
            </aside>
            <div className="grid gap-4">
              <Section title="Identity" body="How this agent introduces itself and how independently it works.">
                <div className="grid gap-4 md:grid-cols-2"><Field label="Agent name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
                  <Field label="Autonomy"><Select value={form.autonomy_level} onChange={(e) => set("autonomy_level", e.target.value)}><option value="guided">Guided</option><option value="standard">Standard</option><option value="high">High</option></Select></Field></div>
                <Field label="Purpose"><Input value={form.purpose} placeholder="e.g. Booking concierge for Instagram" onChange={(e) => set("purpose", e.target.value)} /></Field>
                <Field label="Tone of voice"><Textarea value={form.tone} onChange={(e) => set("tone", e.target.value)} /></Field>
              </Section>
              <Section title="Channels" body="Conversations on these channels go to this agent. The default agent handles any channel without its own agent.">
                <div className="flex flex-wrap gap-2">{CHANNELS.map((c) => { const on = form.channels.includes(c.v); return (
                  <button key={c.v} type="button" onClick={() => set("channels", on ? form.channels.filter((x) => x !== c.v) : [...form.channels, c.v])}
                    className={`rounded-md border px-3 py-1.5 text-[12px] ${on ? "border-primary bg-selected text-foreground" : "border-border text-secondary hover:bg-hover"}`}>{c.l}</button>); })}</div>
              </Section>
              <Section title="Instructions" body="What this agent should always keep in mind."><Field label="Core instructions"><Textarea rows={6} value={form.instructions} onChange={(e) => set("instructions", e.target.value)} /></Field></Section>
              <Section title="Guardrails & handover" body="When to bring in your team, and what this agent must never do.">
                <div className="grid gap-4 md:grid-cols-2"><Field label="Hand over to the team when"><Textarea value={form.escalation_rules} onChange={(e) => set("escalation_rules", e.target.value)} /></Field>
                  <Field label="Never discuss or do"><Textarea value={form.forbidden_topics} onChange={(e) => set("forbidden_topics", e.target.value)} /></Field></div>
              </Section>
              <Section title="Always on" body="Built-in protections that can't be switched off.">
                <div className="grid gap-3 md:grid-cols-3"><Capability icon={CalendarCheck} title="Live availability" body="Rechecks the slot before confirming any booking." /><Capability icon={Handshake} title="Human handover" body="Pauses AI replies until your team returns the chat." /><Capability icon={ShieldCheck} title="Grounded answers" body="Prices and policies come only from your saved info." /></div>
              </Section>
            </div>
          </div>
        )}
      </Page>
    </AppShell>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-[11px] text-secondary"><span>{label}</span>{children}</label>; }
function Capability({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) { return <Card variant="subtle"><span className="grid size-8 place-items-center rounded-md bg-panel text-primary shadow-xs"><Icon className="size-4" /></span><p className="mt-3 text-[13px] text-foreground">{title}</p><p className="mt-1 text-[11px] text-secondary">{body}</p></Card>; }
function Section({ title, body, children }: { title: string; body: string; children: React.ReactNode }) { return <Card className="grid gap-4 p-4 sm:p-5"><div><p className="text-[14px] text-foreground">{title}</p><p className="text-[11px] text-secondary">{body}</p></div>{children}</Card>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 last:border-0"><span className="text-[12px] text-secondary">{label}</span><span className="text-[14px] text-foreground">{value}</span></div>; }
