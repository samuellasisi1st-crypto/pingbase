# Build Appointments and reorganise Settings

## What will change

### Appointments
- Rebuild Appointments as a complete operational workspace using live booking data.
- Add compact status filters, search, date navigation, and a clear schedule/table view with customer, service, staff, time, payment, and booking status.
- Add an appointment detail panel with the booking timeline and the actions already supported by Pingbase, without inventing unsupported booking operations.
- Keep the layout responsive and free of horizontal page scrolling.

### Services
- Add **Services** to the main navigation as its own page.
- Move the existing service catalogue out of Settings.
- Build a dedicated service management table with create, edit, activate/deactivate, duration, price, and deposit controls backed by the existing workspace data.

### Settings structure and design
- Rebuild Settings to match the uploaded reference: compact navigation column, a focused sub-navigation column, and a white detail workspace on the soft-grey application canvas.
- Keep only business administration sections in Settings: Business details, Staff & hours, Booking rules, Knowledge, Channels & integrations, and Workspace.
- Use the Veya design system throughout while matching the references’ density, borders, whitespace, and white/soft-grey layering.

### Knowledge
- Replace the read-only knowledge list with a usable knowledge manager.
- Support creating, editing, activating/deactivating, tagging, and deleting knowledge entries so businesses can continually enrich Nia’s source material.
- Add search and clear source/status indicators; changes will use the existing workspace-scoped data and permissions.

### AI Agent
- Remove the duplicate AI Agent section from Settings.
- Expand the existing **AI Agents** page so Nia’s name, enabled state, tone, instructions, autonomy, escalation rules, and forbidden topics can be edited there.
- Keep agent performance and handover summaries on the same page.

### Channels and integrations
- Redesign Channels as an integrations catalogue inspired by the uploaded reference.
- Show WhatsApp, Instagram & Messenger, and Google Calendar as polished integration tiles with connected/error/not-connected states and focused setup panels.
- Preserve the existing secure connection, reconnection, page selection, and disconnect flows; unavailable channels will not be presented as working integrations.

## Technical details
- Add focused route and form modules rather than enlarging the existing Settings file.
- Use TanStack Query invalidation after every successful change and show clear success/error feedback.
- Keep secrets and OAuth tokens server-side; only non-secret status and configuration reach the browser.
- Add or update route metadata for every page touched.
- Update the project roadmap and architecture notes only where the navigation/settings ownership changes.

## Verification
- Verify Appointments, Services, AI Agents, and every Settings section at desktop and narrow viewports.
- Test create/edit/toggle flows for services and knowledge, agent-setting updates, and the existing channel connection status screens.
- Confirm no horizontal page scrolling, no duplicated Settings/AI configuration, and a clean production build.
