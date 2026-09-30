# Refine the Pingbase website builder

## What will change

- Remove industry-first browsing from the Website page. All available templates will appear together in one gallery, while the saved business category remains available behind the scenes for existing sites.
- Reorganise the page into two focused views, following Bookwan: **Page layout** for sections and **Look** for templates, colour, mode and corners.
- Turn each section into a clear row with reorder, edit and show/hide controls. Editing opens a full-width mobile panel / right-side desktop panel using Pingbase’s existing Veya patterns.
- Add section-specific editing:
  - Hero: main photo, headline and subheadline
  - About: about copy
  - Services and shop: direct links to manage catalogue content
  - Gallery: explanation and direct link to catalogue images
  - Team and location: direct links to the matching business settings
  - FAQ: add, edit and remove questions
  - Contact: Instagram plus direct links to business/contact and channel settings
- Keep the current live phone preview, save/publish flow, template rendering and public URLs unchanged.

## Design direction

Use the established Pingbase workspace style: compact Veya controls, neutral bordered surfaces, crisp blue selection states, minimal decoration and mobile full-width drill-ins. Template cards remain visual and mobile-first, but the editor itself will be quieter and easier to scan.

## Technical details

- Update only the Website editor and template catalogue helpers; no database migration is needed because the existing saved fields already support this flow.
- Preserve compatibility with existing category values and saved section order.
- Verify template switching, every section editor, saving, desktop phone preview and mobile layout without horizontal overflow.
