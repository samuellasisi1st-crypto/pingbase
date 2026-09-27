<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Design system
- All UI must use the Veya design system in `src/design-system/` (components + `styles/theme.css` tokens), imported from the "Cozy Code Library" project, because it is the single source of truth for colour, radius, shadow, spacing and typography.
- `src/styles.css` only aliases shadcn-style names onto Veya primitives; never hardcode colours or redefine tokens the design system already owns.
- Re-sync by re-copying `src/design-system/` from the Cozy Code Library project; changes there do not propagate automatically.

## Booking concierge architecture
- All inbound messages from any channel go through `src/lib/pipeline.server.ts` (dedupe → contact → conversation → AI) so every channel shares one inbox and one agent.
- The AI may only act through the tools in `src/lib/agent.server.ts`; availability comes solely from `src/lib/availability.server.ts`, which re-checks the slot before confirming, so the agent can never invent a booking.
- Server-only logic lives in `*.server.ts`; the client calls it through `src/lib/concierge.functions.ts` server functions.

## Channels
- Meta (Instagram + Messenger) share one credential set in `channel_secrets` (service-role only, no RLS policies) because tokens must never reach the browser; non-secret config lives on `channel_connections.config`.
- All outbound replies (AI and human) go through `deliverOutbound` in `src/lib/channels.server.ts` so delivery failures are logged and stored on the message instead of silently dropped.
- Pink OS owns ONE Meta app (multi-tenant SaaS): META_APP_ID / META_APP_SECRET / META_WEBHOOK_VERIFY_TOKEN are platform env vars, never tenant settings. Businesses connect via Facebook Login (`/api/public/oauth/meta/callback`, HMAC-signed state); only their Page token is stored per workspace.
- A single webhook `/api/public/webhooks/meta` receives all tenants' events and routes them to a workspace by Page ID / Instagram account ID.

## Google Calendar
- Each business connects its own Google account through Pingbase's own Google OAuth app (GOOGLE_OAUTH_CLIENT_ID/SECRET platform env vars, callback `/api/public/oauth/google/callback`); refresh tokens live in service-role-only `google_calendar_connections`, because the user chose direct OAuth over Lovable connectors.
- Availability only reads free/busy (`src/lib/gcal.server.ts`); if a connected calendar can't be read, slot search fails rather than offering possibly-busy times.
