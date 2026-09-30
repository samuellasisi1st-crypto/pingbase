import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { SiteRenderer, resolveSite } from "@/components/site/SiteRenderer";
import { SITE_FONTS_HREF } from "@/config/site-templates";
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
    return { links: [{ rel: "stylesheet", href: SITE_FONTS_HREF }], meta: [
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
  const [picked, setPicked] = useState<Product | null>(null);
  const [booking, setBooking] = useState<Service | null>(null);
  const site = useMemo(() => resolveSite(store), [store]);
  return (
    <>
      <SiteRenderer store={store} site={site} onBook={setBooking} onProduct={setPicked} />
      {booking && <BookingSheet slug={slug} service={booking} onClose={() => setBooking(null)} />}
      {picked && <RequestSheet slug={slug} product={picked} onClose={() => setPicked(null)} />}
    </>
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
