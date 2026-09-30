import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, CalendarDays, ChevronDown, Clock3, Instagram, Mail, MapPin, MessageCircle, Phone, ShoppingBag, Video } from "lucide-react";
import type { PublicStore } from "@/lib/catalog.functions";
import { templateById, normaliseSections, defaultSections, headingFontStack, type SiteCategoryId, type SiteTemplate, type SectionSetting } from "@/config/site-templates";
import { money } from "@/lib/time";

export type Service = PublicStore["services"][number];
export type Product = PublicStore["products"][number];

export type ResolvedSite = {
  template: SiteTemplate;
  category: SiteCategoryId;
  sections: SectionSetting[];
  accent: string;
  mode: "light" | "dark";
  radius: "square" | "rounded" | "pill";
  hero: string | null;
  headline: string;
  subheadline: string;
  about: string;
  faqs: Array<{ q: string; a: string }>;
  socials: Record<string, string>;
};

export function resolveSite(store: PublicStore): ResolvedSite {
  const c = store.site as (typeof store.site & { heading_font?: string | null }) | null | undefined;
  const category = (c?.category ?? (store.products.length && !store.services.length ? "shop" : "beauty")) as SiteCategoryId;
  const base = templateById(c?.template ?? (category === "shop" ? "bold" : "signature"));
  // A chosen heading face overrides the template's own, everywhere it is used.
  const chosen = headingFontStack(c?.heading_font);
  const template = chosen ? { ...base, headingFont: chosen } : base;
  return {
    template, category,
    sections: normaliseSections(c?.sections, defaultSections(category, store.products.length > 0, store.services.length > 0)),
    accent: c?.accent ?? template.palette.accent,
    mode: (c?.mode as "light" | "dark") ?? (template.palette.bg.startsWith("#0") ? "dark" : "light"),
    radius: (c?.radius as ResolvedSite["radius"]) ?? template.radius,
    hero: c?.hero_image ?? store.services.find((s) => s.image_urls[0])?.image_urls[0] ?? store.products.find((p) => p.image_urls[0])?.image_urls[0] ?? null,
    headline: c?.headline || store.workspace.name,
    subheadline: c?.subheadline || store.workspace.tagline || "",
    about: c?.about ?? "",
    faqs: c?.faqs ?? [],
    socials: c?.socials ?? {},
  };
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

type Props = {
  store: PublicStore;
  site: ResolvedSite;
  onBook?: (s: Service) => void;
  onProduct?: (p: Product) => void;
  /** Rendered inside the editor phone frame: no fixed elements. */
  preview?: boolean;
};

export function SiteRenderer({ store, site, onBook, onProduct, preview }: Props) {
  const t = site.template;
  const darkTemplate = luminance(t.palette.bg) < 0.3;
  // Light templates switched to dark mode use a neutral dark register; dark templates switched to light use paper.
  const p = site.mode === "dark" && !darkTemplate
    ? { ...t.palette, bg: "#101010", surface: "#1A1A1A", text: "#F2F0EC", soft: "#A29E97", border: "#2B2B2B", nav: t.palette.nav ? "#1A1A1A" : undefined, onNav: t.palette.onNav ? "#F2F0EC" : undefined }
    : site.mode === "light" && darkTemplate
      ? { ...t.palette, bg: "#F6F4EF", surface: "#FFFFFF", text: "#141414", soft: "#6B665E", border: "#E3DED4" }
      : t.palette;
  const accent = site.accent;
  const onAccent = luminance(accent) > 0.6 ? "#141414" : "#FFFFFF";
  const r = site.radius === "pill" ? "9999px" : site.radius === "rounded" ? "14px" : "0px";
  const cardR = site.radius === "square" ? "0px" : site.radius === "pill" ? "22px" : "14px";
  const style = {
    "--s-bg": p.bg, "--s-surface": p.surface, "--s-text": p.text, "--s-soft": p.soft, "--s-border": p.border,
    "--s-accent": accent, "--s-on-accent": onAccent, "--s-r": r, "--s-card-r": cardR,
    "--s-head": t.headingFont, "--s-hero": preview ? "620px" : "88svh", "--s-body": t.bodyFont,
    background: p.bg, color: p.text, fontFamily: t.bodyFont,
  } as CSSProperties;

  const chat = (text: string) => store.whatsapp ? `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}` : store.workspace.phone ? `tel:${store.workspace.phone}` : null;
  const on = site.sections.filter((s) => s.enabled).map((s) => s.id);
  const hasShop = on.includes("shop") && store.products.length > 0;
  const hasServices = on.includes("services") && store.services.length > 0;
  const primaryCta = hasServices ? { label: t.lowercase ? "book now" : "Book now", href: "#services" } : hasShop ? { label: t.lowercase ? "shop now" : "Shop now", href: "#shop" } : { label: "Get in touch", href: "#contact" };
  const caps = t.caps ? "uppercase tracking-[0.18em] text-[11px]" : "text-[14px]";
  const H = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
    <h2 className={`${t.lowercase ? "lowercase" : ""} ${className}`} style={{ fontFamily: t.headingFont }}>{children}</h2>
  );
  const Btn = ({ href, children, solid = true, onClick }: { href?: string; children: ReactNode; solid?: boolean; onClick?: () => void }) => {
    const cls = `inline-flex h-11 items-center justify-center gap-2 px-6 font-medium transition-opacity hover:opacity-85 ${caps}`;
    const st: CSSProperties = solid ? { background: accent, color: onAccent, borderRadius: r } : { border: `1px solid currentColor`, borderRadius: r };
    return href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls} style={st}>{children}</a>
      : <button type="button" onClick={onClick} className={cls} style={st}>{children}</button>;
  };

  const nav = (
    <SiteNav store={store} site={site} p={p} r={r} links={[hasServices && ["Services", "#services"], hasShop && ["Shop", "#shop"], on.includes("about") && ["About", "#about"], on.includes("contact") && ["Contact", "#contact"]].filter(Boolean) as [string, string][]} />
  );

  return (
    <div className="@container relative min-h-full w-full overflow-x-clip" style={style}>
      <Hero store={store} site={site} p={p} nav={nav} cta={<Btn href={primaryCta.href}>{primaryCta.label}<ArrowRight className="size-4" /></Btn>} second={chat("Hi! I have a question.") ? <Btn solid={false} href={chat("Hi! I have a question.")!}><MessageCircle className="size-4" />{store.whatsapp ? "WhatsApp" : "Call us"}</Btn> : null} />

      {on.map((id, i) => {
        const block = t.blocks ? t.blocks[i % t.blocks.length] : undefined;
        const wrap = (content: ReactNode, anchor: string) => (
          <section key={id} id={anchor} className="scroll-mt-20 px-5 py-12 @3xl:px-10 @3xl:py-20" style={block ? { background: block, color: luminance(block) > 0.6 ? p.text : "#FFFFFF" } : undefined}>
            <div className="mx-auto max-w-[1180px]">{content}</div>
          </section>
        );
        if (id === "services" && store.services.length) return wrap(
          <>
            <SectionHead t={t} title="Services" count={store.services.length} H={H} />
            <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {store.services.map((s) => {
                const from = s.variants.length ? Math.min(...s.variants.map((v) => v.price_pence)) : s.price_pence;
                const wa = chat(`Hi! I'd like to book ${s.name}.`);
                return (
                  <article key={s.id} className="flex flex-col overflow-hidden" style={{ background: block ? "rgba(255,255,255,0.55)" : p.surface, borderRadius: cardR, border: `1px solid ${block ? "transparent" : p.border}`, color: p.text }}>
                    {s.image_urls[0] && <img src={s.image_urls[0]} alt={s.name} className="aspect-[4/3] w-full object-cover" loading="lazy" />}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className={`text-[17px] leading-tight ${t.lowercase ? "lowercase" : ""}`} style={{ fontFamily: t.headingFont }}>{s.name}</h3>
                        <span className="shrink-0 text-[14px]">{s.variants.length > 1 ? "from " : ""}{from ? money(from) : "Free"}</span>
                      </div>
                      {s.description && <p className="line-clamp-3 text-[13px]" style={{ color: p.soft }}>{s.description}</p>}
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: p.soft }}>
                        <span className="flex items-center gap-1"><Clock3 className="size-3.5" />{s.duration_minutes} min</span>
                        {s.location_type === "online" && <span className="flex items-center gap-1"><Video className="size-3.5" />Phone or video call</span>}
                      </p>
                      <div className="mt-auto grid grid-cols-1 gap-2 pt-2 @md:grid-cols-2">
                        {s.online_booking && <button type="button" onClick={() => onBook?.(s)} className={`inline-flex h-10 items-center justify-center gap-1.5 font-medium ${caps}`} style={{ background: accent, color: onAccent, borderRadius: r }}><CalendarDays className="size-4" />{s.location_type === "online" ? "Book a call" : "Pick a time"}</button>}
                        {wa && <a href={wa} target="_blank" rel="noreferrer" className={`inline-flex h-10 items-center justify-center gap-1.5 ${caps} ${s.online_booking ? "" : "@md:col-span-2"}`} style={{ border: `1px solid ${p.border}`, borderRadius: r }}><MessageCircle className="size-4" />{store.whatsapp ? "Book via WhatsApp" : "Call to book"}</a>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>, "services");
        if (id === "shop" && store.products.length) return wrap(
          <>
            <SectionHead t={t} title={t.lowercase ? "best sellers" : "Shop"} count={store.products.length} H={H} />
            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 @3xl:mx-0 @3xl:grid @3xl:grid-cols-3 @3xl:overflow-visible @3xl:px-0 @5xl:grid-cols-4">
              {store.products.map((pr) => (
                <button key={pr.id} type="button" onClick={() => onProduct?.(pr)} disabled={pr.fulfilment === "reserve" && !pr.in_stock} className="w-[72%] shrink-0 snap-start text-left disabled:opacity-60 @3xl:w-auto">
                  <div className="relative grid aspect-[4/5] place-items-center overflow-hidden" style={{ background: t.id === "bold" ? p.surface : block ? "rgba(255,255,255,0.55)" : p.surface, borderRadius: cardR }}>
                    {pr.image_urls[0] ? <img src={pr.image_urls[0]} alt={pr.name} className="size-full object-cover" loading="lazy" /> : <ShoppingBag className="size-8 opacity-40" />}
                    {pr.compare_at_pence && pr.compare_at_pence > pr.price_pence && <span className="absolute left-3 top-3 px-2 py-0.5 text-[11px]" style={{ background: accent, color: onAccent, borderRadius: r }}>Sale</span>}
                    {pr.fulfilment === "reserve" && !pr.in_stock && <span className="absolute left-3 top-3 bg-white px-2 py-0.5 text-[11px] text-black">Sold out</span>}
                  </div>
                  <p className={`mt-2.5 text-[15px] ${t.lowercase ? "lowercase" : ""}`}>{pr.name}</p>
                  <p className="flex items-baseline gap-2 text-[14px]" style={{ color: block ? undefined : p.soft }}>{money(pr.price_pence)}{pr.compare_at_pence && pr.compare_at_pence > pr.price_pence && <span className="text-[12px] line-through opacity-70">{money(pr.compare_at_pence)}</span>}</p>
                  <p className="mt-1 text-[12px] underline underline-offset-4" style={{ color: block ? undefined : accent === p.bg ? p.text : undefined }}>{pr.fulfilment === "reserve" ? "Reserve · pay in store" : "Enquire"}</p>
                </button>
              ))}
            </div>
          </>, "shop");
        if (id === "about" && (site.about || store.workspace.tagline)) return wrap(
          <div className="grid gap-6 @3xl:grid-cols-[1fr_1.4fr] @3xl:gap-16">
            <H className="text-[34px] leading-[1.02] @3xl:text-[48px]">{t.lowercase ? "our story" : "About us"}</H>
            <p className="whitespace-pre-line text-[16px] leading-relaxed @3xl:text-[18px]" style={{ color: block ? undefined : p.soft }}>{site.about || store.workspace.tagline}</p>
          </div>, "about");
        if (id === "gallery") {
          const imgs = [...store.services.flatMap((s) => s.image_urls), ...store.products.flatMap((x) => x.image_urls)].slice(0, 8);
          if (!imgs.length) return null;
          return wrap(<>
            <SectionHead t={t} title={t.lowercase ? "gallery" : "Gallery"} H={H} />
            <div className="grid grid-cols-2 gap-2 @3xl:grid-cols-4">{imgs.map((src, k) => <img key={src + k} src={src} alt="" loading="lazy" className={`w-full object-cover ${k === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`} style={{ borderRadius: cardR }} />)}</div>
          </>, "gallery");
        }
        if (id === "team" && store.team.length) return wrap(<>
          <SectionHead t={t} title={t.lowercase ? "the team" : "Meet the team"} H={H} />
          <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">{store.team.map((m) => (
            <div key={m.name} className="p-4" style={{ background: block ? "rgba(255,255,255,0.55)" : p.surface, borderRadius: cardR, color: p.text }}>
              <div className="mb-3 grid size-14 place-items-center text-[20px]" style={{ background: accent, color: onAccent, borderRadius: site.radius === "square" ? 0 : 9999, fontFamily: t.headingFont }}>{m.name.charAt(0)}</div>
              <p className="text-[15px]">{m.name}</p>{m.role && <p className="text-[12px]" style={{ color: p.soft }}>{m.role}</p>}
            </div>))}</div>
        </>, "team");
        if (id === "faq" && site.faqs.length) return wrap(<>
          <SectionHead t={t} title={t.lowercase ? "questions" : "Questions"} H={H} />
          <div className="divide-y" style={{ borderTop: `1px solid ${p.border}`, borderBottom: `1px solid ${p.border}`, borderColor: p.border }}>{site.faqs.map((f) => <Faq key={f.q} q={f.q} a={f.a} soft={block ? undefined : p.soft} border={p.border} />)}</div>
        </>, "faq");
        if (id === "location" && (store.workspace.address || store.workspace.opening_hours)) return wrap(
          <div className="grid gap-8 @3xl:grid-cols-2">
            <div>
              <H className="text-[30px] leading-tight @3xl:text-[40px]">{t.lowercase ? "visit us" : "Visit us"}</H>
              {store.workspace.address && <p className="mt-4 flex gap-2 text-[15px]"><MapPin className="mt-0.5 size-4 shrink-0" />{store.workspace.address}</p>}
              {store.workspace.address && <a className="mt-4 inline-block text-[13px] underline underline-offset-4" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent(store.workspace.address)}`}>Get directions</a>}
            </div>
            {store.workspace.opening_hours && <Hours hours={store.workspace.opening_hours} border={p.border} soft={block ? undefined : p.soft} />}
          </div>, "location");
        if (id === "contact") return wrap(
          <div className="text-center">
            <H className="mx-auto max-w-2xl text-[34px] leading-[1.02] @3xl:text-[56px]">{t.lowercase ? "say hello" : "Get in touch"}</H>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {chat("Hi!") && <Btn href={chat("Hi!")!}><MessageCircle className="size-4" />{store.whatsapp ? "Message on WhatsApp" : "Call us"}</Btn>}
              {store.workspace.phone && <Btn solid={false} href={`tel:${store.workspace.phone}`}><Phone className="size-4" />{store.workspace.phone}</Btn>}
              {store.workspace.email && <Btn solid={false} href={`mailto:${store.workspace.email}`}><Mail className="size-4" />Email</Btn>}
            </div>
            {site.socials["instagram"] && <a href={site.socials["instagram"]!.startsWith("http") ? site.socials["instagram"]! : `https://instagram.com/${site.socials["instagram"]!.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1.5 text-[13px]" style={{ color: block ? undefined : p.soft }}><Instagram className="size-4" />{site.socials["instagram"]!.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")}</a>}
          </div>, "contact");
        return null;
      })}

      <footer className="px-5 py-8 text-center text-[12px]" style={{ color: p.soft, borderTop: `1px solid ${p.border}` }}>
        © {store.workspace.name} · <a href="https://pingbase.lovable.app" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">Powered by Pingbase</a>
      </footer>

      {store.whatsapp && !preview && (
        <a href={chat("Hi! I'd like to book.")!} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 px-4 text-[14px] shadow-lg" style={{ background: accent, color: onAccent, borderRadius: 9999 }}>
          <MessageCircle className="size-5" /><span className="hidden sm:inline">Book via WhatsApp</span>
        </a>
      )}
    </div>
  );
}

function SectionHead({ t, title, count, H }: { t: SiteTemplate; title: string; count?: number; H: (p: { children: ReactNode; className?: string }) => ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 @3xl:mb-8">
      <H className={`${t.caps ? "text-[30px] @3xl:text-[44px]" : "text-[28px] @3xl:text-[40px]"} leading-[1.02] tracking-tight`}>{title}</H>
      {count !== undefined && <span className="text-[12px] tabular-nums opacity-60">{String(count).padStart(2, "0")}</span>}
    </div>
  );
}

function SiteNav({ store, site, p, r, links }: { store: PublicStore; site: ResolvedSite; p: SiteTemplate["palette"]; r: string; links: [string, string][] }) {
  const t = site.template;
  const bar = p.nav ?? "transparent";
  const fg = p.onNav ?? (t.hero === "full" || t.hero === "centered" ? "#FFFFFF" : p.text);
  return (
    <nav className="relative z-10 flex items-center justify-between gap-3 px-4 py-2.5" style={{ background: bar, color: fg, borderRadius: p.nav ? (site.radius === "square" ? 0 : t.id === "bold" ? 9999 : 12) : 0 }}>
      <span className="flex min-w-0 items-center gap-2">
        {store.workspace.logo_url && <img src={store.workspace.logo_url} alt="" className="size-7 shrink-0 object-cover" style={{ borderRadius: r }} />}
        <span className={`truncate text-[17px] font-semibold ${t.lowercase ? "lowercase" : ""}`} style={{ fontFamily: t.headingFont }}>{store.workspace.name}</span>
      </span>
      <span className="hidden items-center gap-5 text-[13px] @3xl:flex">{links.map(([l, h]) => <a key={h} href={h} className={t.lowercase ? "lowercase" : ""}>{l}</a>)}</span>
    </nav>
  );
}

function Hero({ store, site, p, nav, cta, second }: { store: PublicStore; site: ResolvedSite; p: SiteTemplate["palette"]; nav: ReactNode; cta: ReactNode; second: ReactNode }) {
  const t = site.template;
  const img = site.hero;
  const H1 = ({ className = "" }: { className?: string }) => <h1 className={`${t.lowercase ? "lowercase" : ""} ${className}`} style={{ fontFamily: t.headingFont }}>{site.headline}</h1>;
  const sub = site.subheadline && <p className={`max-w-xl ${t.id === "bold" ? "text-[22px] italic @3xl:text-[30px]" : "text-[15px] @3xl:text-[18px]"}`} style={t.id === "bold" ? { fontFamily: "'Instrument Serif', serif" } : undefined}>{site.subheadline}</p>;
  const actions = <div className="mt-6 flex flex-wrap gap-2.5">{cta}{second}</div>;

  if (t.hero === "full" || t.hero === "centered") return (
    <header className="relative flex min-h-[var(--s-hero)] flex-col text-white">
      {img ? <img src={img} alt="" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0" style={{ background: p.surface }} />}
      <div className="absolute inset-0" style={{ background: t.hero === "centered" ? "rgba(0,0,0,0.55)" : "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.05) 60%)" }} />
      <div className="relative">{nav}</div>
      <div className={`relative mt-auto px-5 pb-10 @3xl:px-10 @3xl:pb-16 ${t.hero === "centered" ? "my-auto text-center [&>div]:justify-center [&_p]:mx-auto" : ""}`}>
        {t.caps && <p className="mb-3 text-[10px] uppercase tracking-[0.32em] opacity-80">{store.workspace.address?.split(",").slice(-2, -1)[0]?.trim() || "Welcome"}</p>}
        <H1 className={`text-[13cqw] leading-[0.92] tracking-[-0.03em] @3xl:text-[84px] ${t.hero === "centered" ? "font-normal" : "font-semibold"}`} />
        <div className="mt-3 opacity-90">{sub}</div>
        {actions}
      </div>
    </header>
  );
  if (t.hero === "editorial") return (
    <header style={{ borderBottom: `1px solid ${p.border}` }}>
      <div style={{ borderBottom: `1px solid ${p.border}` }}>{nav}</div>
      <div className="px-5 pt-10 @3xl:px-10 @3xl:pt-16">
        <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: site.accent }}>Issue no. 01 · {new Date().getFullYear()}</p>
        <H1 className="mt-4 text-[15cqw] leading-[0.9] tracking-[-0.02em] @3xl:text-[120px]" />
        <div className="mt-4 grid gap-6 pb-8 @3xl:grid-cols-[1.4fr_1fr] @3xl:items-end" style={{ color: p.soft }}>{sub}{actions}</div>
      </div>
      {img && <img src={img} alt="" className="aspect-[4/3] w-full object-cover @3xl:aspect-[21/9]" />}
    </header>
  );
  if (t.hero === "framed") return (
    <header className="p-3 @3xl:p-5">
      <div className="relative flex min-h-[calc(var(--s-hero)*0.9)] flex-col overflow-hidden text-white" style={{ borderRadius: site.radius === "square" ? 0 : 22, background: site.accent }}>
        {img && <img src={img} alt="" className="absolute inset-0 size-full object-cover" />}
        <div className="absolute inset-0" style={{ background: img ? "linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)" : "transparent" }} />
        <div className="relative p-2.5">{nav}</div>
        <div className="relative mt-auto p-5 @3xl:p-10">
          <H1 className="text-[15cqw] font-semibold leading-[0.9] tracking-[-0.03em] @3xl:text-[96px]" />
          <div className="mt-1">{sub}</div>
          {actions}
        </div>
      </div>
    </header>
  );
  if (t.hero === "blocks") return (
    <header className="p-3">
      {nav}
      <div className="mt-2 grid gap-2 @3xl:grid-cols-2">
        <div className="flex flex-col justify-end p-6 @3xl:p-10" style={{ background: t.blocks?.[0], borderRadius: 24, minHeight: 320 }}>
          <H1 className="text-[14cqw] font-extrabold leading-[0.9] tracking-[-0.03em] @3xl:text-[76px]" />
          <div className="mt-3">{sub}</div>{actions}
        </div>
        {img ? <img src={img} alt="" className="aspect-square w-full object-cover @3xl:aspect-auto @3xl:h-full" style={{ borderRadius: 24 }} /> : <div style={{ background: t.blocks?.[1], borderRadius: 24, minHeight: 200 }} />}
      </div>
    </header>
  );
  // split
  return (
    <header>
      <div className={p.nav ? "p-3" : ""} style={p.nav ? undefined : { borderBottom: `1px solid ${p.border}` }}>{nav}</div>
      <div className="grid @3xl:min-h-[var(--s-hero)] @3xl:grid-cols-2">
        <div className="flex flex-col justify-center px-5 py-12 @3xl:px-12">
          <p className="mb-4 text-[11px] uppercase tracking-[0.2em]" style={{ color: p.soft }}>{store.workspace.address?.split(",").slice(-2, -1)[0]?.trim() || store.workspace.name}</p>
          <H1 className={`text-[12cqw] leading-[0.98] tracking-[-0.02em] @3xl:text-[72px] ${t.id === "botanical" ? "font-normal" : "font-semibold"}`} />
          <div className="mt-4" style={{ color: p.soft }}>{sub}</div>
          {actions}
        </div>
        {img ? <img src={img} alt="" className="aspect-[4/3] w-full object-cover @3xl:aspect-auto @3xl:h-full" /> : <div className="aspect-[4/3] @3xl:aspect-auto" style={{ background: p.surface }} />}
      </div>
    </header>
  );
}

function Faq({ q, a, soft, border }: { q: string; a: string; soft?: string | undefined; border: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderColor: border }}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px]">{q}<ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} /></button>
      {open && <p className="whitespace-pre-line pb-4 text-[14px] leading-relaxed" style={{ color: soft }}>{a}</p>}
    </div>
  );
}

const DAYS = [["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"]] as const;
function Hours({ hours, border, soft }: { hours: Record<string, [string, string] | null>; border: string; soft?: string | undefined }) {
  const rows = useMemo(() => DAYS.map(([k, label]) => [label, hours[k] ?? hours[label.toLowerCase()] ?? null] as const), [hours]);
  return (
    <dl className="text-[14px]">
      {rows.map(([d, h]) => <div key={d} className="flex justify-between py-2.5" style={{ borderBottom: `1px solid ${border}` }}><dt>{d}</dt><dd style={{ color: soft }}>{h ? `${h[0]} – ${h[1]}` : "Closed"}</dd></div>)}
    </dl>
  );
}
