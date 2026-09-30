import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hydrateStore, type PublicStore } from "./catalog.functions";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function myWorkspace(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("workspace_members").select("workspace_id").eq("user_id", ctx.userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!data) throw new Error("No workspace found.");
  return data.workspace_id as string;
}

export const getWebsiteEditor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ store: PublicStore; heroPath: string | null; published: boolean }> => {
    const w = await myWorkspace(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: raw, error } = await supabaseAdmin.rpc("site_data" as never, { _workspace_id: w } as never);
    if (error || !raw) throw new Error("Couldn't load your website.");
    const { data: ws } = await supabaseAdmin.from("workspaces").select("store_enabled").eq("id", w).single();
    const heroPath = ((raw as { site?: { hero_image?: string | null } }).site?.hero_image) ?? null;
    return { store: await hydrateStore(supabaseAdmin, raw), heroPath, published: Boolean(ws?.store_enabled) };
  });

const siteInput = z.object({
  category: z.enum(["beauty", "shop", "health", "services"]),
  template: z.string().min(1).max(40),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  mode: z.enum(["light", "dark"]),
  radius: z.enum(["square", "rounded", "pill"]),
  sections: z.array(z.object({ id: z.string().max(30), enabled: z.boolean() })).max(20),
  heroImage: z.string().max(400).nullable(),
  headline: z.string().trim().max(120),
  subheadline: z.string().trim().max(240),
  about: z.string().trim().max(3000),
  faqs: z.array(z.object({ q: z.string().trim().min(1).max(200), a: z.string().trim().min(1).max(1500) })).max(30),
  socials: z.object({ instagram: z.string().trim().max(200).default(""), tiktok: z.string().trim().max(200).default(""), facebook: z.string().trim().max(200).default("") }),
  published: z.boolean(),
});
export type SiteInput = z.infer<typeof siteInput>;

export const saveWebsite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => siteInput.parse(d))
  .handler(async ({ data, context }) => {
    const w = await myWorkspace(context);
    if (data.heroImage && !/^https?:/.test(data.heroImage) && !data.heroImage.startsWith(`${w}/`)) throw new Error("Invalid photo.");
    const { error } = await context.supabase.from("website_configs").upsert({
      workspace_id: w, category: data.category, template: data.template, accent: data.accent, mode: data.mode, radius: data.radius,
      sections: data.sections, hero_image: data.heroImage, headline: data.headline || null, subheadline: data.subheadline || null,
      about: data.about || null, faqs: data.faqs, socials: data.socials,
    });
    if (error) throw new Error("Couldn't save your website.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("workspaces").update({ store_enabled: data.published }).eq("id", w);
    return { ok: true };
  });
