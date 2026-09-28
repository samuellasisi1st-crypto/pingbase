import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, Handle, Position,
  type Connection, type Edge, type Node, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Clock3, GitBranch, MessageSquare, Plus, Save, Search, Trash2, Zap, CalendarCog, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Button, Input, Select, Switch, Textarea } from "@/design-system";
import { formatSalonDateTime } from "@/lib/time";

export const Route = createFileRoute("/automations")({
  head: () => ({ meta: [
    { title: "Automations — Pingbase" },
    { name: "description", content: "Build booking confirmations, reminders and follow-ups on a drag-and-drop flow board." },
    { property: "og:title", content: "Automations — Pingbase" },
    { property: "og:description", content: "Build booking confirmations, reminders and follow-ups on a drag-and-drop flow board." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AutomationsPage,
});

type StepKind = "trigger" | "wait" | "message" | "condition" | "update_booking";
type StepData = { kind: StepKind; label?: string; event?: string; minutes?: number; relative?: string; text?: string; condition?: string; status?: string };
type Flow = { id: string; workspace_id: string; name: string; kind: string; enabled: boolean; nodes: Node<StepData>[]; edges: Edge[] };

const STEP_META: Record<StepKind, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  trigger: { title: "Trigger", icon: Zap },
  wait: { title: "Wait", icon: Clock3 },
  message: { title: "Send message", icon: MessageSquare },
  condition: { title: "Condition", icon: GitBranch },
  update_booking: { title: "Update booking", icon: CalendarCog },
};

function summary(d: StepData) {
  if (d.kind === "trigger") return ({ booking_confirmed: "When a booking is confirmed", booking_cancelled: "When a booking is cancelled", deposit_unpaid: "When a deposit is unpaid" } as Record<string, string>)[d.event ?? "booking_confirmed"];
  if (d.kind === "wait") { const m = d.minutes ?? 0; const t = m >= 1440 && m % 1440 === 0 ? `${m / 1440} day(s)` : m >= 60 && m % 60 === 0 ? `${m / 60} hour(s)` : `${m} min`; return d.relative === "before_start" ? `${t} before the appointment` : d.relative === "after_start" ? `${t} after the appointment starts` : `${t} later`; }
  if (d.kind === "message") return d.text || "No message yet";
  if (d.kind === "condition") return d.condition || "No condition set";
  return `Mark booking ${d.status?.toLowerCase() ?? "…"}`;
}

function StepNode({ data, selected }: NodeProps<Node<StepData>>) {
  const meta = STEP_META[data.kind];
  const Icon = meta.icon;
  return (
    <div className={`w-60 rounded-xl border bg-panel p-3 shadow-md ${selected ? "border-primary" : data.kind === "trigger" ? "border-primary/60" : "border-border"}`}>
      {data.kind !== "trigger" && <Handle type="target" position={Position.Top} className="!size-2.5 !border-panel !bg-border-strong" />}
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-cyan-soft text-primary-dark"><Icon className="size-3.5" /></span>
        <div className="min-w-0"><p className="text-[10px] text-tertiary">{meta.title}</p><p className="truncate text-[12px] text-foreground">{data.label || meta.title}</p></div>
      </div>
      <p className="mt-2 line-clamp-2 rounded-md border border-border-subtle bg-panel-subtle px-2 py-1.5 text-[11px] text-secondary">{summary(data)}</p>
      <Handle type="source" position={Position.Bottom} className="!size-2.5 !border-panel !bg-primary" />
    </div>
  );
}
const nodeTypes = { step: StepNode };

let seq = 0;
const nid = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`;
function linear(steps: StepData[]): { nodes: Node<StepData>[]; edges: Edge[] } {
  const nodes = steps.map((d, i) => ({ id: `s${i}`, type: "step", position: { x: 80, y: 40 + i * 150 }, data: d }));
  const edges = nodes.slice(1).map((n, i) => ({ id: `e${i}`, source: nodes[i]!.id, target: n.id }));
  return { nodes, edges };
}
const DEFAULTS: Array<{ name: string; kind: string; steps: StepData[] }> = [
  { name: "Booking confirmation", kind: "CONFIRMATION", steps: [{ kind: "trigger", event: "booking_confirmed" }, { kind: "message", label: "Confirm appointment", text: "You're booked in! See you soon." }] },
  { name: "24-hour reminder", kind: "REMINDER_24H", steps: [{ kind: "trigger", event: "booking_confirmed" }, { kind: "wait", minutes: 1440, relative: "before_start" }, { kind: "message", label: "Send reminder", text: "Reminder: your appointment is tomorrow." }] },
  { name: "2-hour reminder", kind: "REMINDER_2H", steps: [{ kind: "trigger", event: "booking_confirmed" }, { kind: "wait", minutes: 120, relative: "before_start" }, { kind: "message", label: "Final reminder", text: "See you in 2 hours!" }] },
  { name: "Thank-you after visit", kind: "FOLLOW_UP", steps: [{ kind: "trigger", event: "booking_confirmed" }, { kind: "wait", minutes: 1560, relative: "after_start" }, { kind: "message", label: "Send follow-up", text: "Thanks for visiting! How did we do?" }] },
];

function AutomationsPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);

  const flows = useQuery({
    queryKey: ["automation-flows"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_flows").select("*").order("created_at");
      if (error) throw error;
      if (data.length) return data as unknown as Flow[];
      const { data: m } = await supabase.from("workspace_members").select("workspace_id").limit(1).maybeSingle();
      if (!m) return [];
      const rows = DEFAULTS.map((d) => ({ workspace_id: m.workspace_id, name: d.name, kind: d.kind, ...linear(d.steps) }));
      const ins = await supabase.from("automation_flows").insert(rows as never).select("*");
      if (ins.error) throw ins.error;
      return ins.data as unknown as Flow[];
    },
  });
  const events = useQuery({
    queryKey: ["automation-events"],
    queryFn: async () => (await supabase.from("automation_events").select("*").order("scheduled_for", { ascending: false }).limit(200)).data ?? [],
  });

  useEffect(() => { if (!selectedId && flows.data?.[0] && typeof window !== "undefined" && window.innerWidth >= 768) setSelectedId(flows.data[0].id); }, [flows.data, selectedId]);
  const filtered = useMemo(() => (flows.data ?? []).filter((f) => f.name.toLowerCase().includes(q.toLowerCase())), [flows.data, q]);
  const flow = flows.data?.find((f) => f.id === selectedId) ?? null;

  const createFlow = async () => {
    const { data: m } = await supabase.from("workspace_members").select("workspace_id").limit(1).maybeSingle();
    if (!m) return;
    const { data, error } = await supabase.from("automation_flows").insert({ workspace_id: m.workspace_id, name: "New automation", kind: "custom", ...linear([{ kind: "trigger", event: "booking_confirmed" }]) } as never).select("id").single();
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["automation-flows"] });
    setSelectedId(data.id);
  };

  return (
    <AppShell>
      <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden bg-panel-subtle md:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className={`${flow ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-border-subtle bg-panel p-3`}>
          <div className="mb-3 flex items-center justify-between px-1"><p className="text-[13px] text-foreground">Automations</p><Button size="sm" className="px-2" title="New automation" onClick={() => void createFlow()}><Plus className="size-3.5" /></Button></div>
          <div className="relative mb-3"><Search className="absolute left-2.5 top-2.5 size-3.5 text-tertiary" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-8 w-full rounded-lg border border-border bg-panel pl-8 pr-2 text-[12px] text-foreground focus:border-primary focus:outline-none" /></div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filtered.map((f) => (
              <button key={f.id} type="button" onClick={() => setSelectedId(f.id)} className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-[12px] ${f.id === selectedId ? "border-border bg-panel-subtle shadow-xs" : "border-transparent text-secondary hover:bg-hover"}`}>
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-cyan-soft text-primary-dark"><Zap className="size-3.5" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-foreground">{f.name}</span><span className="block truncate text-[10px] text-tertiary">{f.enabled ? "Active" : "Off"} · {f.nodes.length} steps</span></span>
                <ChevronRight className="size-3.5 text-tertiary md:hidden" />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setActivityOpen(true)} className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[12px] text-secondary hover:bg-hover"><span>Activity log</span><ChevronRight className="size-3.5" /></button>
        </aside>
        <section className={`${flow ? "flex" : "hidden md:flex"} relative min-h-0 min-w-0 flex-col`}>
          {flow ? <FlowEditor key={flow.id} flow={flow} onBack={() => setSelectedId(null)} onSaved={() => void qc.invalidateQueries({ queryKey: ["automation-flows"] })} onDeleted={() => { setSelectedId(null); void qc.invalidateQueries({ queryKey: ["automation-flows"] }); }} />
            : <p className="m-auto text-[12px] text-tertiary">Choose an automation to edit</p>}
        </section>
      </div>
      {activityOpen && <div className="fixed inset-0 z-40 flex justify-end bg-foreground/20" onClick={() => setActivityOpen(false)}><aside className="h-full w-full overflow-y-auto bg-panel pb-20 shadow-lg sm:m-2 sm:h-[calc(100%-1rem)] sm:max-w-lg sm:rounded-xl sm:border sm:border-border sm:pb-0" onClick={(e) => e.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-panel px-5 py-4"><p className="text-[14px] text-foreground">Activity log</p><Button variant="tertiary" size="sm" onClick={() => setActivityOpen(false)}>Close</Button></div><div className="divide-y divide-border-subtle">{(events.data ?? []).map((e) => <div key={e.id} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3 text-[12px]"><div><p className="text-foreground">{flows.data?.find((f) => f.kind === e.kind || e.kind.startsWith(`FLOW:${f.id}`))?.name ?? e.kind}</p><p className="mt-1 capitalize text-tertiary">{e.channel ?? "—"} · {formatSalonDateTime(e.scheduled_for)}</p></div><Badge variant={e.status === "SENT" ? "green" : e.status === "FAILED" ? "red" : "cyan"}>{e.status.toLowerCase()}</Badge></div>)}{!events.isLoading && !events.data?.length && <p className="px-5 py-12 text-center text-[12px] text-tertiary">No automation activity yet.</p>}</div></aside></div>}
    </AppShell>
  );
}

function FlowEditor({ flow, onBack, onSaved, onDeleted }: { flow: Flow; onBack: () => void; onSaved: () => void; onDeleted: () => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StepData>>(flow.nodes.map((n) => ({ ...n, type: "step" })));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(flow.edges);
  const [name, setName] = useState(flow.name);
  const [enabled, setEnabled] = useState(flow.enabled);
  const [saving, setSaving] = useState(false);
  const selected = nodes.find((n) => n.selected) ?? null;

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)), [setEdges]);
  const addStep = (kind: StepKind) => {
    const last = nodes[nodes.length - 1];
    const id = nid();
    const data: StepData = kind === "wait" ? { kind, minutes: 60, relative: "later" } : kind === "message" ? { kind, text: "" } : kind === "trigger" ? { kind, event: "booking_confirmed" } : kind === "update_booking" ? { kind, status: "COMPLETED" } : { kind, condition: "" };
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { id, type: "step", position: { x: (last?.position.x ?? 80), y: (last?.position.y ?? 0) + 150 }, data, selected: true }]);
    if (last) setEdges((es) => [...es, { id: `e${id}`, source: last.id, target: id }]);
  };
  const patch = (p: Partial<StepData>) => selected && setNodes((ns) => ns.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, ...p } } : n)));
  const removeSelected = () => { if (!selected) return; setNodes((ns) => ns.filter((n) => n.id !== selected.id)); setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id)); };

  const save = async () => {
    setSaving(true);
    const clean = nodes.map(({ id, type, position, data }) => ({ id, type, position, data }));
    const { error } = await supabase.from("automation_flows").update({ name, enabled, nodes: clean as never, edges: edges.map(({ id, source, target }) => ({ id, source, target })) as never }).eq("id", flow.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Automation saved");
    onSaved();
  };
  const del = async () => {
    if (!confirm(`Delete "${flow.name}"?`)) return;
    const { error } = await supabase.from("automation_flows").delete().eq("id", flow.id);
    if (error) { toast.error(error.message); return; }
    onDeleted();
  };

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-panel px-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="tertiary" size="sm" className="md:hidden" title="Back" onClick={onBack}><ArrowLeft className="size-4" /></Button>
          <input value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 rounded-md bg-transparent px-1.5 py-1 text-[13px] text-foreground hover:bg-hover focus:bg-hover focus:outline-none" />
          <Switch label="Active" checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="tertiary" size="sm" title="Delete automation" onClick={() => void del()}><Trash2 className="size-4" /></Button>
          <Button size="sm" disabled={saving} onClick={() => void save()}><Save className="size-3.5" />{saving ? "Saving…" : "Save"}</Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 flex-1">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView fitViewOptions={{ maxZoom: 1 }} deleteKeyCode={["Backspace", "Delete"]} proOptions={{ hideAttribution: true }} className="automation-flow">
            <Background gap={16} size={1} color="var(--border-default)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!hidden md:!block" />
          </ReactFlow>
          <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-1 rounded-xl border border-border bg-panel p-1 shadow-md">
            {(["wait", "message", "condition", "update_booking"] as StepKind[]).map((k) => { const I = STEP_META[k].icon; return <button key={k} type="button" onClick={() => addStep(k)} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-secondary hover:bg-hover hover:text-foreground"><I className="size-3.5" /><span className="hidden sm:inline">{STEP_META[k].title}</span></button>; })}
          </div>
        </div>
        {selected && (
          <aside className="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-y-auto border-t border-border bg-panel p-4 shadow-lg md:static md:max-h-none md:w-72 md:border-l md:border-t-0 md:shadow-none">
            <div className="mb-3 flex items-center justify-between"><p className="text-[13px] text-foreground">{STEP_META[selected.data.kind].title}</p>{selected.data.kind !== "trigger" && <Button variant="tertiary" size="sm" title="Delete step" onClick={removeSelected}><Trash2 className="size-3.5" /></Button>}</div>
            <div className="grid gap-3 text-[11px] text-secondary">
              <label className="grid gap-1">Label<Input value={selected.data.label ?? ""} onChange={(e) => patch({ label: e.target.value })} /></label>
              {selected.data.kind === "trigger" && <label className="grid gap-1">When<Select value={selected.data.event ?? "booking_confirmed"} onChange={(e) => patch({ event: e.target.value })}><option value="booking_confirmed">A booking is confirmed</option><option value="booking_cancelled">A booking is cancelled</option><option value="deposit_unpaid">A deposit is unpaid</option></Select></label>}
              {selected.data.kind === "wait" && <>
                <label className="grid gap-1">Minutes<Input type="number" min={0} value={selected.data.minutes ?? 0} onChange={(e) => patch({ minutes: Number(e.target.value) })} /></label>
                <label className="grid gap-1">Relative to<Select value={selected.data.relative ?? "later"} onChange={(e) => patch({ relative: e.target.value })}><option value="later">After the previous step</option><option value="before_start">Before the appointment</option><option value="after_start">After the appointment starts</option></Select></label>
              </>}
              {selected.data.kind === "message" && <label className="grid gap-1">Message<Textarea rows={5} value={selected.data.text ?? ""} onChange={(e) => patch({ text: e.target.value })} /><span className="text-tertiary">Sent on the customer's original channel.</span></label>}
              {selected.data.kind === "condition" && <label className="grid gap-1">Only continue if<Select value={selected.data.condition ?? ""} onChange={(e) => patch({ condition: e.target.value })}><option value="">Choose…</option><option value="Deposit is unpaid">Deposit is unpaid</option><option value="Booking is still confirmed">Booking is still confirmed</option><option value="Customer has not replied">Customer has not replied</option></Select></label>}
              {selected.data.kind === "update_booking" && <label className="grid gap-1">Set status to<Select value={selected.data.status ?? "COMPLETED"} onChange={(e) => patch({ status: e.target.value })}><option value="COMPLETED">Completed</option><option value="NO_SHOW">No-show</option><option value="CANCELLED">Cancelled</option></Select></label>}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
