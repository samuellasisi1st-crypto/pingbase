import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Clock3, MapPin, Plus, Trash2, Video, Home } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CatalogImages, useSignedImages } from "@/components/CatalogImages";
import { Badge, Button, Input, Select, Switch, Textarea } from "@/design-system";
import { archiveService, getServiceEditor, saveService, type ServiceInput } from "@/lib/catalog.functions";
import { money } from "@/lib/time";

export const Route = createFileRoute("/services_/$serviceId")({
  head: () => ({ meta: [
    { title: "Edit service — Pingbase" },
    { name: "description", content: "Set up a service step by step: details, pricing options, photos and intake questions." },
    { property: "og:title", content: "Edit service — Pingbase" },
    { property: "og:description", content: "Set up a service step by step: details, pricing options, photos and intake questions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ServiceEditor,
});

const STEPS = ["Details", "Price & time", "Photos", "Add-ons & questions"] as const;
const DURATIONS = [15, 30, 45, 60, 90, 120, 180];
const LOCATIONS = [
  { id: "in_person", label: "At my place", body: "Customers come to you", icon: MapPin },
  { id: "at_customer", label: "At the customer", body: "You travel to them", icon: Home },
  { id: "online", label: "Online", body: "Video or phone call", icon: Video },
] as const;
const QTYPES: Array<{ id: ServiceInput["questions"][number]["type"]; label: string }> = [
  { id: "short_text", label: "Short answer" }, { id: "long_text", label: "Paragraph" }, { id: "single_choice", label: "One choice" },
  { id: "multi_choice", label: "Several choices" }, { id: "yes_no", label: "Yes / No" }, { id: "date", label: "Date" },
];
const empty: ServiceInput = {
  id: null, name: "", description: "", categoryName: "", pricePence: 0, durationMinutes: 60, bufferMinutes: 0, depositPence: 0,
  locationType: "in_person", visibleInStore: true, onlineBooking: true, paymentMode: "in_store", active: true, imagePaths: [], staffIds: [], variants: [], addons: [], questions: [],
};
const pounds = (p: number) => (p ? String(p / 100) : "");
const toPence = (v: string) => Math.max(0, Math.round(Number(v || 0) * 100));

function ServiceEditor() {
  const { serviceId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const load = useServerFn(getServiceEditor);
  const save = useServerFn(saveService);
  const archive = useServerFn(archiveService);
  const editor = useQuery({ queryKey: ["service-editor", serviceId], queryFn: () => load({ data: { id: serviceId } }) });
  const [form, setForm] = useState<ServiceInput>(empty);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (editor.data) setForm(editor.data.service ?? empty); }, [editor.data]);
  const set = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const problems = [
    !form.name.trim() && "Add a service name.",
    form.variants.some((v) => !v.name.trim()) && "Every pricing option needs a name.",
    form.addons.some((a) => !a.name.trim()) && "Every add-on needs a name.",
    form.questions.some((q) => !q.label.trim()) && "Every question needs a label.",
    form.questions.some((q) => (q.type === "single_choice" || q.type === "multi_choice") && q.options.length < 2) && "Choice questions need at least two options.",
  ].filter(Boolean) as string[];

  const submit = async () => {
    if (problems.length) { toast.error(problems[0]); return; }
    setSaving(true);
    try {
      await save({ data: form });
      await qc.invalidateQueries({ queryKey: ["services"] });
      toast.success(form.id ? "Service updated" : "Service created");
      navigate({ to: "/services" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save the service."); } finally { setSaving(false); }
  };

  if (editor.isLoading) return <AppShell><div className="p-8 text-sm text-secondary">Loading…</div></AppShell>;
  if (editor.error || !editor.data) return <AppShell><div className="p-8 text-sm text-secondary">Couldn't load this service. <Link to="/services" className="text-primary">Back to services</Link></div></AppShell>;
  const { staff, categories, workspaceId } = editor.data;

  return (
    <AppShell>
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-panel">
          <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-3 md:px-8">
            <Link to="/services" className="grid size-8 place-items-center rounded-md border border-border text-secondary hover:bg-hover" aria-label="Back"><ArrowLeft className="size-4" /></Link>
            <div className="min-w-0 flex-1"><p className="truncate text-[15px] text-foreground">{form.name || (form.id ? "Edit service" : "New service")}</p><p className="text-[11px] text-tertiary">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p></div>
            <Button size="sm" disabled={saving} onClick={() => void submit()}><Check className="size-3.5" />{saving ? "Saving…" : "Save"}</Button>
          </div>
          <nav className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-4 pb-2 md:px-8">
            {STEPS.map((s, i) => (
              <button key={s} type="button" onClick={() => setStep(i)} className={`flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] ${i === step ? "bg-hover text-foreground" : "text-secondary hover:bg-hover"}`}>
                <span className={`grid size-5 place-items-center rounded-full text-[10px] ${i < step ? "bg-primary text-primary-foreground" : i === step ? "border border-primary text-primary" : "border border-border text-tertiary"}`}>{i < step ? <Check className="size-3" /> : i + 1}</span>{s}
              </button>
            ))}
          </nav>
          <div className="h-0.5 bg-border-subtle"><div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        </header>

        <div className="mx-auto grid w-full max-w-[1180px] flex-1 gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            {step === 0 && <>
              <Section title="What is it?" body="Customers and Nia see this name and description.">
                <Field label="Service name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Silk press, Antenatal scan, Bridal fitting" /></Field>
                <Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What's included, who it's for, how to prepare…" /></Field>
                <Field label="Group">
                  <Input list="svc-cats" value={form.categoryName} onChange={(e) => set("categoryName", e.target.value)} placeholder="e.g. Hair, Consultations, Scans" />
                  <datalist id="svc-cats">{categories.map((c: { id: string; name: string }) => <option key={c.id} value={c.name} />)}</datalist>
                  {categories.length > 0 && <div className="flex flex-wrap gap-1.5 pt-1">{categories.map((c: { id: string; name: string }) => <button type="button" key={c.id} onClick={() => set("categoryName", c.name)} className={`rounded-full border px-2.5 py-1 text-[11px] ${form.categoryName === c.name ? "border-primary bg-primary text-primary-foreground" : "border-border text-secondary hover:bg-hover"}`}>{c.name}</button>)}</div>}
                </Field>
              </Section>
              <Section title="Where does it happen?">
                <div className="grid gap-2 sm:grid-cols-3">
                  {LOCATIONS.map((l) => (
                    <button key={l.id} type="button" onClick={() => set("locationType", l.id)} className={`rounded-lg border p-3 text-left ${form.locationType === l.id ? "border-primary bg-panel-subtle" : "border-border hover:bg-hover"}`}>
                      <l.icon className="size-4 text-primary" /><p className="mt-2 text-[13px] text-foreground">{l.label}</p><p className="text-[11px] text-tertiary">{l.body}</p>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Who can do this?" body="Nia only offers times for these people. Leave empty for anyone.">
                {staff.length === 0 ? <p className="text-[12px] text-tertiary">No team members yet — add them in Settings → Staff & hours.</p> :
                  <div className="flex flex-wrap gap-2">{staff.map((s: { id: string; name: string; role_title: string | null }) => { const on = form.staffIds.includes(s.id); return (
                    <button key={s.id} type="button" onClick={() => set("staffIds", on ? form.staffIds.filter((x) => x !== s.id) : [...form.staffIds, s.id])} className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-[12px] ${on ? "border-primary bg-panel-subtle text-foreground" : "border-border text-secondary hover:bg-hover"}`}>
                      <span className={`grid size-6 place-items-center rounded-full text-[10px] ${on ? "bg-primary text-primary-foreground" : "bg-hover text-secondary"}`}>{on ? <Check className="size-3" /> : s.name.slice(0, 1)}</span>{s.name}
                    </button>); })}</div>}
              </Section>
              <Section title="Visibility">
                <Toggle label="Show in my store" body="Appears on your public store link." checked={form.visibleInStore} onChange={(v) => set("visibleInStore", v)} />
                <Toggle label="Online booking" body="Nia and customers on your store can book this. Turn off for enquiry-only services (e.g. needs a referral first)." checked={form.onlineBooking} onChange={(v) => set("onlineBooking", v)} />
                <Toggle label="Active" body="Hidden services are kept but not offered anywhere." checked={form.active} onChange={(v) => set("active", v)} />
              </Section>
            </>}

            {step === 1 && <>
              <Section title="Pricing options" body="One price, or several options like “Short / Medium / Long” or “First visit / Follow-up”, each with its own price and time.">
                {form.variants.length === 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Price (£)"><Input type="number" min="0" step="0.01" value={pounds(form.pricePence)} onChange={(e) => set("pricePence", toPence(e.target.value))} placeholder="0 = free" /></Field>
                    <Field label="Duration (minutes)"><Input type="number" min="5" step="5" value={form.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value) || 5)} /></Field>
                    <div className="flex flex-wrap gap-1.5 sm:col-span-2">{DURATIONS.map((d) => <button type="button" key={d} onClick={() => set("durationMinutes", d)} className={`rounded-full border px-2.5 py-1 text-[11px] ${form.durationMinutes === d ? "border-primary bg-primary text-primary-foreground" : "border-border text-secondary hover:bg-hover"}`}>{d < 60 ? `${d} min` : `${d / 60}h`}</button>)}</div>
                  </div>
                ) : (
                  <div className="space-y-2">{form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-[minmax(0,1fr)_6rem_6rem_auto] items-center gap-2">
                      <Input value={v.name} placeholder="Option name" onChange={(e) => set("variants", form.variants.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                      <Input type="number" min="0" step="0.01" value={pounds(v.pricePence)} placeholder="£" onChange={(e) => set("variants", form.variants.map((x, j) => j === i ? { ...x, pricePence: toPence(e.target.value) } : x))} />
                      <Input type="number" min="5" step="5" value={v.durationMinutes} placeholder="min" onChange={(e) => set("variants", form.variants.map((x, j) => j === i ? { ...x, durationMinutes: Number(e.target.value) || 5 } : x))} />
                      <Button variant="tertiary" size="sm" aria-label="Remove option" onClick={() => set("variants", form.variants.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
                    </div>))}
                    <p className="text-[11px] text-tertiary">The cheapest option is shown as the “from” price.</p>
                  </div>
                )}
                <Button variant="secondary" size="sm" onClick={() => set("variants", [...(form.variants.length ? form.variants : [{ name: "Standard", pricePence: form.pricePence, durationMinutes: form.durationMinutes }]), { name: "", pricePence: form.pricePence, durationMinutes: form.durationMinutes }])}><Plus className="size-3.5" />Add pricing option</Button>
              </Section>
              <Section title="Time between bookings" body="Clean-up, notes or travel time blocked after each appointment.">
                <div className="flex flex-wrap gap-1.5">{[0, 5, 10, 15, 30, 45, 60].map((d) => <button type="button" key={d} onClick={() => set("bufferMinutes", d)} className={`rounded-full border px-2.5 py-1 text-[11px] ${form.bufferMinutes === d ? "border-primary bg-primary text-primary-foreground" : "border-border text-secondary hover:bg-hover"}`}>{d ? `${d} min` : "None"}</button>)}</div>
              </Section>
              <Section title="Payment" body="How customers pay when they book. Online card payments aren't switched on yet, so bookings show 'pay in store' until they are.">
                <div className="grid gap-2 sm:grid-cols-3">{([["in_store","Pay in store","Pay at the appointment"],["deposit","Deposit online","Deposit at booking, rest later"],["full","Pay in full online","Full price at booking"]] as const).map(([id,t,b])=><button key={id} type="button" onClick={() => set("paymentMode", id)} className={`rounded-lg border p-3 text-left ${form.paymentMode === id ? "border-primary bg-panel-subtle" : "border-border hover:bg-hover"}`}><span className="block text-[13px] text-foreground">{t}</span><span className="block text-[11px] text-tertiary">{b}</span></button>)}</div>
              </Section>
              <Section title="Deposit" body="Recorded on the booking and collected in person for now.">
                <Field label="Deposit (£)"><Input type="number" min="0" step="0.01" value={pounds(form.depositPence)} onChange={(e) => set("depositPence", toPence(e.target.value))} placeholder="No deposit" /></Field>
              </Section>
            </>}

            {step === 2 && <Section title="Photos" body="Show results, the space or what to expect. The first photo is the cover.">
              <CatalogImages workspaceId={workspaceId} paths={form.imagePaths} onChange={(p) => set("imagePaths", p)} />
            </Section>}

            {step === 3 && <>
              <Section title="Add-ons" body="Optional extras customers can add, like a treatment, a longer session or a report.">
                {form.addons.map((a, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_6rem_6rem_auto] items-center gap-2">
                    <Input value={a.name} placeholder="Add-on name" onChange={(e) => set("addons", form.addons.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <Input type="number" min="0" step="0.01" value={pounds(a.pricePence)} placeholder="£" onChange={(e) => set("addons", form.addons.map((x, j) => j === i ? { ...x, pricePence: toPence(e.target.value) } : x))} />
                    <Input type="number" min="0" step="5" value={a.durationMinutes} placeholder="+min" onChange={(e) => set("addons", form.addons.map((x, j) => j === i ? { ...x, durationMinutes: Number(e.target.value) || 0 } : x))} />
                    <Button variant="tertiary" size="sm" aria-label="Remove add-on" onClick={() => set("addons", form.addons.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={() => set("addons", [...form.addons, { name: "", pricePence: 0, durationMinutes: 0 }])}><Plus className="size-3.5" />Add an add-on</Button>
              </Section>
              <Section title="Intake questions" body="Nia asks these before confirming — e.g. allergies, due date, medical history, measurements.">
                {form.questions.map((q, i) => {
                  const upd = (patch: Partial<typeof q>) => set("questions", form.questions.map((x, j) => j === i ? { ...x, ...patch } : x));
                  return (
                    <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                        <Input value={q.label} placeholder="Question" onChange={(e) => upd({ label: e.target.value })} />
                        <Select value={q.type} onChange={(e) => upd({ type: e.target.value as typeof q.type })}>{QTYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</Select>
                        <Button variant="tertiary" size="sm" aria-label="Remove question" onClick={() => set("questions", form.questions.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button>
                      </div>
                      {(q.type === "single_choice" || q.type === "multi_choice") && <Input value={q.options.join(", ")} placeholder="Options, separated by commas" onChange={(e) => upd({ options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />}
                      <label className="flex items-center gap-2 text-[12px] text-secondary"><input type="checkbox" checked={q.required} onChange={(e) => upd({ required: e.target.checked })} />Required</label>
                    </div>
                  );
                })}
                <Button variant="secondary" size="sm" onClick={() => set("questions", [...form.questions, { label: "", type: "short_text", options: [], required: false }])}><Plus className="size-3.5" />Add a question</Button>
              </Section>
              {form.id && <Section title="Remove service" body="Archived services disappear from your store and Nia. Past bookings stay intact.">
                <Button variant="secondary" size="sm" onClick={async () => { await archive({ data: { id: form.id! } }); await qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Service archived"); navigate({ to: "/services" }); }}><Trash2 className="size-3.5" />Archive service</Button>
              </Section>}
            </>}

            <div className="flex items-center justify-between border-t border-border-subtle pt-4">
              <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
              {step < STEPS.length - 1 ? <Button size="sm" onClick={() => setStep((s) => s + 1)}>Continue</Button> : <Button size="sm" disabled={saving} onClick={() => void submit()}><Check className="size-3.5" />{saving ? "Saving…" : "Save service"}</Button>}
            </div>
          </div>
          <aside className="hidden lg:block"><div className="sticky top-36"><p className="mb-2 text-[11px] uppercase tracking-wide text-tertiary">Store preview</p><PreviewCard form={form} /></div></aside>
        </div>
      </div>
    </AppShell>
  );
}

function PreviewCard({ form }: { form: ServiceInput }) {
  const src = useSignedImages(form.imagePaths);
  const from = form.variants.length ? Math.min(...form.variants.map((v) => v.pricePence)) : form.pricePence;
  const mins = form.variants.length ? Math.min(...form.variants.map((v) => v.durationMinutes)) : form.durationMinutes;
  const cover = form.imagePaths[0] ? src(form.imagePaths[0]) : undefined;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-xs">
      <div className="aspect-[4/3] bg-hover">{cover && <img src={cover} alt="" className="size-full object-cover" />}</div>
      <div className="space-y-2 p-4">
        {form.categoryName && <p className="text-[11px] text-tertiary">{form.categoryName}</p>}
        <p className="text-[15px] text-foreground">{form.name || "Service name"}</p>
        <p className="line-clamp-3 text-[12px] text-secondary">{form.description || "Your description appears here."}</p>
        <div className="flex items-center justify-between pt-1 text-[12px]"><span className="flex items-center gap-1 text-secondary"><Clock3 className="size-3.5" />{mins} min</span><span className="text-foreground">{form.variants.length > 1 ? "from " : ""}{from ? money(from) : "Free"}</span></div>
        <div className="flex flex-wrap gap-1.5">{!form.onlineBooking && <Badge variant="yellow">Enquiry only</Badge>}{!form.visibleInStore && <Badge variant="neutral">Hidden from store</Badge>}{form.questions.length > 0 && <Badge variant="neutral">{form.questions.length} intake question{form.questions.length > 1 ? "s" : ""}</Badge>}</div>
      </div>
    </div>
  );
}
function Section({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  return <section className="space-y-3 rounded-xl border border-border bg-panel p-4 shadow-xs sm:p-5"><div><p className="text-[14px] text-foreground">{title}</p>{body && <p className="mt-0.5 text-[12px] text-tertiary">{body}</p>}</div>{children}</section>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-[11px] text-secondary"><span>{label}</span>{children}</label>; }
function Toggle({ label, body, checked, onChange }: { label: string; body: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-panel-subtle p-3"><div><p className="text-[12px] text-foreground">{label}</p><p className="text-[11px] text-tertiary">{body}</p></div><Switch label={label} checked={checked} onCheckedChange={onChange} /></div>;
}
