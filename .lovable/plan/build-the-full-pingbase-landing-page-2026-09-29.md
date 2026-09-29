# Build the full Pingbase landing page

## What will change
- Keep the current navbar and opening section, but reduce headline weights to medium/semibold throughout.
- Extend the homepage into a complete product story inspired by the two references, using Pingbase content and existing Veya colours.
- Add sections for omnichannel messaging, Nia’s booking flow, customer journey coverage, integrations, business outcomes, testimonials, final call-to-action, and footer.
- Use real Pingbase interface imagery and lightweight product-style visuals rather than copying the reference brands.
- Make the full page work cleanly on desktop, tablet, phone, light mode, and dark mode.

## Page structure
1. Navbar and opening message
2. Trusted-channel strip
3. Platform overview and key outcomes
4. Omnichannel conversation showcase
5. Meet Nia and booking workflow
6. Customer journey feature grid
7. Integrations band
8. Results and customer stories
9. Final call-to-action
10. Full navigation footer

## Technical details
- Rework `LandingHero` into the complete landing page, splitting focused sections into small local components where helpful.
- Reuse Veya semantic tokens for all colours, borders, shadows, spacing, and type.
- Keep all headings at medium or semibold weight; no bold display typography.
- Reuse the existing dashboard screenshot and create only supporting interface compositions in code.
- Keep `/` as the public homepage and preserve `/dashboard` as the signed-in app.
- Verify the finished page in the running preview at desktop and phone sizes, including dark mode and link destinations.
