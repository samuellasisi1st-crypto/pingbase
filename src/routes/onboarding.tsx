import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, Input } from "@/design-system";
import { useAuth } from "@/hooks/useAuth";
import { completeOnboarding, joinWorkspace } from "@/lib/concierge.functions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your business — Pingbase" },
      { name: "description", content: "Tell Pingbase about your business so your AI assistant can start taking bookings." },
      { property: "og:title", content: "Set up your business — Pingbase" },
      { property: "og:description", content: "Tell Pingbase about your business so your AI assistant can start taking bookings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Onboarding() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const join = useServerFn(joinWorkspace);
  const finish = useServerFn(completeOnboarding);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", address: "", open: "09:00", close: "18:00", days: [1, 2, 3, 4, 5, 6], service: "", minutes: "60", price: "", staff: "" });
  const set = (k: keyof typeof f, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/auth" }); return; }
    join({ data: undefined }).then((w) => { if (w.onboarded) navigate({ to: "/" }); }).catch(() => undefined);
  }, [loading, session, navigate, join]);

  const steps = [
    { title: "Your business", ok: f.name.trim().length >= 2, body: (
      <div className="grid gap-3">
        <Field label="Business name"><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Bloom Nail Studio" /></Field>
        <Field label="Phone (optional)"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Address (optional)"><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
      </div>) },
    { title: "Opening hours", ok: f.days.length > 0 && f.open < f.close, body: (
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">{DAYS.map((d, i) => { const on = f.days.includes(i); return <button key={d} type="button" onClick={() => set("days", on ? f.days.filter((x) => x !== i) : [...f.days, i].sort())} className={`min-h-10 min-w-12 rounded-lg border px-3 text-[13px] ${on ? "border-primary bg-blue-soft text-primary" : "border-border text-secondary hover:bg-hover"}`}>{d}</button>; })}</div>
        <div className="grid grid-cols-2 gap-3"><Field label="Opens"><Input type="time" value={f.open} onChange={(e) => set("open", e.target.value)} /></Field><Field label="Closes"><Input type="time" value={f.close} onChange={(e) => set("close", e.target.value)} /></Field></div>
      </div>) },
    { title: "Your first service", ok: f.service.trim().length >= 2 && Number(f.minutes) >= 5 && f.price !== "" && Number(f.price) >= 0, body: (
      <div className="grid gap-3">
        <Field label="Service name"><Input value={f.service} onChange={(e) => set("service", e.target.value)} placeholder="e.g. Gel manicure" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Length (minutes)"><Input type="number" min={5} value={f.minutes} onChange={(e) => set("minutes", e.target.value)} /></Field><Field label="Price (£)"><Input type="number" min={0} step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field></div>
        <p className="text-[12px] text-tertiary">You can add more services later.</p>
      </div>) },
    { title: "Who takes bookings?", ok: f.staff.trim().length >= 1, body: (
      <div className="grid gap-3">
        <Field label="Staff member's name"><Input value={f.staff} onChange={(e) => set("staff", e.target.value)} placeholder="Your name, or a team member" /></Field>
        <p className="text-[12px] text-tertiary">They'll be bookable during your opening hours. Add your team later in Settings.</p>
      </div>) },
  ];
  const cur = steps[step];

  const submit = async () => {
    setSaving(true);
    try {
      await finish({ data: { name: f.name, phone: f.phone, address: f.address, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London", hours: { open: f.open, close: f.close, days: f.days }, service: { name: f.service, minutes: Number(f.minutes), pricePence: Math.round(Number(f.price) * 100) }, staffName: f.staff } });
      await qc.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("You're all set up");
      navigate({ to: "/" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save your setup."); }
    finally { setSaving(false); }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-app px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <p className="text-[11px] uppercase tracking-wide text-tertiary">Step {step + 1} of {steps.length}</p>
        <h1 className="mt-1 text-2xl text-foreground">{cur.title}</h1>
        <div className="mt-2 mb-5 flex gap-1">{steps.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-hover"}`} />)}</div>
        {cur.body}
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="tertiary" size="sm" disabled={step === 0 || saving} onClick={() => setStep(step - 1)}>Back</Button>
          {step < steps.length - 1
            ? <Button size="sm" disabled={!cur.ok} onClick={() => setStep(step + 1)}>Continue</Button>
            : <Button size="sm" disabled={!cur.ok || saving} onClick={submit}>{saving ? "Saving…" : "Finish setup"}</Button>}
        </div>
      </Card>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-[12px] text-secondary">{label}{children}</label>;
}
