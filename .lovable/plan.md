# Landing page interaction and image fixes

## Changes
- Remove rounding from the layered product image and add full-width separators directly above and below it.
- Replace the industry strip with a real horizontal carousel: correctly paired images and copy, smooth previous/next movement, touch dragging, looping, and working mobile controls.
- Remove the entire “A calmer day” section.
- Transplant Creator Canvas’s UGC testimonial carousel structure and behavior, then restyle its colors, copy, images, and controls for Pingbase without changing its interaction model.
- Rebuild the final CTA as one unblended photo with exactly one flat primary and one flat secondary action.
- Place the landscape behind the footer links as the footer background, preserving the image without fading or creating a separate image section.

## Technical details
- Reuse the project’s existing carousel primitives where compatible; otherwise copy the Creator Canvas primitive and required autoplay dependency before importing it.
- Keep all landing-page buttons flat and token-based, with no gradient or glow.
- Preserve responsive behavior, keyboard controls, drag interaction, and reduced-motion preferences.
- Verify desktop and phone layouts, carousel controls, overflow, browser errors, and the final build.
