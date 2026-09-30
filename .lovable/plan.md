# Website templates for Pingbase

Each business gets one mobile-first website. It picks a **category**, then a **template** from that category, then turns sections on or off. Every template shows the same business data (services, products, team, reviews, booking, WhatsApp), just laid out in a different style.

## 1. Structure first: categories and templates

```text
Category                 Who it's for                                Templates
-----------------------  ------------------------------------------  --------------------------------------------
Beauty, hair & fashion   salons, lash/nail, makeup, barbers,         Signature, Editorial, Boutique, Noir,
                         fashion/stylists                            Studio, Playful   (taken from Bookwan)
Shops & products         skincare, cosmetics, fashion retail,        Bold  (inspired by the orange "onsko" image)
                         any business selling products               Botanical (inspired by the green "wellina" image)
Health & clinics         clinics, OBGYN, physio, therapy, dental     Clinic (calm, trust-first), plus Editorial and Studio
Studios & services       fitness, wellness, tutors, consultants      Studio, Boutique, Playful
```

- A template can appear in more than one category, so the Bookwan themes are reused and not rebuilt.
- Picking a category during setup suggests the best template and a sensible set of sections. The business can still browse every template.
- New uploaded images later become new templates added to a category. The catalogue is one list, so adding one is a small change.

## 2. Sections that can be switched on or off

Hero, About, Services and booking, Shop (products), Gallery, Team, Reviews, FAQ, Location and hours, Contact / WhatsApp.

- Each section can be turned on, turned off and reordered, the same way as in Bookwan.
- If a business has no products, the Shop is off, and the site has no cart, shop tab or shop links.
- If a business only sells products, Services and booking are off.
- Online booking, Book a call, Book via WhatsApp and the floating WhatsApp button from the current store carry over into every template.

## 3. Website page in the app

A new **Website** page in the side navigation, with:
- Category tabs, each showing its template gallery.
- A live phone preview next to the settings. On phones, the preview opens full screen.
- Controls for section on/off and order, brand colour, light/dark (where the template allows it), hero photo/video, headline, about text, FAQs and social links.
- Publish/unpublish and a copyable site link.

The Store link tab in Catalogue will point to this page.

## 4. Public website

- Stays at the existing `/s/<business>` link, now shown in the chosen template.
- Mobile-first: designed at phone width first, then expanded for tablet and desktop.
- Bookwan branding becomes Pingbase: "Powered by Pingbase" and Pingbase copy. The business's own logo and colours lead.

## Build order

1. **Structure:** categories, template list, saved website settings, section on/off and order, the Website page with phone preview, and the public page switching templates. Signature (Bookwan) and Bold (store) are built first so the structure is proven with both a service style and a shop style.
2. **Bookwan port:** copy Editorial, Boutique, Noir, Studio and Playful, including their colour moods, with little rebuilding.
3. **Store and clinic templates:** Botanical (from the wellina image) and Clinic, plus a product detail view and a mobile product carousel for store templates.

## Technical details

- New `website_configs` table, one row per workspace: category, template, accent, mode, radius, sections (ordered list with enabled flags), hero media, headline, subheadline, about, FAQs, socials. Workspace members can edit their own row. The public site reads it through the existing service-role `public_store` function, which will be extended to return this config plus team and reviews.
- `src/config/site-templates.ts` holds the single catalogue: id, name, hint, preview image, categories[], default accent/mode/radius, default sections.
- Templates live in `src/components/site/templates/*`. Each gets the same `SiteData` props, and `SiteRenderer` picks the template by id. Shared blocks such as booking sheet, WhatsApp button, FAQ, gallery carousel and product card live in `src/components/site/blocks/*`.
- Bookwan's `themed-site`, `editorial-site`, `site-hero`, `portfolio-carousel`, `faq-accordion` and the theme/mood configs are copied in. Phosphor icons become lucide, their helpers are re-pointed to Pingbase data, and Bookwan theme preview images are downloaded and re-uploaded as Pingbase assets.
- Template styling uses scoped CSS variables per template, so it doesn't touch the Veya app design system.
- Uploaded reference images stay as reference only and are not embedded in the site.
