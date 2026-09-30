import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Clock3, Copy, ExternalLink, Inbox, Package, Plus, Search, Scissors, ShoppingBag, Store, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, Page, PageHeader } from "@/components/AppShell";
import { CatalogImages, useSignedImages } from "@/components/CatalogImages";
import { Badge, Button, Input, Switch, Textarea } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { getStoreSettings, saveProduct, updateStoreSettings, type ProductInput } from "@/lib/catalog.functions";
import { money } from "@/lib/time";

type Tab = "services" | "products" | "requests" | "store";
export const Route = createFileRoute("/services")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => ({ tab: ["services", "products", "requests", "store"].includes(s["tab"] as string) ? (s["tab"] as Tab) : undefined }),
  head: () => ({ meta: [
    { title: "Catalogue — Pingbase" },
    { name: "description", content: "Manage your services, products and public store link in one catalogue." },
    { property: "og:title", content: "Catalogue — Pingbase" },
    { property: "og:description", content: "Manage your services, products and public store link in one catalogue." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CataloguePage,
});

type Service = { id: string; name: string; description: string | null; price_pence: number; duration_minutes: number; deposit_pence: number; active: boolean; visible_in_store: boolean; online_booking: boolean; image_urls: string[]; category: { name: string } | null; service_variants: { id: string }[] };
type Product = { id: string; name: string; description: string | null; price_pence: number; compare_at_pence: number | null; sku: string | null; stock: number | null; fulfilment: "reserve" | "enquiry"; visible_in_store: boolean; active: boolean; image_urls: string[]; category: { name: string } | null };

function CataloguePage() {
  const { tab = "services" } = Route.useSearch();
  const navigate = useNavigate({ from: "/services" });
  const loadStore = useServerFn(getStoreSettings);
  const store = useQuery({ queryKey: ["store-settings"], queryFn: () => loadStore() });
  const [productEdit, setProductEdit] = useState<Product | "new" | null>(null);
  const tabs: Array<{ id: Tab; label: string; icon: typeof Scissors }> = [
    { id: "services", label: "Services", icon: Scissors }, { id: "products", label: "Products", icon: ShoppingBag },
    { id: "requests", label: "Requests", icon: Inbox }, { id: "store", label: "Store link", icon: Store },
  ];
  const storeUrl = store.data && typeof window !== "undefined" ? `${window.location.origin}/s/${store.data.slug}` : "";

  return <AppShell><Page>
    <PageHeader title="Catalogue" subtitle="Everything customers can book or buy — used by Nia and your public store."
      actions={<>
        {storeUrl && <Button variant="secondary" size="sm" onClick={() => window.open(storeUrl, "_blank")}><ExternalLink className="size-3.5" />View store</Button>}
        {tab === "products" ? <Button size="sm" onClick={() => setProductEdit("new")}><Plus className="size-3.5" />New product</Button>
          : <Button size="sm" onClick={() => navigate({ to: "/services/$serviceId", params: { serviceId: "new" } })}><Plus className="size-3.5" />New service</Button>}
      </>} />
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => <button key={t.id} type="button" onClick={() => navigate({ search: { tab: t.id } })} className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-secondary hover:text-foreground"}`}><t.icon className="size-3.5" />{t.label}</button>)}
    </div>
    {tab === "services" && <ServicesTab />}
    {tab === "products" && <ProductsTab onEdit={setProductEdit} />}
    {tab === "requests" && <RequestsTab />}
    {tab === "store" && store.data && <StoreTab settings={store.data} url={storeUrl} />}
  </Page>
  {productEdit && store.data && <ProductSheet workspaceId={store.data.id} product={productEdit === "new" ? null : productEdit} onClose={() => setProductEdit(null)} />}
  </AppShell>;
}

function Cover({ path, icon: Icon }: { path?: string | undefined; icon: typeof Scissors }) {
  const src = useSignedImages(path ? [path] : []);
  const url = path ? src(path) : undefined;
  return <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-hover">{url ? <img src={url} alt="" className="size-full object-cover" /> : <Icon className="size-4 text-tertiary" />}</span>;
}

function ServicesTab() {
  const [query, setQuery] = useState("");
  const services = useQuery({ queryKey: ["services"], queryFn: async () => {
    const { data, error } = await supabase.from("services").select("*, category:category_id(name), service_variants(id)").eq("archived", false).order("position").order("name");
    if (error) throw error; return (data ?? []) as unknown as Service[];
  } });
  const groups = useMemo(() => {
    const list = (services.data ?? []).filter((s) => `${s.name} ${s.description ?? ""}`.toLowerCase().includes(query.toLowerCase()));
    const m = new Map<string, Service[]>();
    for (const s of list) { const k = s.category?.name ?? "Other"; m.set(k, [...(m.get(k) ?? []), s]); }
    return [...m.entries()].sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));
  }, [services.data, query]);
  return <>
    <div className="relative w-full max-w-md"><Search className="absolute left-2.5 top-2.5 size-3.5 text-tertiary" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="pl-8" /></div>
    {groups.map(([name, list]) => <section key={name} className="space-y-2">
      <p className="text-[12px] text-secondary">{name} <span className="text-tertiary">· {list.length}</span></p>
      <div className="overflow-hidden rounded-lg border border-border bg-panel shadow-xs">{list.map((s) => (
        <Link key={s.id} to="/services/$serviceId" params={{ serviceId: s.id }} className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-0 hover:bg-panel-subtle">
          <Cover path={s.image_urls?.[0]} icon={Scissors} />
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-foreground">{s.name}</span><span className="flex items-center gap-2 text-[11px] text-tertiary"><Clock3 className="size-3" />{s.duration_minutes} min{s.service_variants.length > 1 && ` · ${s.service_variants.length} options`}{s.deposit_pence > 0 && ` · ${money(s.deposit_pence)} deposit`}</span></span>
          <span className="hidden gap-1.5 sm:flex">{!s.online_booking && <Badge variant="yellow">Enquiry only</Badge>}{!s.visible_in_store && <Badge variant="neutral">Not in store</Badge>}</span>
          <span className="w-20 text-right text-[13px] text-foreground">{s.service_variants.length > 1 ? "from " : ""}{s.price_pence ? money(s.price_pence) : "Free"}</span>
          <Badge variant={s.active ? "green" : "neutral"}>{s.active ? "Active" : "Hidden"}</Badge>
        </Link>))}</div>
    </section>)}
    {!services.isLoading && groups.length === 0 && <EmptyState icon={Scissors} title="No services yet" body="Create a service so Nia and your store know what customers can book." action={<Link to="/services/$serviceId" params={{ serviceId: "new" }}><Button size="sm"><Plus className="size-3.5" />New service</Button></Link>} />}
  </>;
}

function ProductsTab({ onEdit }: { onEdit: (p: Product) => void }) {
  const products = useQuery({ queryKey: ["products"], queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*, category:category_id(name)").order("position").order("name");
    if (error) throw error; return (data ?? []) as unknown as Product[];
  } });
  const list = products.data ?? [];
  if (!products.isLoading && !list.length) return <EmptyState icon={Package} title="No products yet" body="Add retail items, packages, gift cards or anything customers can reserve or ask about." />;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{list.map((p) => (
    <button key={p.id} type="button" onClick={() => onEdit(p)} className="flex items-center gap-3 rounded-lg border border-border bg-panel p-3 text-left shadow-xs hover:bg-panel-subtle">
      <Cover path={p.image_urls?.[0]} icon={ShoppingBag} />
      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-foreground">{p.name}</span><span className="block text-[11px] text-tertiary">{p.category?.name ?? "Uncategorised"} · {p.stock === null ? "Stock not tracked" : `${p.stock} in stock`}</span></span>
      <span className="grid justify-items-end gap-1"><span className="text-[13px] text-foreground">{money(p.price_pence)}</span><Badge variant={p.fulfilment === "reserve" ? "green" : "neutral"}>{p.fulfilment === "reserve" ? "Reserve" : "Enquire"}</Badge></span>
    </button>))}</div>;
}

type Req = { id: string; quantity: number; kind: string; customer_name: string; customer_phone: string | null; customer_email: string | null; note: string | null; status: string; created_at: string; product: { name: string; price_pence: number } | null };
function RequestsTab() {
  const qc = useQueryClient();
  const reqs = useQuery({ queryKey: ["product-requests"], queryFn: async () => {
    const { data, error } = await supabase.from("product_reservations").select("*, product:product_id(name,price_pence)").order("created_at", { ascending: false }).limit(200);
    if (error) throw error; return (data ?? []) as unknown as Req[];
  } });
  const setStatus = async (id: string, status: string) => { const { error } = await supabase.from("product_reservations").update({ status }).eq("id", id); if (error) toast.error(error.message); await qc.invalidateQueries({ queryKey: ["product-requests"] }); };
  const list = reqs.data ?? [];
  if (!reqs.isLoading && !list.length) return <EmptyState icon={Inbox} title="No requests yet" body="Reservations and product enquiries from your store link appear here." />;
  return <div className="overflow-hidden rounded-lg border border-border bg-panel shadow-xs">{list.map((r) => (
    <div key={r.id} className="grid gap-2 border-b border-border-subtle px-4 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0"><p className="text-[13px] text-foreground">{r.customer_name} · {r.kind === "reserve" ? `reserved ${r.quantity}× ` : "asked about "}{r.product?.name ?? "a product"}</p>
        <p className="text-[11px] text-tertiary">{[r.customer_phone, r.customer_email].filter(Boolean).join(" · ")} · {new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
        {r.note && <p className="mt-1 text-[12px] text-secondary">“{r.note}”</p>}</div>
      <div className="flex items-center gap-2"><Badge variant={r.status === "pending" ? "yellow" : r.status === "completed" ? "green" : "neutral"}>{r.status}</Badge>
        {r.status === "pending" && <><Button size="sm" variant="secondary" onClick={() => void setStatus(r.id, "confirmed")}>Confirm</Button><Button size="sm" variant="tertiary" onClick={() => void setStatus(r.id, "cancelled")}>Decline</Button></>}
        {r.status === "confirmed" && <Button size="sm" variant="secondary" onClick={() => void setStatus(r.id, "completed")}>Mark collected</Button>}</div>
    </div>))}</div>;
}

function StoreTab({ settings, url }: { settings: { slug: string; store_enabled: boolean; store_tagline: string | null }; url: string }) {
  const qc = useQueryClient();
  const update = useServerFn(updateStoreSettings);
  const [slug, setSlug] = useState(settings.slug);
  const [tagline, setTagline] = useState(settings.store_tagline ?? "");
  const [enabled, setEnabled] = useState(settings.store_enabled);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await update({ data: { slug, tagline, enabled } }); await qc.invalidateQueries({ queryKey: ["store-settings"] }); toast.success("Store updated"); }
    catch (e) { const m = e instanceof Error ? e.message : ""; toast.error(m.includes("[") ? "Use 3–48 lowercase letters, numbers or dashes for the link." : m || "Couldn't save."); } finally { setBusy(false); }
  };
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return <div className="max-w-2xl space-y-4 rounded-xl border border-border bg-panel p-5 shadow-xs">
    <div><p className="text-[14px] text-foreground">Your store link</p><p className="text-[12px] text-tertiary">Share it in your Instagram bio, WhatsApp profile, Google listing or emails.</p></div>
    <div className="flex items-center gap-2 rounded-lg border border-border bg-panel-subtle p-2"><span className="min-w-0 flex-1 truncate px-1 text-[13px] text-foreground">{url}</span>
      <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy className="size-3.5" />Copy</Button></div>
    <label className="grid gap-1.5 text-[11px] text-secondary"><span>Link name</span><div className="flex items-center rounded-md border border-border bg-panel pl-2.5 text-[13px] text-tertiary"><span className="shrink-0">{origin}/s/</span><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="h-9 min-w-0 flex-1 bg-transparent pr-2.5 text-foreground focus:outline-none" /></div></label>
    <label className="grid gap-1.5 text-[11px] text-secondary"><span>Tagline</span><Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Natural hair specialists in Shoreditch" /></label>
    <div className="flex items-center justify-between rounded-lg border border-border bg-panel-subtle p-3"><div><p className="text-[12px] text-foreground">Store is live</p><p className="text-[11px] text-tertiary">Turn off to hide the page from everyone.</p></div><Switch label="Store is live" checked={enabled} onCheckedChange={setEnabled} /></div>
    <Button size="sm" disabled={busy} onClick={() => void save()}><Check className="size-3.5" />{busy ? "Saving…" : "Save store"}</Button>
  </div>;
}

const emptyProduct: ProductInput = { id: null, name: "", description: "", categoryName: "", pricePence: 0, compareAtPence: null, sku: "", stock: null, fulfilment: "reserve", visibleInStore: true, active: true, imagePaths: [] };
function ProductSheet({ workspaceId, product, onClose }: { workspaceId: string; product: Product | null; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveProduct);
  const [f, setF] = useState<ProductInput>(emptyProduct);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF(product ? { id: product.id, name: product.name, description: product.description ?? "", categoryName: product.category?.name ?? "", pricePence: product.price_pence, compareAtPence: product.compare_at_pence, sku: product.sku ?? "", stock: product.stock, fulfilment: product.fulfilment, visibleInStore: product.visible_in_store, active: product.active, imagePaths: product.image_urls ?? [] } : emptyProduct); }, [product]);
  const p = (v: number | null) => (v ? String(v / 100) : "");
  const submit = async () => {
    if (!f.name.trim()) { toast.error("Add a product name."); return; }
    setBusy(true);
    try { await save({ data: f }); await qc.invalidateQueries({ queryKey: ["products"] }); toast.success(f.id ? "Product updated" : "Product created"); onClose(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't save."); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20" onClick={onClose}><aside className="h-full w-full overflow-y-auto bg-panel pb-20 shadow-lg sm:m-2 sm:h-[calc(100%-1rem)] sm:max-w-lg sm:rounded-xl sm:border sm:border-border sm:pb-0" onClick={(e) => e.stopPropagation()}>
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-panel px-5 py-4"><div><p className="text-[15px] text-foreground">{f.id ? "Edit product" : "New product"}</p><p className="text-[11px] text-tertiary">Shown in your store and known to Nia.</p></div><Button variant="tertiary" size="sm" onClick={onClose} title="Close"><X className="size-4" /></Button></header>
    <div className="space-y-4 p-5">
      <CatalogImages workspaceId={workspaceId} paths={f.imagePaths} onChange={(imagePaths) => setF({ ...f, imagePaths })} />
      <L label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Curl cream 250ml, Prenatal vitamins, Gift card" /></L>
      <L label="Description"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></L>
      <L label="Category"><Input value={f.categoryName} onChange={(e) => setF({ ...f, categoryName: e.target.value })} placeholder="e.g. Hair care, Gift cards" /></L>
      <div className="grid grid-cols-2 gap-3"><L label="Price (£)"><Input type="number" min="0" step="0.01" value={p(f.pricePence)} onChange={(e) => setF({ ...f, pricePence: Math.round(Number(e.target.value || 0) * 100) })} /></L><L label="Was (£, optional)"><Input type="number" min="0" step="0.01" value={p(f.compareAtPence)} onChange={(e) => setF({ ...f, compareAtPence: e.target.value ? Math.round(Number(e.target.value) * 100) : null })} /></L></div>
      <div className="grid grid-cols-2 gap-3"><L label="SKU (optional)"><Input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} /></L><L label="Stock (blank = don't track)"><Input type="number" min="0" value={f.stock ?? ""} onChange={(e) => setF({ ...f, stock: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })} /></L></div>
      <div className="grid gap-1.5"><span className="text-[11px] text-secondary">How customers get it</span><div className="grid grid-cols-2 gap-2">
        {([["reserve", "Reserve, pay in store", "They reserve it and pay when collecting."], ["enquiry", "Enquire", "They send a question; you reply."]] as const).map(([id, t, b]) => <button key={id} type="button" onClick={() => setF({ ...f, fulfilment: id })} className={`rounded-lg border p-3 text-left ${f.fulfilment === id ? "border-primary bg-panel-subtle" : "border-border hover:bg-hover"}`}><p className="text-[12px] text-foreground">{t}</p><p className="text-[11px] text-tertiary">{b}</p></button>)}
      </div></div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-panel-subtle p-3"><p className="text-[12px] text-foreground">Show in store</p><Switch label="Show in store" checked={f.visibleInStore} onCheckedChange={(visibleInStore) => setF({ ...f, visibleInStore })} /></div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-panel-subtle p-3"><p className="text-[12px] text-foreground">Active</p><Switch label="Active" checked={f.active} onCheckedChange={(active) => setF({ ...f, active })} /></div>
      <Button className="w-full" disabled={busy} onClick={() => void submit()}><Check className="size-4" />{busy ? "Saving…" : "Save product"}</Button>
    </div>
  </aside></div>;
}
function L({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-[11px] text-secondary"><span>{label}</span>{children}</label>; }
