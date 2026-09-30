import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Eye, Plus, Smartphone, Trash2, X } from "lucide-react";
import { AppShell, Page, PageHeader } from "@/components/AppShell";
import { Badge, Button, Input, Switch, Textarea } from "@/design-system";
import { CatalogImages, useSignedImages } from "@/components/CatalogImages";
import { SiteRenderer, resolveSite } from "@/components/site/SiteRenderer";
import { DEFAULT_TEMPLATE, SITE_CATEGORIES, SITE_FONTS_HREF, SITE_SECTIONS, SITE_TEMPLATES, defaultSections, normaliseSections, templateById, type SiteCategoryId } from "@/config/site-templates";
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
        {q.data ? <Editor data={q.data} /> : <PageHeader title="Website" subtitle={q.isError ? "Couldn't load your website." : "Loading…"} />}
      </Page>
    </AppShell>
  );
}

type Data = Awaited<ReturnType<typeof getWebsiteEditor>>;

function initial(d: Data): SiteInput {
  const r = resolveSite(d.store);
  return {
    category: r.category, template: r.template.id, accent: d.store.site?.accent ?? null, mode: r.mode, radius: r.radius,
    sections: r.sections, heroImage: d.heroPath, headline: d.store.site?.headline ?? "", subheadline: d.store.site?.subheadline ?? "",
    about: r.about, faqs: r.faqs, socials: { instagram: r.socials["instagram"] ?? "", tiktok: r.socials["tiktok"] ?? "", facebook: r.socials["facebook"] ?? "" },
    published: d.published,
  };
}

function Editor({ data }: { data: Data }) {
  const save = useServerFn(saveWebsite);
  const qc = useQueryClient();
  const [f, setF] = useState<SiteInput>(() => initial(data));
  const [cat, setCat] = useState<SiteCategoryId>(f.category as SiteCategoryId);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState(false);
  const set = <K extends keyof SiteInput>(k: K, v: SiteInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const signed = useSignedImages(f.heroImage && !/^https?:/.test(f.heroImage) ? [f.heroImage] : []);
  const url = typeof window !== "undefined" ? `${window.location.origin}/s/${data.store.workspace.slug}` : "";

  const previewStore = useMemo(() => ({
    ...data.store,
    site: {
      category: f.category, template: f.template, accent: f.accent, mode: f.mode, radius: f.radius, sections: f.sections,
      hero_image: f.heroImage ? (/^https?:/.test(f.heroImage) ? f.heroImage : signed[0] ?? null) : null,
      headline: f.headline || null, subheadline: f.subheadline || null, about: f.about || null, faqs: f.faqs, socials: f.socials,
    },
  }), [data.store, f, signed]);
  const site = useMemo(() => resolveSite(previewStore), [previewStore]);
  const tpl = templateById(f.template);

  const pickTemplate = (id: string) => {
    const t = templateById(id);
    setF((x) => ({ ...x, template: id, accent: null, radius: t.radius, mode: t.palette.bg.startsWith("#0") ? "dark" : "light", category: cat,
      sections: x.category === cat ? x.sections : defaultSections(cat, data.store.products.length > 0, data.store.services.length > 0) }));
  };
  const move = (i: number, d: -1 | 1) => { const s = [...f.sections]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j]!, s[i]!]; set("sections", s); };

  const onSave = async () => {
    setBusy(true);
    try { await save({ data: f }); await qc.invalidateQueries({ queryKey: ["website-editor"] }); toast.success(f.published ? "Website saved and live" : "Website saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save"); }
    finally { setBusy(false); }
  };

  useEffect(() => { document.body.style.overflow = phone ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [phone]);

  const templates = SITE_TEMPLATES.filter((t) => t.categories.includes(cat));
  const card = "rounded-lg border border-border bg-panel p-4";
  const label = "mb-1.5 block text-[12px] text-secondary";

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
          <section className={card}>
            <p className="text-[14px] text-foreground">1. What kind of business?</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SITE_CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`rounded-lg border p-3 text-left ${cat === c.id ? "border-primary bg-panel-subtle" : "border-border hover:bg-hover"}`}>
                  <span className="block text-[13px] text-foreground">{c.name}</span><span className="block text-[11px] text-tertiary">{c.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={card}>
            <div className="flex items-center justify-between"><p className="text-[14px] text-foreground">2. Pick a template</p><span className="text-[11px] text-tertiary">{templates.length} for {SITE_CATEGORIES.find((c) => c.id === cat)?.name}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {templates.map((t) => (
                <button key={t.id} type="button" onClick={() => pickTemplate(t.id)} className={`overflow-hidden rounded-lg border text-left ${f.template === t.id ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-border-strong"}`}>
                  <TemplateSwatch id={t.id} />
                  <div className="p-2.5"><p className="flex items-center gap-1.5 text-[13px] text-foreground">{t.name}{DEFAULT_TEMPLATE[cat] === t.id && <Badge variant="neutral">Suggested</Badge>}</p><p className="text-[11px] text-tertiary">{t.hint}</p></div>
                </button>
              ))}
            </div>
          </section>

          <section className={card}>
            <p className="text-[14px] text-foreground">3. Sections</p>
            <p className="text-[12px] text-tertiary">Turn off anything you don't need. With the shop off, customers won't see products at all.</p>
            <ul className="mt-3 divide-y divide-border-subtle">
              {normaliseSections(f.sections, f.sections).map((s, i) => {
                const meta = SITE_SECTIONS.find((x) => x.id === s.id)!;
                const empty = (s.id === "shop" && !data.store.products.length) || (s.id === "services" && !data.store.services.length) || (s.id === "faq" && !f.faqs.length) || (s.id === "team" && !data.store.team.length);
                return (
                  <li key={s.id} className="flex items-center gap-2 py-2">
                    <div className="flex flex-col"><button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="text-tertiary hover:text-foreground"><ArrowUp className="size-3.5" /></button><button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="text-tertiary hover:text-foreground"><ArrowDown className="size-3.5" /></button></div>
                    <span className="min-w-0 flex-1 text-[13px] text-foreground">{meta.name}{empty && s.enabled && <span className="ml-2 text-[11px] text-tertiary">Nothing to show yet</span>}</span>
                    <Switch checked={s.enabled} onCheckedChange={(v: boolean) => set("sections", f.sections.map((x) => x.id === s.id ? { ...x, enabled: v } : x))} aria-label={`Show ${meta.name}`} />
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={`${card} space-y-4`}>
            <p className="text-[14px] text-foreground">4. Look & words</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><span className={label}>Brand colour</span><div className="flex items-center gap-2"><input type="color" value={f.accent ?? tpl.palette.accent} onChange={(e) => set("accent", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-border bg-panel" />{f.accent && <button type="button" className="text-[11px] text-secondary underline" onClick={() => set("accent", null)}>Reset</button>}</div></div>
              <div><span className={label}>Mode</span><Seg value={f.mode} options={[["light", "Light"], ["dark", "Dark"]]} onChange={(v) => set("mode", v as SiteInput["mode"])} /></div>
              <div><span className={label}>Corners</span><Seg value={f.radius} options={[["square", "Square"], ["rounded", "Soft"], ["pill", "Round"]]} onChange={(v) => set("radius", v as SiteInput["radius"])} /></div>
            </div>
            <div><span className={label}>Main photo</span><CatalogImages workspaceId={data.store.workspace.id} paths={f.heroImage && !/^https?:/.test(f.heroImage) ? [f.heroImage] : []} onChange={(p) => set("heroImage", p[0] ?? null)} max={1} /><p className="mt-1 text-[11px] text-tertiary">No photo? We use your first service or product photo.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className={label}>Headline</span><Input value={f.headline} onChange={(e) => set("headline", e.target.value)} placeholder={data.store.workspace.name} /></label>
              <label><span className={label}>Subheadline</span><Input value={f.subheadline} onChange={(e) => set("subheadline", e.target.value)} placeholder={data.store.workspace.tagline ?? "A short line about you"} /></label>
            </div>
            <label className="block"><span className={label}>About</span><Textarea rows={4} value={f.about} onChange={(e) => set("about", e.target.value)} placeholder="Tell customers who you are and what makes you different." /></label>
            <label className="block"><span className={label}>Instagram</span><Input value={f.socials.instagram} onChange={(e) => set("socials", { ...f.socials, instagram: e.target.value })} placeholder="@yourbusiness" /></label>
            <div>
              <div className="flex items-center justify-between"><span className={label}>FAQs</span><Button size="sm" variant="tertiary" onClick={() => set("faqs", [...f.faqs, { q: "", a: "" }])}><Plus className="size-3.5" />Add</Button></div>
              <div className="space-y-2">{f.faqs.map((x, i) => (
                <div key={i} className="grid gap-2 rounded-md border border-border-subtle p-2">
                  <div className="flex gap-2"><Input value={x.q} placeholder="Question" onChange={(e) => set("faqs", f.faqs.map((y, j) => j === i ? { ...y, q: e.target.value } : y))} /><Button variant="tertiary" size="sm" aria-label="Remove" onClick={() => set("faqs", f.faqs.filter((_, j) => j !== i))}><Trash2 className="size-3.5" /></Button></div>
                  <Textarea rows={2} value={x.a} placeholder="Answer" onChange={(e) => set("faqs", f.faqs.map((y, j) => j === i ? { ...y, a: e.target.value } : y))} />
                </div>))}</div>
            </div>
          </section>

          <section className={`${card} flex flex-wrap items-center justify-between gap-3`}>
            <div className="min-w-0"><p className="text-[14px] text-foreground">Publish</p><p className="truncate text-[12px] text-tertiary">{url}</p></div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => { void navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy className="size-3.5" />Copy link</Button>
              <label className="flex items-center gap-2 text-[13px] text-foreground"><Switch checked={f.published} onCheckedChange={(v: boolean) => set("published", v)} />Live</label>
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
    </>
  );
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
