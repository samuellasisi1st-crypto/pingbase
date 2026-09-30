/**
 * Website template catalogue. One list: each template belongs to one or more
 * categories, so a business picks a category, then a template, then toggles sections.
 * Every template renders the same business data through `SiteRenderer`.
 */

export const SITE_CATEGORIES = [
  { id: "beauty", name: "Beauty, hair & fashion", hint: "Salons, lashes, nails, makeup, barbers, stylists" },
  { id: "shop", name: "Shops & products", hint: "Skincare, cosmetics, fashion and anything you sell" },
  { id: "health", name: "Health & clinics", hint: "Clinics, OBGYN, physio, therapy, dental" },
  { id: "services", name: "Studios & services", hint: "Fitness, wellness, tutors, consultants" },
] as const;
export type SiteCategoryId = (typeof SITE_CATEGORIES)[number]["id"];

export const SITE_SECTIONS = [
  { id: "about", name: "About" },
  { id: "services", name: "Services & booking" },
  { id: "shop", name: "Shop (products)" },
  { id: "gallery", name: "Gallery" },
  { id: "team", name: "Team" },
  { id: "faq", name: "FAQ" },
  { id: "location", name: "Location & hours" },
  { id: "contact", name: "Contact & WhatsApp" },
] as const;
export type SiteSectionId = (typeof SITE_SECTIONS)[number]["id"];
export type SectionSetting = { id: SiteSectionId; enabled: boolean };

export type HeroStyle = "full" | "editorial" | "framed" | "centered" | "split" | "blocks";
export type SiteTemplate = {
  id: string;
  name: string;
  hint: string;
  categories: SiteCategoryId[];
  source: "bookwan" | "pingbase";
  hero: HeroStyle;
  headingFont: string;
  bodyFont: string;
  /** Lowercase display type (onsko-style). */
  lowercase?: boolean;
  /** Uppercase tracked labels and buttons (Bookwan editorial register). */
  caps?: boolean;
  radius: "square" | "rounded" | "pill";
  palette: { bg: string; surface: string; text: string; soft: string; border: string; accent: string; onAccent: string; nav?: string | undefined; onNav?: string | undefined };
  /** Colours the Playful template rotates through for section blocks. */
  blocks?: string[];
};

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: "signature", name: "Signature", hint: "Dark, media-first, soft pills", categories: ["beauty", "services"], source: "bookwan",
    hero: "full", headingFont: "'Bricolage Grotesque', sans-serif", bodyFont: "'Manrope', sans-serif", radius: "pill",
    palette: { bg: "#0E0E0E", surface: "#181818", text: "#F5F2EC", soft: "#A8A29A", border: "#2A2A2A", accent: "#F5F2EC", onAccent: "#0E0E0E" },
  },
  {
    id: "editorial", name: "Editorial", hint: "Magazine type, paper and rules", categories: ["beauty", "health"], source: "bookwan",
    hero: "editorial", headingFont: "'Playfair Display', serif", bodyFont: "'Inter', sans-serif", radius: "square", caps: true,
    palette: { bg: "#F5F1E8", surface: "#FBF8F2", text: "#1B1814", soft: "#6D655B", border: "#D9D1C3", accent: "#B7241C", onAccent: "#FFFFFF" },
  },
  {
    id: "boutique", name: "Boutique", hint: "Warm, rounded, hospitality", categories: ["beauty", "services"], source: "bookwan",
    hero: "framed", headingFont: "'Fraunces', serif", bodyFont: "'DM Sans', sans-serif", radius: "pill",
    palette: { bg: "#F7EFE6", surface: "#FFF9F3", text: "#3A2A20", soft: "#8A7465", border: "#E8D9CA", accent: "#B4593A", onAccent: "#FFFFFF" },
  },
  {
    id: "noir", name: "Noir", hint: "Dark and luxe with gold", categories: ["beauty"], source: "bookwan",
    hero: "centered", headingFont: "'Cormorant Garamond', serif", bodyFont: "'Inter', sans-serif", radius: "square", caps: true,
    palette: { bg: "#0B0B0B", surface: "#141414", text: "#EFE9DF", soft: "#9B9285", border: "#2A261F", accent: "#CEA96A", onAccent: "#0B0B0B" },
  },
  {
    id: "studio", name: "Studio", hint: "Swiss grid, gallery first", categories: ["beauty", "health", "services"], source: "bookwan",
    hero: "split", headingFont: "'Space Grotesk', sans-serif", bodyFont: "'Inter', sans-serif", radius: "square",
    palette: { bg: "#FFFFFF", surface: "#F4F4F2", text: "#111111", soft: "#6B6B6B", border: "#E4E4E0", accent: "#1F4BFF", onAccent: "#FFFFFF" },
  },
  {
    id: "playful", name: "Playful", hint: "Bold colour blocks, social", categories: ["beauty", "services"], source: "bookwan",
    hero: "blocks", headingFont: "'Syne', sans-serif", bodyFont: "'DM Sans', sans-serif", radius: "rounded",
    palette: { bg: "#DCC6FF", surface: "#FFFFFF", text: "#2A0F52", soft: "#5B4285", border: "#C4A8F2", accent: "#3A1470", onAccent: "#F4ECFF" },
    blocks: ["#FF7051", "#A9EFD6", "#FFFFFF", "#C9A0FF"],
  },
  {
    id: "bold", name: "Bold", hint: "Bright hero, product-led, playful type", categories: ["shop", "beauty"], source: "pingbase",
    hero: "framed", headingFont: "'Outfit', sans-serif", bodyFont: "'Outfit', sans-serif", radius: "rounded", lowercase: true,
    palette: { bg: "#F3F1EC", surface: "#8FA8DC", text: "#1F2A22", soft: "#5E6660", border: "#DAD6CD", accent: "#F26A21", onAccent: "#FFFFFF", nav: "#F3F1EC", onNav: "#1F4A32" },
  },
  {
    // Organic wellness: parchment paper, forest nav, framed natural hero.
    id: "botanical", name: "Botanical", hint: "Parchment, forest green, organic shop", categories: ["shop", "health"], source: "pingbase",
    hero: "framed", headingFont: "'Instrument Serif', serif", bodyFont: "'Inter', sans-serif", radius: "rounded",
    palette: { bg: "#F7F5EE", surface: "#EEF0E7", text: "#182A20", soft: "#5F6B60", border: "#DDDED2", accent: "#2E5E3F", onAccent: "#F3F6EC", nav: "#0F2A1D", onNav: "#F0F3E8" },
  },
  {
    // Swiss poster: stark monochrome, hard square corners, tracked caps.
    id: "studio", name: "Studio", hint: "Swiss poster grid, stark monochrome", categories: ["beauty", "health", "services"], source: "pingbase",
    hero: "editorial", headingFont: "'Space Grotesk', sans-serif", bodyFont: "'Inter', sans-serif", radius: "square", caps: true,
    palette: { bg: "#FFFFFF", surface: "#EFEFEC", text: "#0A0A0A", soft: "#6B6B6B", border: "#111111", accent: "#1F4BFF", onAccent: "#FFFFFF" },
  },
  {
    // Healthcare: cool slate-ice page, white cards, soft pill corners.
    id: "clinic", name: "Clinic", hint: "Calm slate-ice, trust-first, soft pills", categories: ["health", "services"], source: "pingbase",
    hero: "split", headingFont: "'Manrope', sans-serif", bodyFont: "'Manrope', sans-serif", radius: "pill",
    palette: { bg: "#F1F5FA", surface: "#FFFFFF", text: "#0F1B2A", soft: "#5A6778", border: "#DCE5EF", accent: "#0F766E", onAccent: "#FFFFFF" },
  },
];

/** Heading faces a business can swap in, Bookwan-style. `null` keeps the template's own face. */
export const SITE_HEADING_FONTS = [
  { id: "instrument", name: "Instrument Serif", stack: "'Instrument Serif', Georgia, serif" },
  { id: "playfair", name: "Playfair Display", stack: "'Playfair Display', Georgia, serif" },
  { id: "fraunces", name: "Fraunces", stack: "'Fraunces', Georgia, serif" },
  { id: "cormorant", name: "Cormorant Garamond", stack: "'Cormorant Garamond', Georgia, serif" },
  { id: "bricolage", name: "Bricolage Grotesque", stack: "'Bricolage Grotesque', system-ui, sans-serif" },
  { id: "space", name: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif" },
  { id: "syne", name: "Syne", stack: "'Syne', system-ui, sans-serif" },
  { id: "outfit", name: "Outfit", stack: "'Outfit', system-ui, sans-serif" },
  { id: "manrope", name: "Manrope", stack: "'Manrope', system-ui, sans-serif" },
  { id: "dmsans", name: "DM Sans", stack: "'DM Sans', system-ui, sans-serif" },
  { id: "inter", name: "Inter", stack: "'Inter', system-ui, sans-serif" },
] as const;
export type SiteHeadingFontId = (typeof SITE_HEADING_FONTS)[number]["id"];

export function headingFontStack(id?: string | null): string | null {
  return SITE_HEADING_FONTS.find((f) => f.id === id)?.stack ?? null;
}

/** Curated brand colours shown as swatches; any hex is still allowed. */
export const SITE_ACCENTS = [
  "#111111", "#B4593A", "#B7241C", "#F26522", "#CEA96A", "#2E7D50",
  "#0F766E", "#2E7BAA", "#1F4BFF", "#5B21D6", "#C2295E", "#5F1E48",
] as const;

export const SITE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Manrope:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Fraunces:opsz,wght@9..144,400;9..144,600&family=DM+Sans:wght@400;500;700&family=Cormorant+Garamond:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&family=Syne:wght@500;700;800&family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap";

const DEFAULT_SECTIONS: Record<SiteCategoryId, SiteSectionId[]> = {
  beauty: ["services", "gallery", "about", "team", "faq", "location", "contact"],
  shop: ["shop", "about", "gallery", "faq", "contact", "location"],
  health: ["services", "about", "team", "faq", "location", "contact"],
  services: ["services", "about", "team", "gallery", "faq", "location", "contact"],
};
export const DEFAULT_TEMPLATE: Record<SiteCategoryId, string> = { beauty: "signature", shop: "bold", health: "clinic", services: "studio" };

/** Full ordered section list for a category: its defaults on, the rest off at the end. */
export function defaultSections(category: SiteCategoryId, hasProducts = false, hasServices = true): SectionSetting[] {
  const on = DEFAULT_SECTIONS[category].filter((s) => (s !== "shop" || hasProducts) && (s !== "services" || hasServices));
  if (hasProducts && !on.includes("shop")) on.splice(1, 0, "shop");
  if (hasServices && !on.includes("services")) on.splice(1, 0, "services");
  return [...on.map((id) => ({ id, enabled: true })), ...SITE_SECTIONS.filter((s) => !on.includes(s.id)).map((s) => ({ id: s.id, enabled: false }))];
}

/** Normalise stored sections: keep saved order, add any new section types switched off. */
export function normaliseSections(saved: unknown, fallback: SectionSetting[]): SectionSetting[] {
  if (!Array.isArray(saved) || saved.length === 0) return fallback;
  const known = new Set(SITE_SECTIONS.map((s) => s.id as string));
  const list = (saved as SectionSetting[]).filter((s) => s && known.has(s.id));
  for (const s of SITE_SECTIONS) if (!list.some((x) => x.id === s.id)) list.push({ id: s.id, enabled: false });
  return list;
}

export function templateById(id: string | null | undefined) {
  return SITE_TEMPLATES.find((t) => t.id === id) ?? SITE_TEMPLATES[0]!;
}
