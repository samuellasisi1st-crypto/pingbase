import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function myWorkspace(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase
    .from("workspace_members").select("workspace_id").eq("user_id", ctx.userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!data) throw new Error("No workspace found.");
  return data.workspace_id as string;
}

const money = z.number().int().min(0).max(100_000_000);
const serviceInput = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).default(""),
  categoryName: z.string().trim().max(60).default(""),
  pricePence: money,
  durationMinutes: z.number().int().min(5).max(1440),
  bufferMinutes: z.number().int().min(0).max(240),
  depositPence: money,
  locationType: z.enum(["in_person", "at_customer", "online"]),
  visibleInStore: z.boolean(),
  onlineBooking: z.boolean(),
  paymentMode: z.enum(["in_store", "deposit", "full"]).default("in_store"),
  active: z.boolean(),
  imagePaths: z.array(z.string().max(400)).max(8),
  staffIds: z.array(z.string().uuid()).max(100),
  variants: z.array(z.object({ name: z.string().trim().min(1).max(80), pricePence: money, durationMinutes: z.number().int().min(5).max(1440) })).max(20),
  addons: z.array(z.object({ name: z.string().trim().min(1).max(80), pricePence: money, durationMinutes: z.number().int().min(0).max(600) })).max(30),
  questions: z.array(z.object({
    label: z.string().trim().min(1).max(200),
    type: z.enum(["short_text", "long_text", "single_choice", "multi_choice", "yes_no", "date"]),
    options: z.array(z.string().trim().min(1).max(80)).max(20),
    required: z.boolean(),
  })).max(30),
});
export type ServiceInput = z.infer<typeof serviceInput>;

async function categoryId(db: any, workspaceId: string, name: string, kind: "service" | "product") {
  if (!name) return null;
  const { data: found } = await db.from("catalog_categories").select("id").eq("workspace_id", workspaceId).eq("kind", kind).ilike("name", name).maybeSingle();
  if (found) return found.id as string;
  const { data, error } = await db.from("catalog_categories").insert({ workspace_id: workspaceId, name, kind }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export const getServiceEditor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const w = await myWorkspace(context);
    const [{ data: staff }, { data: categories }] = await Promise.all([
      db.from("staff").select("id,name,role_title").eq("workspace_id", w).eq("active", true).order("name"),
      db.from("catalog_categories").select("id,name").eq("workspace_id", w).eq("kind", "service").order("name"),
    ]);
    if (data.id === "new") return { workspaceId: w, staff: staff ?? [], categories: categories ?? [], service: null };
    const [{ data: s }, { data: variants }, { data: addons }, { data: questions }, { data: links }] = await Promise.all([
      db.from("services").select("*").eq("id", data.id).eq("workspace_id", w).maybeSingle(),
      db.from("service_variants").select("*").eq("service_id", data.id).order("position"),
      db.from("service_addons").select("*").eq("service_id", data.id).order("position"),
      db.from("service_questions").select("*").eq("service_id", data.id).order("position"),
      db.from("staff_services").select("staff_id").eq("service_id", data.id),
    ]);
    if (!s) throw new Error("Service not found.");
    const cat = (categories ?? []).find((c: any) => c.id === s.category_id);
    const service: ServiceInput = {
      id: s.id, name: s.name, description: s.description ?? "", categoryName: cat?.name ?? "",
      pricePence: s.price_pence, durationMinutes: s.duration_minutes, bufferMinutes: s.buffer_minutes, depositPence: s.deposit_pence,
      locationType: s.location_type as ServiceInput["locationType"], visibleInStore: s.visible_in_store, onlineBooking: s.online_booking, paymentMode: ((s as { payment_mode?: string }).payment_mode ?? "in_store") as ServiceInput["paymentMode"], active: s.active,
      imagePaths: s.image_urls ?? [], staffIds: (links ?? []).map((l: any) => l.staff_id),
      variants: (variants ?? []).map((v: any) => ({ name: v.name, pricePence: v.price_pence, durationMinutes: v.duration_minutes })),
      addons: (addons ?? []).map((a: any) => ({ name: a.name, pricePence: a.price_pence, durationMinutes: a.duration_minutes })),
      questions: (questions ?? []).map((q: any) => ({ label: q.label, type: q.type, options: q.options ?? [], required: q.required })),
    };
    return { workspaceId: w, staff: staff ?? [], categories: categories ?? [], service };
  });

export const saveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => serviceInput.parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const w = await myWorkspace(context);
    // The cheapest option becomes the headline "from" price shown to customers and Nia.
    const cheapest = data.variants.length ? [...data.variants].sort((a, b) => a.pricePence - b.pricePence)[0]! : null;
    const row = {
      workspace_id: w, name: data.name, description: data.description || null,
      category_id: await categoryId(db, w, data.categoryName, "service"),
      price_pence: cheapest?.pricePence ?? data.pricePence,
      duration_minutes: cheapest?.durationMinutes ?? data.durationMinutes,
      buffer_minutes: data.bufferMinutes, deposit_pence: data.depositPence, location_type: data.locationType, payment_mode: data.paymentMode,
      visible_in_store: data.visibleInStore, online_booking: data.onlineBooking, active: data.active, image_urls: data.imagePaths,
    };
    let id = data.id;
    if (id) {
      const { error } = await db.from("services").update(row).eq("id", id).eq("workspace_id", w);
      if (error) throw error;
    } else {
      const { data: created, error } = await db.from("services").insert(row).select("id").single();
      if (error) throw error;
      id = created.id as string;
    }
    const sid = id!;
    await Promise.all([
      db.from("service_variants").delete().eq("service_id", sid),
      db.from("service_addons").delete().eq("service_id", sid),
      db.from("service_questions").delete().eq("service_id", sid),
      db.from("staff_services").delete().eq("service_id", sid),
    ]);
    const inserts = [];
    if (data.variants.length) inserts.push(db.from("service_variants").insert(data.variants.map((v, i) => ({ workspace_id: w, service_id: sid, name: v.name, price_pence: v.pricePence, duration_minutes: v.durationMinutes, position: i }))));
    if (data.addons.length) inserts.push(db.from("service_addons").insert(data.addons.map((a, i) => ({ workspace_id: w, service_id: sid, name: a.name, price_pence: a.pricePence, duration_minutes: a.durationMinutes, position: i }))));
    if (data.questions.length) inserts.push(db.from("service_questions").insert(data.questions.map((q, i) => ({ workspace_id: w, service_id: sid, label: q.label, type: q.type, options: q.options, required: q.required, position: i }))));
    if (data.staffIds.length) inserts.push(db.from("staff_services").insert(data.staffIds.map((staff_id) => ({ workspace_id: w, service_id: sid, staff_id }))));
    for (const r of await Promise.all(inserts)) if (r.error) throw r.error;
    return { id: sid };
  });

export const archiveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const w = await myWorkspace(context);
    const { error } = await context.supabase.from("services").update({ archived: true, active: false, visible_in_store: false }).eq("id", data.id).eq("workspace_id", w);
    if (error) throw error;
    return { ok: true };
  });

const productInput = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).default(""),
  categoryName: z.string().trim().max(60).default(""),
  pricePence: money,
  compareAtPence: money.nullable(),
  sku: z.string().trim().max(60).default(""),
  stock: z.number().int().min(0).max(1_000_000).nullable(),
  fulfilment: z.enum(["reserve", "enquiry"]),
  visibleInStore: z.boolean(),
  active: z.boolean(),
  imagePaths: z.array(z.string().max(400)).max(8),
});
export type ProductInput = z.infer<typeof productInput>;

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const w = await myWorkspace(context);
    const row = {
      workspace_id: w, name: data.name, description: data.description || null,
      category_id: await categoryId(db, w, data.categoryName, "product"),
      price_pence: data.pricePence, compare_at_pence: data.compareAtPence, sku: data.sku || null, stock: data.stock,
      fulfilment: data.fulfilment, visible_in_store: data.visibleInStore, active: data.active, image_urls: data.imagePaths,
    };
    if (data.id) {
      const { error } = await db.from("products").update(row).eq("id", data.id).eq("workspace_id", w);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: created, error } = await db.from("products").insert(row).select("id").single();
    if (error) throw error;
    return { id: created.id as string };
  });

export const getStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const w = await myWorkspace(context);
    const { data } = await context.supabase.from("workspaces").select("id,name,slug,store_enabled,store_tagline").eq("id", w).single();
    return data as { id: string; name: string; slug: string; store_enabled: boolean; store_tagline: string | null };
  });

export const updateStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/, "Use 3–48 lowercase letters, numbers or dashes."),
    tagline: z.string().trim().max(160).default(""),
    enabled: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const w = await myWorkspace(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taken } = await supabaseAdmin.from("workspaces").select("id").eq("slug", data.slug).neq("id", w).maybeSingle();
    if (taken) throw new Error("That link is already taken — try another.");
    const { error } = await supabaseAdmin.from("workspaces").update({ slug: data.slug, store_tagline: data.tagline || null, store_enabled: data.enabled }).eq("id", w);
    if (error) throw error;
    return { ok: true };
  });

/* ------------------------------- Public store ------------------------------- */

type PublicStore = {
  workspace: { id: string; name: string; slug: string; logo_url: string | null; tagline: string | null; address: string | null; phone: string | null };
  categories: Array<{ id: string; name: string; kind: string }>;
  services: Array<{ id: string; name: string; description: string | null; price_pence: number; duration_minutes: number; deposit_pence: number; category_id: string | null; location_type: string; image_urls: string[]; online_booking: boolean; payment_mode: string; variants: Array<{ name: string; price_pence: number; duration_minutes: number }>; addons: Array<{ name: string; price_pence: number }> }>;
  products: Array<{ id: string; name: string; description: string | null; price_pence: number; compare_at_pence: number | null; image_urls: string[]; fulfilment: "reserve" | "enquiry"; category_id: string | null; in_stock: boolean }>;
  whatsapp: string | null;
};

export const getPublicStore = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(60) }).parse(d))
  .handler(async ({ data }): Promise<PublicStore | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store, error } = await supabaseAdmin.rpc("public_store" as never, { _slug: data.slug } as never);
    if (error || !store) return null;
    const s = store as unknown as Omit<PublicStore, "whatsapp">;
    // Images live in private storage; hand out signed links that last a day.
    const paths = [...s.services.flatMap((x) => x.image_urls ?? []), ...s.products.flatMap((x) => x.image_urls ?? [])].filter((p) => !/^https?:/.test(p));
    const signed = new Map<string, string>();
    if (paths.length) {
      const { data: urls } = await supabaseAdmin.storage.from("attachments").createSignedUrls(paths, 60 * 60 * 24);
      for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
    }
    const fix = (list: string[]) => (list ?? []).map((p) => (/^https?:/.test(p) ? p : signed.get(p))).filter(Boolean) as string[];
    const { data: wa } = await supabaseAdmin.from("channel_connections").select("config,status").eq("workspace_id", s.workspace.id).eq("channel", "whatsapp").maybeSingle();
    const waNumber = wa?.status === "CONNECTED" ? String((wa.config as { display_phone_number?: string } | null)?.display_phone_number ?? "").replace(/\D/g, "") || null : null;
    return {
      ...s,
      workspace: { ...s.workspace, logo_url: s.workspace.logo_url && /^https?:/.test(s.workspace.logo_url) ? s.workspace.logo_url : null },
      services: s.services.map((x) => ({ ...x, image_urls: fix(x.image_urls) })),
      products: s.products.map((x) => ({ ...x, image_urls: fix(x.image_urls) })),
      whatsapp: waNumber,
    };
  });

export const submitProductRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    slug: z.string().trim().min(1).max(60),
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(30).default(""),
    email: z.string().trim().email().max(200).or(z.literal("")).default(""),
    note: z.string().trim().max(1000).default(""),
  }).refine((v) => v.phone || v.email, { message: "Add a phone number or email so the business can reach you." }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ws } = await supabaseAdmin.from("workspaces").select("id").eq("slug", data.slug).eq("store_enabled", true).maybeSingle();
    if (!ws) throw new Error("This store isn't available.");
    const { data: p } = await supabaseAdmin.from("products").select("id,fulfilment,stock,active,visible_in_store").eq("id", data.productId).eq("workspace_id", ws.id).maybeSingle();
    if (!p || !p.active || !p.visible_in_store) throw new Error("This item isn't available.");
    if (p.fulfilment === "reserve" && p.stock !== null && p.stock < data.quantity) throw new Error("Sorry, there isn't enough in stock.");
    const { error } = await supabaseAdmin.from("product_reservations").insert({
      workspace_id: ws.id, product_id: p.id, quantity: data.quantity, kind: p.fulfilment,
      customer_name: data.name, customer_phone: data.phone || null, customer_email: data.email || null, note: data.note || null,
    });
    if (error) throw new Error("Couldn't send your request. Please try again.");
    return { ok: true, kind: p.fulfilment };
  });
