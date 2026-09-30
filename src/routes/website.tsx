import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Copy, ExternalLink, Eye, HelpCircle, Image, Info, LayoutGrid, MapPin, MessageCircle, Package, Palette, Pencil, Plus, Scissors, Smartphone, Trash2, Type, UsersRound, X } from "lucide-react";
import { AppShell, Page, PageHeader } from "@/components/AppShell";
import { Badge, Button, IconButton, Input, Switch, Tabs, Textarea } from "@/design-system";
import { CatalogImages, useSignedImages } from "@/components/CatalogImages";
import { SiteRenderer, resolveSite } from "@/components/site/SiteRenderer";
import { SITE_ACCENTS, SITE_FONTS_HREF, SITE_HEADING_FONTS, SITE_SECTIONS, SITE_TEMPLATES, normaliseSections, templateById, type SiteSectionId, type SectionSetting } from "@/config/site-templates";
import type { PublicStore } from "@/lib/catalog.functions";
import { getWebsiteEditor, saveWebsite, type SiteInput } from "@/lib/website.functions";

export const Route = createFileRoute("/website")({
  head: () => ({
    links: [{ rel: "stylesheet", href: SITE_FONTS_HREF }],
    meta: [
      { title: "Website — Pingbase" }, { name: "description", content: "Pick a mobile-first website template for your business and choose which sections to show." },
      { property: "og:title", content: "Website — Pingbase" }, { property: "og:description", content: "Pick a mobile-first website template for your business and choose which sections to show." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WebsitePage,
});

function WebsitePage() {
  const load = useServerFn(getWebsiteEditor);
  const q = useQuery({ queryKey: ["website-editor"], queryFn: () => load() });
  return (
    <AppShell>
      <Page>
        {q.data ? <Editor data={q.data as Data} /> : <PageHeader title="Website" subtitle={q.isError ? "Couldn't load your website." : "Loading…"} />}
      </Page>
    </AppShell>
  );
}

type Data = { store: PublicStore; heroPath: string | null; published: boolean };

function initial(d: Data): SiteInput {
  const r = resolveSite(d.store);
  return {
    category: r.category, template: r.template.id, accent: d.store.site?.accent ?? null, mode: r.mode, radius: r.radius,
    headingFont: (d.store.site as { heading_font?: string | null } | null | undefined)?.heading_font ?? null,
    sections: r.sections, heroImage: d.heroPath, headline: d.store.site?.headline ?? "", subheadline: d.store.site?.subheadline ?? "",
    about: r.about, faqs: r.faqs, socials: { instagram: r.socials["instagram"] ?? "", tiktok: r.socials["tiktok"] ?? "", facebook: r.socials["facebook"] ?? "" },
    published: d.published,
  };
}

function Editor({ data }: { data: Data }) {
  const save = useServerFn(saveWebsite);
  const qc = useQueryClient();
  const [f, setF] = useState<SiteInput>(() => initial(data));
  const [tab, setTab] = useState<"layout" | "look">("layout");
  const [editing, setEditing] = useState<"hero" | SiteSectionId | null>(null);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState(false);
  const set = <K extends keyof SiteInput>(k: K, v: SiteInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const signed = useSignedImages(f.heroImage && !/^https?:/.test(f.heroImage) ? [f.heroImage] : []);
  const url = typeof window !== "undefined" ? `${window.location.origin}/s/${data.store.workspace.slug}` : "";

  const previewStore = useMemo(() => ({
    ...data.store,
    site: {
      category: f.category, template: f.template, accent: f.accent, mode: f.mode, radius: f.radius, sections: f.sections,
      heading_font: f.headingFont,
      hero_image: f.heroImage ? (/^https?:/.test(f.heroImage) ? f.heroImage : signed(f.heroImage) ?? null) : null,
      headline: f.headline || null, subheadline: f.subheadline || null, about: f.about || null, faqs: f.faqs, socials: f.socials,
    },
  }), [data.store, f, signed]);
  const site = useMemo(() => resolveSite(previewStore), [previewStore]);
  const tpl = templateById(f.template);

  const pickTemplate = (id: string) => {
    const t = templateById(id);
    setF((x) => ({ ...x, template: id, accent: null, headingFont: null, radius: t.radius, mode: t.palette.bg.startsWith("#0") ? "dark" : "light" }));
  };
  const move = (i: number, d: -1 | 1) => { const s = [...f.sections]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j]!, s[i]!]; set("sections", s); };

  const onSave = async () => {
    setBusy(true);
    try { await save({ data: f }); await qc.invalidateQueries({ queryKey: ["website-editor"] }); toast.success(f.published ? "Website saved and live" : "Website saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save"); }
    finally { setBusy(false); }
  };

  useEffect(() => { document.body.style.overflow = phone || editing ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [phone, editing]);

  const card = "rounded-lg border border-border bg-panel p-4";
  const label = "mb-1.5 block text-[12px] text-secondary";
  const sectionIcon: Record<SiteSectionId, typeof Info> = { about: Info, services: Scissors, shop: Package, gallery: Image, team: UsersRound, faq: HelpCircle, location: MapPin, contact: MessageCircle };

  return (
    <>
      <PageHeader title="Website" subtitle="A mobile-first website for your business. Pick a style, then choose what to show."
        actions={<div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setPhone(true)}><Eye className="size-3.5" />Preview</Button>
          {data.published && <Button variant="secondary" size="sm" onClick={() => window.open(url, "_blank")}><ExternalLink className="size-3.5" />View</Button>}
          <Button size="sm" disabled={busy} onClick={() => void onSave()}>{busy ? "Saving…" : "Save"}</Button>
        </div>} />

      <div className="grid gap-6 border-t border-border-subtle pt-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-5">
          <Tabs variant="segmented" items={[{ value: "layout", label: "Page layout" }, { value: "look", label: "Look" }]} value={tab} onChange={(value) => setTab(value as "layout" | "look")} />

          {tab === "layout" ? <section className={card}>
            <div className="flex items-start gap-3 border-b border-border-subtle pb-4"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-hover text-secondary"><LayoutGrid className="size-4" /></span><div><p className="text-[14px] text-foreground">Page sections</p><p className="mt-0.5 text-[12px] text-tertiary">Arrange what customers see, edit the words and hide anything you do not need.</p></div></div>
            <ul className="mt-3 space-y-2">
              <SectionRow icon={Image} name="Hero" hint={f.headline || data.store.workspace.name} onEdit={() => setEditing("hero")} />
              {normaliseSections(f.sections, f.sections as SectionSetting[]).map((s, i) => {
                const meta = SITE_SECTIONS.find((x) => x.id === s.id);
                if (!meta) return null;
                const empty = (s.id === "shop" && !data.store.products.length) || (s.id === "services" && !data.store.services.length) || (s.id === "faq" && !f.faqs.length) || (s.id === "team" && !data.store.team.length);
                return <SectionRow key={s.id} icon={sectionIcon[s.id]} name={meta.name} hint={empty && s.enabled ? "Nothing to show yet" : s.enabled ? "Visible on your website" : "Hidden from your website"} enabled={s.enabled} onToggle={(v) => set("sections", f.sections.map((x) => x.id === s.id ? { ...x, enabled: v } : x))} onEdit={() => setEditing(s.id)} onUp={() => move(i, -1)} onDown={() => move(i, 1)} first={i === 0} last={i === f.sections.length - 1} />;
              })}
            </ul>
          </section> : <section className={`${card} space-y-5`}>
            <div><p className="text-[14px] text-foreground">Templates</p><p className="mt-0.5 text-[12px] text-tertiary">Every template works for services, products or both.</p></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SITE_TEMPLATES.map((t) => (
                <button key={t.id} type="button" onClick={() => pickTemplate(t.id)} aria-pressed={f.template === t.id} className={`overflow-hidden rounded-lg border text-left transition-colors ${f.template === t.id ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-border-strong"}`}>
                  <TemplateSwatch id={t.id} />
                  <div className="p-2.5"><p className="flex items-center gap-1.5 text-[13px] text-foreground">{t.name}{f.template === t.id && <Badge variant="cyan">Selected</Badge>}</p><p className="text-[11px] text-tertiary">{t.hint}</p></div>
                </button>
              ))}
            </div>
            <div className="border-t border-border-subtle pt-5"><div className="mb-4 flex items-center gap-2"><Palette className="size-4 text-secondary"/><p className="text-[14px] text-foreground">Style</p></div>
            <div className="space-y-5">
              <AccentPicker value={f.accent ?? tpl.palette.accent} custom={f.accent} onSelect={(hex) => set("accent", hex)} onReset={() => set("accent", null)} />
              <FontPicker value={f.headingFont} fallback={tpl.headingFont} onSelect={(id) => set("headingFont", id)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div><span className={label}>Mode</span><Seg value={f.mode} options={[["light", "Light"], ["dark", "Dark"]]} onChange={(v) => set("mode", v as SiteInput["mode"])} /></div>
                <div><span className={label}>Corners</span><Seg value={f.radius} options={[["square", "Square"], ["rounded", "Soft"], ["pill", "Round"]]} onChange={(v) => set("radius", v as SiteInput["radius"])} /></div>
              </div>
            </div>
            </div>
          </section>}

          <section className={`${card} flex flex-wrap items-center justify-between gap-3`}>
            <div className="min-w-0"><p className="text-[14px] text-foreground">Publish</p><p className="truncate text-[12px] text-tertiary">{url}</p></div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => { void navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy className="size-3.5" />Copy link</Button>
              <label className="flex items-center gap-2 text-[13px] text-foreground"><Switch label="" checked={f.published} onCheckedChange={(v: boolean) => set("published", v)} />Live</label>
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <p className="mb-2 flex items-center gap-1.5 text-[12px] text-secondary"><Smartphone className="size-3.5" />Phone preview · {tpl.name}</p>
            <PhoneFrame><SiteRenderer store={previewStore} site={site} preview /></PhoneFrame>
          </div>
        </aside>
      </div>

      {phone && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-[14px] text-foreground">Preview · {tpl.name}</p><Button variant="tertiary" size="sm" aria-label="Close preview" onClick={() => setPhone(false)}><X className="size-4" /></Button></div>
          <div className="flex-1 overflow-y-auto"><SiteRenderer store={previewStore} site={site} preview /></div>
        </div>
      )}
      {editing && <SectionEditor section={editing} data={data} form={f} set={set} onClose={() => setEditing(null)} />}
    </>
  );
}

function SectionRow({ icon: Icon, name, hint, enabled, onToggle, onEdit, onUp, onDown, first, last }: { icon: typeof Info; name: string; hint: string; enabled?: boolean; onToggle?: (value: boolean) => void; onEdit: () => void; onUp?: () => void; onDown?: () => void; first?: boolean; last?: boolean }) {
  return <li className={`flex items-center gap-2 rounded-lg border border-border p-2.5 ${enabled === false ? "bg-panel-subtle opacity-70" : "bg-panel"}`}>
    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-hover text-secondary"><Icon className="size-4" /></span>
    <span className="min-w-0 flex-1"><span className="block text-[13px] text-foreground">{name}</span><span className="block truncate text-[11px] text-tertiary">{hint}</span></span>
    {onUp && <span className="flex shrink-0 flex-col"><IconButton size="sm" aria-label={`Move ${name} up`} disabled={first} onClick={onUp}><ArrowUp className="size-3.5" /></IconButton><IconButton size="sm" aria-label={`Move ${name} down`} disabled={last} onClick={onDown}><ArrowDown className="size-3.5" /></IconButton></span>}
    <IconButton aria-label={`Edit ${name}`} title={`Edit ${name}`} onClick={onEdit}><Pencil className="size-4" /></IconButton>
    {onToggle && <Switch label="" aria-label={`Show ${name}`} checked={enabled ?? true} onCheckedChange={onToggle} />}
  </li>;
}

function SectionEditor({ section, data, form, set, onClose }: { section: "hero" | SiteSectionId; data: Data; form: SiteInput; set: <K extends keyof SiteInput>(key: K, value: SiteInput[K]) => void; onClose: () => void }) {
  const names: Record<"hero" | SiteSectionId, string> = { hero: "Hero", about: "About", services: "Services & booking", shop: "Shop", gallery: "Gallery", team: "Team", faq: "FAQ", location: "Location & hours", contact: "Contact & WhatsApp" };
  const label = "mb-1.5 block text-[12px] text-secondary";
  const catalogue = section === "services" || section === "shop" || section === "gallery";
  return <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20" onClick={onClose}>
    <aside className="h-full w-full overflow-y-auto bg-panel pb-20 shadow-lg sm:m-2 sm:h-[calc(100%-1rem)] sm:max-w-lg sm:rounded-xl sm:border sm:border-border sm:pb-0" onClick={(event) => event.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-panel px-4 py-4 sm:px-5"><div><p className="text-[15px] text-foreground">{names[section]}</p><p className="text-[11px] text-tertiary">Changes appear in the preview straight away.</p></div><IconButton aria-label="Close editor" onClick={onClose}><X className="size-4" /></IconButton></header>
      <div className="space-y-5 p-4 sm:p-5">
        {section === "hero" && <><div><span className={label}>Main photo</span><CatalogImages workspaceId={data.store.workspace.id} paths={form.heroImage && !/^https?:/.test(form.heroImage) ? [form.heroImage] : []} onChange={(paths) => set("heroImage", paths[0] ?? null)} max={1} /><p className="mt-1 text-[11px] text-tertiary">Without one, Pingbase uses your first service or product photo.</p></div><label className="block"><span className={label}>Headline</span><Input value={form.headline} onChange={(event) => set("headline", event.target.value)} placeholder={data.store.workspace.name} /></label><label className="block"><span className={label}>Subheadline</span><Input value={form.subheadline} onChange={(event) => set("subheadline", event.target.value)} placeholder={data.store.workspace.tagline ?? "A short line about you"} /></label></>}
        {section === "about" && <label className="block"><span className={label}>About your business</span><Textarea className="min-h-44" value={form.about} onChange={(event) => set("about", event.target.value)} placeholder="Tell customers who you are and what makes you different." /></label>}
        {catalogue && <ManagedSection icon={section === "services" ? Scissors : section === "shop" ? Package : Image} title={section === "services" ? "Services come from your catalogue" : section === "shop" ? "Products come from your catalogue" : "Gallery photos come from your services and products"} body="Update the items, descriptions and photos there. Your website preview will use the latest visible content." to="/services" tab={section === "shop" ? "products" : "services"} />}
        {section === "team" && <ManagedSection icon={UsersRound} title="Team comes from workspace settings" body="Names and roles stay consistent across appointments, Nia and your website." to="/settings" settings="team" />}
        {section === "location" && <ManagedSection icon={MapPin} title="Location and hours come from workspace settings" body="Update your address and opening hours once and Pingbase uses them everywhere." to="/settings" settings="workspace" />}
        {section === "contact" && <><label className="block"><span className={label}>Instagram</span><Input value={form.socials.instagram} onChange={(event) => set("socials", { ...form.socials, instagram: event.target.value })} placeholder="@yourbusiness" /></label><label className="block"><span className={label}>TikTok</span><Input value={form.socials.tiktok} onChange={(event) => set("socials", { ...form.socials, tiktok: event.target.value })} placeholder="@yourbusiness" /></label><ManagedSection icon={MessageCircle} title="Phone, email and WhatsApp" body="Business contact details come from workspace settings. WhatsApp uses your connected channel." to="/settings" settings="workspace" /></>}
        {section === "faq" && <div><div className="mb-3 flex items-center justify-between"><span className={label}>Questions and answers</span><Button size="sm" variant="secondary" onClick={() => set("faqs", [...form.faqs, { q: "", a: "" }])}><Plus className="size-3.5" />Add</Button></div><div className="space-y-3">{form.faqs.map((item, index) => <div key={index} className="grid gap-2 rounded-lg border border-border p-3"><div className="flex gap-2"><Input value={item.q} placeholder="Question" onChange={(event) => set("faqs", form.faqs.map((value, i) => i === index ? { ...value, q: event.target.value } : value))} /><IconButton aria-label="Remove question" onClick={() => set("faqs", form.faqs.filter((_, i) => i !== index))}><Trash2 className="size-4" /></IconButton></div><Textarea rows={3} value={item.a} placeholder="Answer" onChange={(event) => set("faqs", form.faqs.map((value, i) => i === index ? { ...value, a: event.target.value } : value))} /></div>)}{!form.faqs.length && <p className="rounded-lg border border-dashed border-border p-6 text-center text-[12px] text-tertiary">No questions yet.</p>}</div></div>}
        <div className="flex justify-end border-t border-border-subtle pt-4"><Button onClick={onClose}>Done</Button></div>
      </div>
    </aside>
  </div>;
}

function ManagedSection({ icon: Icon, title, body, to, tab, settings }: { icon: typeof Info; title: string; body: string; to: "/services" | "/settings"; tab?: "services" | "products"; settings?: "workspace" | "team" }) {
  return <div className="rounded-lg border border-border bg-panel-subtle p-4"><span className="grid size-9 place-items-center rounded-md bg-hover text-primary"><Icon className="size-4" /></span><p className="mt-3 text-[13px] text-foreground">{title}</p><p className="mt-1 text-[12px] leading-relaxed text-secondary">{body}</p><Link to={to} search={to === "/services" ? { tab: tab ?? "services" } : { section: settings ?? "workspace" }}><Button variant="secondary" size="sm" className="mt-4">Manage content<ExternalLink className="size-3.5" /></Button></Link></div>;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[390px] max-w-full rounded-[44px] border-[10px] border-foreground bg-foreground shadow-lg">
      <div className="h-[760px] max-h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden rounded-[34px] bg-panel">{children}</div>
    </div>
  );
}

function Seg({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-panel p-0.5">
      {options.map(([v, l]) => <button key={v} type="button" onClick={() => onChange(v)} className={`rounded px-2.5 py-1 text-[12px] ${value === v ? "bg-primary text-primary-foreground" : "text-secondary"}`}>{l}</button>)}
    </div>
  );
}

/** Small drawn thumbnail in each template's palette and type, no screenshots needed. */
function TemplateSwatch({ id }: { id: string }) {
  const t = templateById(id);
  const p = t.palette;
  return (
    <div className="relative aspect-[4/3] overflow-hidden" style={{ background: p.bg, color: p.text }}>
      <div className="absolute inset-x-2 top-2 h-2 rounded-full" style={{ background: p.nav ?? p.border, opacity: p.nav ? 1 : 0.6 }} />
      <div className="absolute inset-x-2 bottom-2 top-6 overflow-hidden" style={{ borderRadius: t.radius === "square" ? 0 : 8, background: t.blocks?.[0] ?? (t.hero === "split" ? "transparent" : p.surface) }}>
        {t.hero === "split" && <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: p.surface }} />}
        <p className={`absolute bottom-6 left-2 text-[18px] leading-none ${t.lowercase ? "lowercase" : ""}`} style={{ fontFamily: t.headingFont, color: t.hero === "full" || t.hero === "centered" ? p.text : p.text }}>{t.lowercase ? "shine on" : "Aa"}</p>
        <span className="absolute bottom-2 left-2 h-2.5 w-10" style={{ background: p.accent, borderRadius: t.radius === "pill" ? 999 : t.radius === "rounded" ? 4 : 0 }} />
      </div>
    </div>
  );
}
