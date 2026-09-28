# Real sign-ups: every new business gets its own empty workspace

## What changes for a new customer
1. They sign up (email or Google) and land on a short **setup wizard**: business name, logo, opening hours, first services, first staff member.
2. They get a **fresh, empty workspace** — no Studio Nine data, no demo customers, bookings or chats.
3. Dashboard, Inbox, Contacts, Appointments, Services and Settings show friendly empty states with "next steps" (connect WhatsApp, Instagram/Messenger, Google Calendar, add knowledge).
4. They can connect their own WhatsApp, Instagram/Messenger and Google Calendar; messages route only to their workspace.
5. Nia answers using their own services, staff, hours and knowledge.
6. Your account keeps the Studio Nine demo workspace exactly as it is.

## Build steps
1. **Workspace on sign-up** — when a new account is created, automatically create a workspace, make the user its owner, and create their profile.
2. **Onboarding wizard** — new `/onboarding` page; the app sends users there until setup is finished.
3. **Remove the hard-wired demo workspace** — every screen and server action uses the signed-in user's workspace instead of Studio Nine's.
4. **Security checks** — every server action verifies the user belongs to the workspace; data rules already scope by membership, re-checked for all tables.
5. **Channel connections per workspace** — WhatsApp, Meta and Google connect flows save to the user's workspace; the shared Meta webhook already routes by Page / account ID.
6. **Empty states** across all pages.
7. **Test end-to-end** — sign up a fresh test account, confirm it sees zero demo data, completes the wizard, and that your account still sees Studio Nine.

## Technical details
- DB trigger on `auth.users` insert is not allowed; instead a `ensure_workspace()` security-definer RPC called after first sign-in creates `workspaces` + `workspace_members (role owner)` + `profiles`. Add `workspaces.onboarded_at`.
- Replace `DEMO_WORKSPACE_ID` / `WORKSPACE` constants in `pipeline.server.ts`, `channels.functions.ts`, `concierge.functions.ts` with a `getCurrentWorkspace(context)` helper behind `requireSupabaseAuth`; inbound pipeline resolves workspace from the channel connection.
- `AppShell` gate: no workspace or `onboarded_at` null → redirect to `/onboarding`.
- Record the multi-tenant rule in `AGENTS.md`.
