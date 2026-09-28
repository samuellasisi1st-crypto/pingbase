import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, Page, PageHeader } from "@/components/AppShell";
import { Badge, Button, Card } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ai-agents")({
  head: () => ({ meta: [
    { title: "AI Agents — Pingbase" },
    { name: "description", content: "All your AI agents, each with its own voice, instructions, guardrails and channels." },
    { property: "og:title", content: "AI Agents — Pingbase" },
    { property: "og:description", content: "All your AI agents, each with its own voice, instructions, guardrails and channels." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AgentsList,
});

export const CHANNEL_LABELS: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", messenger: "Messenger", test: "Web chat" };

function AgentsList() {
  const navigate = useNavigate();
  const agents = useQuery({
    queryKey: ["ai-agents"],
    queryFn: async () => {
      const [a, convs] = await Promise.all([
        supabase.from("ai_agents").select("*").order("created_at"),
        supabase.from("conversations").select("agent_id"),
      ]);
      if (a.error) throw a.error;
      const counts: Record<string, number> = {};
      for (const c of convs.data ?? []) if (c.agent_id) counts[c.agent_id] = (counts[c.agent_id] ?? 0) + 1;
      return (a.data ?? []).map((x) => ({ ...x, conversations: counts[x.id] ?? 0 }));
    },
  });

  const create = async () => {
    const { data: m } = await supabase.from("workspace_members").select("workspace_id").limit(1).maybeSingle();
    if (!m) { toast.error("No workspace found"); return; }
    const { data, error } = await supabase.from("ai_agents").insert({ workspace_id: m.workspace_id, name: "New agent", is_default: !(agents.data?.length) }).select("id").single();
    if (error) { toast.error(error.message); return; }
    void navigate({ to: "/ai-agents/$agentId", params: { agentId: data.id } });
  };

  return (
    <AppShell>
      <Page>
        <PageHeader title="AI Agents" count={agents.data?.length ?? 0} subtitle="Each agent has its own name, instructions and channels. Conversations go to the agent assigned to their channel."
          actions={<Button size="sm" onClick={() => void create()}><Plus className="size-3.5" />New agent</Button>} />
        {agents.data && agents.data.length === 0 && <EmptyState icon={Bot} title="No agents yet" body="Create your first agent to start replying to customers." />}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {agents.data?.map((a) => (
            <Link key={a.id} to="/ai-agents/$agentId" params={{ agentId: a.id }} className="group">
              <Card className="grid h-full gap-4 p-4 transition-colors group-hover:border-border-strong">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-soft text-primary"><Bot className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[14px] text-foreground">{a.name}<Badge variant={a.enabled ? "green" : "neutral"}>{a.enabled ? "Live" : "Off"}</Badge>{a.is_default && <Badge variant="cyan">Default</Badge>}</p>
                    <p className="truncate text-[11px] text-secondary">{a.purpose || "No purpose set"}</p>
                  </div>
                  <ChevronRight className="size-4 text-tertiary" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {(a.channels ?? []).length ? a.channels.map((c: string) => <Badge key={c}>{CHANNEL_LABELS[c] ?? c}</Badge>) : <span className="text-[11px] text-tertiary">{a.is_default ? "Handles every channel without its own agent" : "No channels assigned"}</span>}
                </div>
                <p className="text-[11px] text-tertiary">{a.conversations} conversation{a.conversations === 1 ? "" : "s"}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Page>
    </AppShell>
  );
}
