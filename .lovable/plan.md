# Dashboard, WhatsApp templates and Settings redesign

## 1. Dashboard (new first page)
The app opens on a new Dashboard. The inbox moves to its own page and gets its own place in the side nav.
- **Greeting and today strip:** the date, today's bookings, conversations waiting on you, and today's revenue.
- **Next booking card:** customer, service, staff member, time until it starts, and a button to open the booking.
- **Needs your attention:** a to-do list built from real data. It covers handovers waiting for a person, unpaid deposits, unread conversations, bookings in the next 24 hours, and channels with errors.
- **Next best steps:** setup suggestions such as "Connect Google Calendar", "Add knowledge", "Approve a WhatsApp template" and "Add team members". Each one disappears once it's done.
- **Analytics:** bookings and revenue for the last 7 and 30 days, messages by channel, how much Nia handled compared with people, and busiest days.
- **Upcoming today and tomorrow:** a short list of bookings.
- On phones this becomes one column, and Dashboard joins the bottom navigation.

## 2. WhatsApp templates in Channels
Settings gets a Templates section, laid out like your first screenshot:
- A title and a short explanation of the 24-hour rule.
- A search box.
- A table showing Name, Status (Approved, Pending or Rejected) and Language, with a preview when you pick a template.
- A "New template" button that uses the existing template creation.
- If WhatsApp isn't connected, a friendly empty screen with an "Add WhatsApp account" button.
- The WhatsApp card on the Channels page also links to this section.

## 3. Settings restructure
The new settings menu follows your screenshots:
- **Profile** (your own account): General (photo, name, email, phone), Notifications and Security.
- **Workspace:** workspace logo, workspace name, time zone, business address, phone, email and currency, the AI on/off switch, and a Danger zone. This merges Business details into Workspace, as you suggested.
- **Team members:** real people who can sign in to this workspace, with their roles.
- **Staff & hours:** the stylists who can be booked, with working hours and time off. This stays separate from Team members because you can book a stylist who never signs in.
- **Booking rules:** no change.
- **Files & knowledge:** one list, laid out like your Files screenshot, with upload, search and New folder. It holds uploaded files and written knowledge entries, and Nia can use both.
- **Templates:** WhatsApp templates (section 2).
- **Channels & integrations:** no change.

Every page uses the same layout: a large title, a divider, then label-and-description rows beside the fields, with Save at the bottom. This matches the General and Workspace screenshots.

## 4. Workspace icon in the side nav
- The workspace logo and name go at the top of the main side nav, with a menu to open Workspace settings.
- When the side nav is collapsed, only the logo shows.
- Until you upload your own logo, the pink pattern you shared is the default.

## Technical details
- New `src/routes/dashboard.tsx`. `/` becomes the dashboard and the inbox moves to `/inbox`. Nav links, bottom nav and redirects are updated.
- Dashboard data comes from one server function in `src/lib/dashboard.functions.ts`, which runs aggregate queries on appointments, conversations, handoffs, payments, messages and channel_connections.
- Templates reuse the existing template list and create functions in `src/lib/channels.functions.ts`.
- Migration: add `workspaces.logo_url`. Add a `files` table (workspace_id, name, path, mime, size, folder, uploaded_by) with grants and member RLS. Files are stored in the private `attachments` bucket under `<workspace_id>/files/`. Also add `profiles.phone` and `profiles.avatar_url`.
- The team list reads `workspace_members` joined to `profiles`. Invites are out of scope for now; the page lists real members only.
- All styling uses Veya tokens.
