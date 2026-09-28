import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Pencil, Plus, Search, Scissors, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, Page, PageHeader } from "@/components/AppShell";
import { Badge, Button, Input, Switch, Textarea } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/time";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [
    { title: "Services — Pingbase" },
    { name: "description", content: "Manage the services, prices, durations and deposits Nia can offer." },
    { property: "og:title", content: "Services — Pingbase" },
    { property: "og:description", content: "Manage the services, prices, durations and deposits Nia can offer." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ServicesPage,
});

type Service = { id: string; workspace_id: string; name: string; description: string | null; price_pence: number; duration_minutes: number; deposit_pence: number; active: boolean };
type FormState = { name: string; description: string; price: string; duration: string; deposit: string; active: boolean };
const emptyForm: FormState = { name: "", description: "", price: "", duration: "60", deposit: "", active: true };

function ServicesPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Service | null | "new">(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const services = useQuery({ queryKey: ["services"], queryFn: async () => { const { data, error } = await supabase.from("services").select("*").order("name"); if (error) throw error; return (data ?? []) as Service[]; } });
  const list = useMemo(() => (services.data ?? []).filter((s) => `${s.name} ${s.description ?? ""}`.toLowerCase().includes(query.toLowerCase())), [services.data, query]);

  const open = (service?: Service) => {
    setEditing(service ?? "new");
    setForm(service ? { name: service.name, description: service.description ?? "", price: String(service.price_pence / 100), duration: String(service.duration_minutes), deposit: String(service.deposit_pence / 100), active: service.active } : emptyForm);
  };
  const save = async () => {
    if (!form.name.trim()) { toast.error("Add a service name."); return; }
    setSaving(true);
    try {
      const values = { name: form.name.trim(), description: form.description.trim() || null, price_pence: Math.round(Number(form.price || 0) * 100), duration_minutes: Number(form.duration || 0), deposit_pence: Math.round(Number(form.deposit || 0) * 100), active: form.active };
      if (editing === "new") {
        const { data: membership, error: memberError } = await supabase.from("workspace_members").select("workspace_id").limit(1).single();
        if (memberError || !membership) throw memberError ?? new Error("No workspace found");
        const { error } = await supabase.from("services").insert({ ...values, workspace_id: membership.workspace_id }); if (error) throw error;
      } else if (editing) { const { error } = await supabase.from("services").update(values).eq("id", editing.id); if (error) throw error; }
      toast.success(editing === "new" ? "Service created" : "Service updated"); setEditing(null); await qc.invalidateQueries({ queryKey: ["services"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't save the service."); } finally { setSaving(false); }
  };
  const toggle = async (service: Service) => { const { error } = await supabase.from("services").update({ active: !service.active }).eq("id", service.id); if (error) { toast.error(error.message); return; } await qc.invalidateQueries({ queryKey: ["services"] }); };

  return <AppShell><Page>
    <PageHeader title="Services" subtitle="Everything Nia can recommend and book for customers." count={services.data?.length ?? 0} actions={<Button size="sm" onClick={() => open()}><Plus className="size-3.5"/>New service</Button>} />
    <div className="grid gap-3 border-t border-border-subtle pt-4 sm:flex sm:items-center sm:justify-between"><div className="relative w-full max-w-md"><Search className="absolute left-2.5 top-2.5 size-3.5 text-tertiary"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="pl-8"/></div><Badge variant="green">{(services.data ?? []).filter((s) => s.active).length} bookable</Badge></div>
    <div className="overflow-hidden rounded-lg border border-border bg-panel shadow-xs">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_8rem_8rem_8rem_7rem] border-b border-border-subtle bg-panel-subtle px-4 py-2.5 text-[11px] text-secondary md:grid"><span>Service</span><span>Duration</span><span>Price</span><span>Deposit</span><span>Status</span></div>
      {list.map((s) => <button type="button" key={s.id} onClick={() => open(s)} className="grid w-full grid-cols-2 gap-2 border-b border-border-subtle px-4 py-3 text-left last:border-0 hover:bg-panel-subtle md:grid-cols-[minmax(0,1.4fr)_8rem_8rem_8rem_7rem] md:items-center md:gap-3">
        <span className="col-span-2 min-w-0 md:col-span-1"><span className="block text-[13px] text-foreground">{s.name}</span><span className="block truncate text-[11px] text-tertiary">{s.description ?? "No description"}</span></span>
        <span className="flex items-center gap-1.5 text-[12px] text-secondary"><Clock3 className="size-3.5"/>{s.duration_minutes} min</span><span className="text-[12px] text-secondary">{money(s.price_pence)}</span><span className="text-[12px] text-secondary">{s.deposit_pence ? money(s.deposit_pence) : "None"}</span><span className="flex items-center justify-between"><Badge variant={s.active ? "green" : "neutral"}>{s.active ? "Active" : "Hidden"}</Badge><Pencil className="size-3.5 text-tertiary"/></span>
      </button>)}
      {!services.isLoading && list.length === 0 && <EmptyState icon={Scissors} title="No services found" body="Create a service so Nia knows what customers can book."/>}
    </div>
  </Page>
  {editing && <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20" onClick={() => setEditing(null)}><aside className="h-full w-full overflow-y-auto bg-panel pb-20 shadow-lg sm:m-2 sm:h-[calc(100%-1rem)] sm:max-w-md sm:rounded-xl sm:border sm:border-border sm:pb-0" onClick={(e) => e.stopPropagation()}><header className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-panel px-4 py-4 sm:px-5"><div><p className="text-[15px] text-foreground">{editing === "new" ? "New service" : "Edit service"}</p><p className="text-[11px] text-tertiary">These details are used by Nia during booking.</p></div><Button variant="tertiary" size="sm" onClick={() => setEditing(null)} title="Close"><X className="size-4"/></Button></header><div className="space-y-4 p-4 sm:p-5">
    <Field label="Service name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></Field>
    <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></Field>
    <div className="grid gap-3 sm:grid-cols-3"><Field label="Price (£)"><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></Field><Field label="Duration"><Input type="number" min="5" step="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}/></Field><Field label="Deposit (£)"><Input type="number" min="0" step="0.01" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })}/></Field></div>
    <div className="flex items-center justify-between rounded-lg border border-border bg-panel-subtle p-3"><div><p className="text-[12px] text-foreground">Available to book</p><p className="text-[11px] text-tertiary">Nia only offers active services.</p></div><Switch label="Available to book" checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })}/></div>
    {editing !== "new" && <Button variant="secondary" className="w-full" onClick={() => void toggle(editing)}>{editing.active ? "Hide this service" : "Make service active"}</Button>}
    <Button className="w-full" disabled={saving} onClick={() => void save()}><Check className="size-4"/>{saving ? "Saving…" : "Save service"}</Button>
  </div></aside></div>}
  </AppShell>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-[11px] text-secondary"><span>{label}</span>{children}</label>; }
