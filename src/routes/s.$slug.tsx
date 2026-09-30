import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Clock3, MapPin, MessageCircle, Phone, ShoppingBag, Video, X } from "lucide-react";
import { BookingSheet } from "@/components/StoreBookingSheet";
import { toast } from "sonner";
import { getPublicStore, submitProductRequest } from "@/lib/catalog.functions";
import { money } from "@/lib/time";

export const Route = createFileRoute("/s/$slug")({
  loader: async ({ params }) => {
    const store = await getPublicStore({ data: { slug: params.slug } });
    if (!store) throw notFound();
    return store;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.workspace.name ?? "Store";
    const desc = loaderData?.workspace.tagline ?? `Services and products from ${name}. Book or ask a question any time.`;
    return { meta: [
      { title: `${name} — Store` }, { name: "description", content: desc },
      { property: "og:title", content: `${name} — Store` }, { property: "og:description", content: desc },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: () => <div className="grid min-h-screen place-items-center bg-background p-6 text-center"><div><p className="text-lg text-foreground">Store not found</p><p className="mt-1 text-sm text-secondary">This link may have changed or the store is switched off.</p></div></div>,
  errorComponent: () => <div className="grid min-h-screen place-items-center bg-background p-6 text-sm text-secondary">Something went wrong loading this store.</div>,
  component: Store,
});

type Service = NonNullable<Awaited<ReturnType<typeof getPublicStore>>>["services"][number];
type Product = NonNullable<Awaited<ReturnType<typeof getPublicStore>>>["products"][number];

function Store() {
  const store = Route.useLoaderData();
  const { slug } = Route.useParams();
  const [tab, setTab] = useState<"services" | "products">(store.services.length || !store.products.length ? "services" : "products");
  const [cat, setCat] = useState<string>("all");
  const [picked, setPicked] = useState<Product | null>(null);
  const [booking, setBooking] = useState<Service | null>(null);
  const cats = store.categories.filter((c) => c.kind === (tab === "services" ? "service" : "product"));
  const items = useMemo(() => (tab === "services" ? store.services : store.products).filter((x) => cat === "all" || x.category_id === cat), [tab, cat, store]);
  const chat = (text: string) => store.whatsapp ? `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}` : store.workspace.phone ? `tel:${store.workspace.phone}` : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto max-w-[1120px] px-5 py-10 sm:py-14">
          {store.workspace.logo_url && <img src={store.workspace.logo_url} alt="" className="mb-4 size-14 rounded-lg object-cover" />}
          <h1 className="text-3xl font-medium sm:text-4xl">{store.workspace.name}</h1>
          {store.workspace.tagline && <p className="mt-2 max-w-xl text-secondary">{store.workspace.tagline}</p>}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-secondary">
            {store.workspace.address && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{store.workspace.address}</span>}
            {store.workspace.phone && <a href={`tel:${store.workspace.phone}`} className="flex items-center gap-1.5 hover:text-foreground"><Phone className="size-4" />{store.workspace.phone}</a>}
          </div>
          {chat("Hi! I have a question.") && <a href={chat("Hi! I have a question.")!} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-[14px] text-primary-foreground hover:opacity-90"><MessageCircle className="size-4" />Message us</a>}
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 py-8">
        {store.services.length > 0 && store.products.length > 0 && (
          <div className="mb-5 inline-flex rounded-md border border-border bg-panel p-0.5">
            {(["services", "products"] as const).map((t) => <button key={t} type="button" onClick={() => { setTab(t); setCat("all"); }} className={`rounded px-4 py-1.5 text-[13px] capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-secondary"}`}>{t}</button>)}
          </div>
        )}
        {cats.length > 0 && <div className="mb-6 flex flex-wrap gap-2">{[{ id: "all", name: "All" }, ...cats].map((c) => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`rounded-full border px-3 py-1 text-[12px] ${cat === c.id ? "border-foreground bg-foreground text-background" : "border-border bg-panel text-secondary"}`}>{c.name}</button>)}</div>}

        {items.length === 0 && <p className="py-16 text-center text-secondary">Nothing here yet.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tab === "services" ? store.services.filter((x) => items.includes(x as never)).map((s) => {
            const from = s.variants.length ? Math.min(...s.variants.map((v) => v.price_pence)) : s.price_pence;
            const link = chat(`Hi! I'd like to book ${s.name}.`);
            return (
              <article key={s.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-panel">
                {s.image_urls[0] ? <img src={s.image_urls[0]} alt={s.name} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-hover" />}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="text-[16px]">{s.name}</h2>
                  {s.description && <p className="line-clamp-3 text-[13px] text-secondary">{s.description}</p>}
                  {s.variants.length > 1 && <ul className="space-y-0.5 text-[12px] text-secondary">{s.variants.map((v) => <li key={v.name} className="flex justify-between"><span>{v.name}</span><span>{money(v.price_pence)}</span></li>)}</ul>}
                  <div className="mt-auto flex items-center justify-between pt-2 text-[13px]"><span className="flex items-center gap-1 text-secondary"><Clock3 className="size-3.5" />{s.duration_minutes} min</span><span>{s.variants.length > 1 ? "from " : ""}{from ? money(from) : "Free"}</span></div>
                  {s.location_type === "online" && <span className="flex items-center gap-1.5 text-[12px] text-secondary"><Video className="size-3.5" />Phone or video call</span>}
                  <div className="mt-2 grid gap-2">
                    {s.online_booking && <button type="button" onClick={() => setBooking(s)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary text-[13px] text-primary-foreground hover:opacity-90"><CalendarDays className="size-4" />{s.location_type === "online" ? "Book a call" : "Pick a time"}</button>}
                    {link && <a href={link} target="_blank" rel="noreferrer" className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] ${s.online_booking ? "border border-border text-foreground hover:bg-hover" : "bg-primary text-primary-foreground hover:opacity-90"}`}><MessageCircle className="size-4" />{store.whatsapp ? "Book via WhatsApp" : "Call to book"}</a>}
                  </div>
                </div>
              </article>
            );
          }) : store.products.filter((x) => items.includes(x as never)).map((p) => (
            <article key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-panel">
              {p.image_urls[0] ? <img src={p.image_urls[0]} alt={p.name} className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-hover"><ShoppingBag className="size-8 text-tertiary" /></div>}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="text-[16px]">{p.name}</h2>
                {p.description && <p className="line-clamp-3 text-[13px] text-secondary">{p.description}</p>}
                <div className="mt-auto flex items-baseline gap-2 pt-2 text-[14px]">{money(p.price_pence)}{p.compare_at_pence && p.compare_at_pence > p.price_pence && <span className="text-[12px] text-tertiary line-through">{money(p.compare_at_pence)}</span>}</div>
                <button type="button" disabled={p.fulfilment === "reserve" && !p.in_stock} onClick={() => setPicked(p)} className="mt-2 h-9 rounded-md bg-primary text-[13px] text-primary-foreground hover:opacity-90 disabled:opacity-50">{p.fulfilment === "reserve" ? (p.in_stock ? "Reserve · pay in store" : "Out of stock") : "Enquire"}</button>
              </div>
            </article>
          ))}
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-[12px] text-tertiary">Powered by Pingbase</footer>
      {store.whatsapp && <a href={chat("Hi! I'd like to book an appointment.")!} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-4 text-[14px] text-background shadow-lg hover:opacity-90"><MessageCircle className="size-5" /><span className="hidden sm:inline">Book via WhatsApp</span></a>}
      {booking && <BookingSheet slug={slug} service={booking} onClose={() => setBooking(null)} />}
      {picked && <RequestSheet slug={slug} product={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}

function RequestSheet({ slug, product, onClose }: { slug: string; product: Product; onClose: () => void }) {
  const send = useServerFn(submitProductRequest);
  const [f, setF] = useState({ name: "", phone: "", email: "", note: "", quantity: 1 });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const reserve = product.fulfilment === "reserve";
  const submit = async () => {
    setBusy(true);
    try { await send({ data: { slug, productId: product.id, ...f } }); setDone(true); }
    catch (e) { const msg = e instanceof Error ? e.message : "Couldn't send."; toast.error(msg.includes("[") ? "Please add your name and a phone number or email." : msg); }
    finally { setBusy(false); }
  };
  const inputCls = "h-10 w-full rounded-md border border-border bg-panel px-3 text-[14px] text-foreground focus:border-primary focus:outline-none";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-xl bg-panel p-5 sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between"><div><p className="text-[16px] text-foreground">{reserve ? "Reserve" : "Ask about"} {product.name}</p><p className="text-[12px] text-secondary">{reserve ? `${money(product.price_pence)} each · pay when you collect` : "The team will get back to you."}</p></div><button type="button" onClick={onClose} aria-label="Close"><X className="size-5 text-secondary" /></button></div>
        {done ? <div className="py-8 text-center"><p className="text-foreground">{reserve ? "Reserved — thank you!" : "Enquiry sent — thank you!"}</p><p className="mt-1 text-[13px] text-secondary">The business will confirm with you shortly.</p><button type="button" onClick={onClose} className="mt-5 h-9 rounded-md border border-border px-4 text-[13px]">Close</button></div> : (
          <div className="mt-4 space-y-3">
            <input className={inputCls} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className={inputCls} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input className={inputCls} placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            {reserve && <input className={inputCls} type="number" min={1} max={20} value={f.quantity} onChange={(e) => setF({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) })} />}
            <textarea className={`${inputCls} h-20 py-2`} placeholder={reserve ? "Anything we should know? (size, colour, pickup time)" : "Your question"} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            <button type="button" disabled={busy || !f.name.trim() || (!f.phone.trim() && !f.email.trim())} onClick={() => void submit()} className="h-10 w-full rounded-md bg-primary text-[14px] text-primary-foreground hover:opacity-90 disabled:opacity-50">{busy ? "Sending…" : reserve ? "Reserve item" : "Send enquiry"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
