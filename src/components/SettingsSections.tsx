import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Plus, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Input, Select, Switch, Textarea } from "@/design-system";
import { Avatar } from "@/design-system/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createWhatsAppTemplate, listWhatsAppTemplates } from "@/lib/channels.functions";
import defaultLogo from "@/assets/workspace-logo.jpg.asset.json";

/* ---------- shared layout (matches reference: big title, divider, label rows) ---------- */
export function SettingsFrame({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:px-10 md:pb-12 md:pt-10">
      <header className="flex items-center justify-between gap-3 border-b border-border-subtle pb-6">
        <h1 className="text-2xl text-foreground">{title}</h1>
        {actions}
      </header>
      <div className="pt-7">{children}</div>
    </div>
  );
}
export function FieldRow({ label, hint, aside, children }: { label: string; hint?: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <div className="max-w-xl py-3">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[13px] text-foreground">{label}</p>{hint && <p className="mt-0.5 text-[12px] text-secondary">{hint}</p>}</div>
        {aside}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
const Divider = () => <div className="my-4 max-w-xl border-t border-border-subtle" />;

function useWorkspaceId() {
  return useQuery({ queryKey: ["ws-id"], queryFn: async () => {
    const { data } = await supabase.from("workspace_members").select("workspace_id").limit(1).single();
    return data?.workspace_id as string;
  } });
}

function LogoPicker({ src, fallback, onFile }: { src?: string | null; fallback: ReactNode; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative size-20 shrink-0">
      {src ? <img src={src} alt="" className="size-20 rounded-full object-cover" /> : fallback}
      <button type="button" onClick={() => ref.current?.click()} title="Upload" className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full border border-border bg-panel text-secondary shadow-xs hover:text-foreground"><Upload className="size-3.5" /></button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}
async function toDataUrl(f: File) {
  if (f.size > 400_000) throw new Error("Please use an image under 400 KB.");
  return await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
}

/* ---------- Profile ---------- */
export function ProfileSection() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const uid = session?.user.id;
  const p = useQuery({ queryKey: ["my-profile", uid], enabled: !!uid, queryFn: async () => (await supabase.from("profiles").select("*").eq("id", uid!).maybeSingle()).data });
  const [first, setFirst] = useState(""); const [last, setLast] = useState(""); const [phone, setPhone] = useState(""); const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => { if (p.data) { const [f, ...l] = (p.data.full_name ?? "").split(" "); setFirst(f ?? ""); setLast(l.join(" ")); setPhone(p.data.phone ?? ""); setAvatar(p.data.avatar_url); } }, [p.data]);
  const save = async () => {
    const { error } = await supabase.from("profiles").update({ full_name: `${first} ${last}`.trim() || null, phone: phone || null, avatar_url: avatar }).eq("id", uid!);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["my-profile"] });
  };
  const email = session?.user.email ?? "";
  return (
    <SettingsFrame title="General">
      <FieldRow label="Profile picture" hint="Shown beside your messages in Pingbase." aside={<LogoPicker src={avatar} fallback={<Avatar name={`${first} ${last}`.trim() || email} size="xl" />} onFile={async (f) => { try { setAvatar(await toDataUrl(f)); } catch (e) { toast.error((e as Error).message); } }} />} />
      <FieldRow label="First name"><Input value={first} onChange={(e) => setFirst(e.target.value)} /></FieldRow>
      <FieldRow label="Last name"><Input value={last} onChange={(e) => setLast(e.target.value)} /></FieldRow>
      <FieldRow label="Email address"><Input value={email} disabled /></FieldRow>
      <FieldRow label="Phone number" hint="Optional"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7…" /></FieldRow>
      <div className="flex max-w-xl justify-end pt-4"><Button onClick={save}>Save</Button></div>
    </SettingsFrame>
  );
}

export function NotificationsSection() {
  return (
    <SettingsFrame title="Notifications">
      <FieldRow label="Customer asks for a person" hint="Get notified when Nia hands a conversation to your team." aside={<Toggle initial />} />
      <Divider />
      <FieldRow label="New booking" hint="A booking was created, moved or cancelled." aside={<Toggle initial />} />
      <Divider />
      <FieldRow label="Payment received" hint="A customer paid a deposit or balance." aside={<Toggle initial={false} />} />
      <p className="max-w-xl pt-3 text-[11px] text-tertiary">Notifications appear inside Pingbase. Email alerts are coming soon.</p>
    </SettingsFrame>
  );
}

export function SecuritySection() {
  const { session } = useAuth();
  const reset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(session?.user.email ?? "", { redirectTo: `${window.location.origin}/auth` });
    if (error) toast.error(error.message); else toast.success("Check your email for a password reset link.");
  };
  return (
    <SettingsFrame title="Security">
      <FieldRow label="Password" hint="We'll email you a secure link to set a new password." aside={<Button size="sm" variant="secondary" onClick={reset}>Change password</Button>} />
      <Divider />
      <FieldRow label="Sign out everywhere" hint="End your session on every device." aside={<Button size="sm" variant="secondary" onClick={() => supabase.auth.signOut({ scope: "global" })}>Sign out</Button>} />
    </SettingsFrame>
  );
}

/* ---------- Workspace (merged with business details) ---------- */
export function WorkspaceSection() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["workspace-settings"], queryFn: async () => {
    const [ws, biz, agents] = await Promise.all([
      supabase.from("workspaces").select("*").limit(1).single(),
      supabase.from("business_settings").select("*").maybeSingle(),
      supabase.from("ai_agents").select("id,enabled"),
    ]);
    if (ws.error) throw ws.error;
    return { ws: ws.data, biz: biz.data, agents: agents.data ?? [] };
  } });
  const [f, setF] = useState({ name: "", timezone: "Europe/London", logo: null as string | null, address: "", phone: "", email: "", currency: "GBP", ai: true });
  useEffect(() => { const d = q.data; if (d) setF({ name: d.ws.name, timezone: d.ws.timezone, logo: d.ws.logo_url, address: d.biz?.address ?? "", phone: d.biz?.phone ?? "", email: d.biz?.email ?? "", currency: d.biz?.currency ?? "GBP", ai: d.agents.some((a) => a.enabled) }); }, [q.data]);
  if (!q.data) return <SettingsFrame title="Workspace"><p className="text-[12px] text-secondary">Loading…</p></SettingsFrame>;
  const id = q.data.ws.id;
  const save = async () => {
    const r1 = await supabase.from("workspaces").update({ name: f.name.trim() || q.data!.ws.name, timezone: f.timezone, logo_url: f.logo }).eq("id", id);
    const r2 = await supabase.from("business_settings").update({ legal_name: f.name.trim(), address: f.address || null, phone: f.phone || null, email: f.email || null, currency: f.currency }).eq("workspace_id", id);
    const r3 = await supabase.from("ai_agents").update({ enabled: f.ai }).eq("workspace_id", id);
    const err = r1.error ?? r2.error ?? r3.error;
    if (err) { toast.error(err.message); return; }
    toast.success("Workspace saved");
    qc.invalidateQueries({ queryKey: ["workspace-settings"] }); qc.invalidateQueries({ queryKey: ["workspace"] });
  };
  return (
    <SettingsFrame title="Workspace">
      <FieldRow label="Workspace logo" hint="Shown at the top of your navigation." aside={<LogoPicker src={f.logo || defaultLogo.url} fallback={null} onFile={async (file) => { try { setF({ ...f, logo: await toDataUrl(file) }); } catch (e) { toast.error((e as Error).message); } }} />} />
      <FieldRow label="Workspace name" hint="Your business name. Nia uses it when speaking to customers."><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FieldRow>
      <FieldRow label="Time zone" hint="Used for bookings, reminders and automations.">
        <Select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}>{["Europe/London", "Europe/Dublin", "Europe/Paris", "America/New_York", "Africa/Lagos"].map((t) => <option key={t}>{t}</option>)}</Select>
      </FieldRow>
      <Divider />
      <FieldRow label="Business address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Street, city, postcode" /></FieldRow>
      <div className="grid max-w-xl gap-x-3 sm:grid-cols-2">
        <FieldRow label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></FieldRow>
        <FieldRow label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></FieldRow>
      </div>
      <FieldRow label="Currency"><Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{["GBP", "EUR", "USD", "NGN"].map((c) => <option key={c}>{c}</option>)}</Select></FieldRow>
      <Divider />
      <FieldRow label="AI replies" hint="Switch on to let your AI agents answer customers." aside={<Switch label="AI replies" checked={f.ai} onCheckedChange={(v: boolean) => setF({ ...f, ai: v })} />} />
      <div className="flex max-w-xl justify-end pt-2"><Button onClick={save}>Save</Button></div>
      <Divider />
      <FieldRow label="Delete workspace" hint="Permanently remove this workspace and all its conversations. Contact support to do this." />
      <Button variant="destructive" size="sm" disabled>Delete workspace</Button>
    </SettingsFrame>
  );
}

/* ---------- Team members (real people with access) ---------- */
export function TeamMembersSection() {
  const ws = useWorkspaceId();
  const q = useQuery({ queryKey: ["team", ws.data], enabled: !!ws.data, queryFn: async () => {
    const { data, error } = await supabase.rpc("workspace_team" as never, { _workspace_id: ws.data } as never);
    if (error) throw error;
    return (data ?? []) as unknown as { user_id: string; role: string; email: string | null; full_name: string | null; avatar_url: string | null; joined_at: string }[];
  } });
  return (
    <SettingsFrame title="Team members" actions={<Button size="sm" variant="secondary" onClick={() => toast.info("Inviting teammates is coming soon.")}><Plus className="size-3.5" />Invite</Button>}>
      <p className="mb-4 text-[12px] text-secondary">People who can sign in to this workspace and reply to customers.</p>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] bg-panel-subtle px-4 py-2.5 text-[11px] text-secondary sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"><span>Name</span><span>Role</span><span className="hidden sm:block">Joined</span></div>
        {(q.data ?? []).map((m) => (
          <div key={m.user_id} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center border-t border-border-subtle px-4 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
            <span className="flex min-w-0 items-center gap-3">{m.avatar_url ? <img src={m.avatar_url} alt="" className="size-8 rounded-full object-cover" /> : <Avatar name={m.full_name || m.email || "?"} size="sm" />}<span className="min-w-0"><span className="block truncate text-[13px] text-foreground">{m.full_name || m.email}</span>{m.full_name && <span className="block truncate text-[11px] text-tertiary">{m.email}</span>}</span></span>
            <span><Badge variant={m.role === "owner" ? "cyan" : "neutral"} className="capitalize">{m.role}</Badge></span>
            <span className="hidden text-[12px] text-secondary sm:block">{new Date(m.joined_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        ))}
        {q.isLoading && <p className="border-t border-border-subtle px-4 py-6 text-[12px] text-secondary">Loading…</p>}
      </div>
    </SettingsFrame>
  );
}

/* ---------- WhatsApp templates ---------- */
export function TemplatesSection({ onConnect }: { onConnect: () => void }) {
  const list = useServerFn(listWhatsAppTemplates);
  const create = useServerFn(createWhatsAppTemplate);
  const qc = useQueryClient();
  const t = useQuery({ queryKey: ["wa-templates"], queryFn: () => list() });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "UTILITY" as "UTILITY" | "MARKETING", language: "en_GB", body: "" });
  const [busy, setBusy] = useState(false);
  const rows = (t.data?.templates ?? []).filter((x) => x.name.includes(search.toLowerCase()));
  const noAccount = t.data && !t.data.ok && /No WhatsApp/i.test(t.data.error ?? "");
  const submit = async () => {
    setBusy(true);
    try {
      const r = await create({ data: { ...form, name: form.name.trim(), body: form.body.trim() } });
      if (r.ok) { toast.success(`Template submitted — ${r.status.toLowerCase()}`); setOpen(false); qc.invalidateQueries({ queryKey: ["wa-templates"] }); }
      else toast.error(r.error);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const tone = (s: string) => (s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : "yellow") as "green" | "red" | "yellow";
  return (
    <SettingsFrame title="WhatsApp templates" actions={!noAccount && <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-3.5" />New template</Button>}>
      <p className="text-[14px] text-foreground">Manage WhatsApp templates</p>
      <p className="mt-0.5 text-[12px] text-secondary">Pre-approved messages let you reach customers after the 24-hour reply window closes.</p>
      <div className="relative mt-4 max-w-md"><Search className="absolute left-2.5 top-2.5 size-3.5 text-tertiary" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8" /></div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] bg-panel-subtle px-4 py-2.5 text-[11px] text-secondary sm:grid-cols-[minmax(0,1fr)_8rem_8rem_6rem]"><span>Name</span><span>Status</span><span className="hidden sm:block">Category</span><span>Language</span></div>
        {noAccount ? (
          <div className="grid place-items-center border-t border-border-subtle px-4 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-hover text-tertiary"><MessageCircle className="size-6" /></span>
            <p className="mt-4 text-[14px] text-foreground">Add a WhatsApp account first</p>
            <p className="mt-1 text-[12px] text-secondary">Connect a WhatsApp number to use templates.</p>
            <button type="button" onClick={onConnect} className="mt-4 text-[12px] text-primary hover:underline">Add WhatsApp account</button>
          </div>
        ) : t.isLoading ? <p className="border-t border-border-subtle px-4 py-6 text-[12px] text-secondary">Loading templates…</p>
          : t.data && !t.data.ok ? <p className="border-t border-border-subtle px-4 py-6 text-[12px] text-red-strong">{t.data.error}</p>
          : rows.length === 0 ? <p className="border-t border-border-subtle px-4 py-10 text-center text-[12px] text-secondary">No templates yet.</p>
          : rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] items-center border-t border-border-subtle px-4 py-3 text-[12px] sm:grid-cols-[minmax(0,1fr)_8rem_8rem_6rem]">
              <span className="truncate text-foreground">{r.name}</span>
              <span><Badge variant={tone(r.status)} className="capitalize">{r.status.toLowerCase()}</Badge></span>
              <span className="hidden capitalize text-secondary sm:block">{r.category.toLowerCase()}</span>
              <span className="text-secondary">{r.language}</span>
            </div>
          ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20" onClick={() => setOpen(false)}>
          <aside className="h-full w-full overflow-y-auto bg-panel shadow-lg sm:m-2 sm:h-[calc(100%-1rem)] sm:max-w-lg sm:rounded-xl sm:border sm:border-border" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-border-subtle px-5 py-4"><p className="text-[15px] text-foreground">New template</p><Button variant="tertiary" size="sm" onClick={() => setOpen(false)}><X className="size-4" /></Button></header>
            <div className="space-y-4 p-5">
              <FieldRow label="Name" hint="Lowercase letters, numbers and underscores."><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} placeholder="booking_reminder" /></FieldRow>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as "UTILITY" })}><option value="UTILITY">Utility</option><option value="MARKETING">Marketing</option></Select></FieldRow>
                <FieldRow label="Language"><Select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}><option value="en_GB">English (UK)</option><option value="en_US">English (US)</option></Select></FieldRow>
              </div>
              <FieldRow label="Message" hint="Meta reviews every template, usually within minutes."><Textarea className="min-h-40" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Hi! Just a reminder about your appointment tomorrow." /></FieldRow>
              <div className="flex justify-end"><Button disabled={busy || !form.name || !form.body} onClick={submit}>{busy ? "Submitting…" : "Submit for approval"}</Button></div>
            </div>
          </aside>
        </div>
      )}
    </SettingsFrame>
  );
}

/* ---------- uploaded files (used inside Files & knowledge) ---------- */
export type WsFile = { id: string; name: string; path: string | null; mime: string | null; size_bytes: number; folder: string | null; created_at: string };
export function useWorkspaceFiles() {
  return useQuery({ queryKey: ["ws-files"], queryFn: async () => ((await supabase.from("workspace_files").select("*").order("created_at", { ascending: false })).data ?? []) as WsFile[] });
}
export async function uploadWorkspaceFile(file: File, folder: string | null, uid?: string) {
  const { data: m } = await supabase.from("workspace_members").select("workspace_id").limit(1).single();
  if (!m) throw new Error("No workspace found");
  const path = `${m.workspace_id}/files/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const up = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const { error } = await supabase.from("workspace_files").insert({ workspace_id: m.workspace_id, name: file.name, path, mime: file.type, size_bytes: file.size, folder, uploaded_by: uid ?? null });
  if (error) throw error;
}
export async function openWorkspaceFile(f: WsFile) {
  if (!f.path) return;
  const { data, error } = await supabase.storage.from("attachments").createSignedUrl(f.path, 120);
  if (error) { toast.error(error.message); return; }
  window.open(data.signedUrl, "_blank");
}
export async function deleteWorkspaceFile(f: WsFile) {
  if (f.path) await supabase.storage.from("attachments").remove([f.path]);
  const { error } = await supabase.from("workspace_files").delete().eq("id", f.id);
  if (error) throw error;
}

function Toggle({ initial }: { initial: boolean }) { const [v, setV] = useState(initial); return <Switch label="Toggle" checked={v} onCheckedChange={setV} />; }
