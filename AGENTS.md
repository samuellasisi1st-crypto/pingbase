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

## Booking concierge architecture
- All inbound messages from any channel go through `src/lib/pipeline.server.ts` (dedupe → contact → conversation → AI) so every channel shares one inbox and one agent.
- The AI may only act through the tools in `src/lib/agent.server.ts`; availability comes solely from `src/lib/availability.server.ts`, which re-checks the slot before confirming, so the agent can never invent a booking.
- Server-only logic lives in `*.server.ts`; the client calls it through `src/lib/concierge.functions.ts` server functions.
