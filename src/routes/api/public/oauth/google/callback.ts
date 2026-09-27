import { createFileRoute } from "@tanstack/react-router";

// Google OAuth redirect target. The signed `state` proves which workspace/user started the flow.
function page(ok: boolean, message: string, origin: string) {
  const payload = JSON.stringify({ type: "pingbase-google", ok, message });
  const html = `<!doctype html><meta charset="utf-8"><title>Google Calendar</title>
<body style="font-family:system-ui;padding:32px;text-align:center"><p>${message.replace(/</g, "&lt;")}</p><p>You can close this window.</p>
<script>try{window.opener&&window.opener.postMessage(${payload}, ${JSON.stringify(origin)})}catch(e){}setTimeout(function(){window.close()},1200)</script></body>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const Route = createFileRoute("/api/public/oauth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const { readState, logIntegration } = await import("@/lib/channels.server");
        const state = readState(url.searchParams.get("state"));
        const origin = state?.o ?? url.origin;
        if (!state) return page(false, "The sign-in took too long. Please try again.", origin);
        if (url.searchParams.get("error")) return page(false, "Google sign-in was cancelled.", origin);
        const code = url.searchParams.get("code");
        if (!code) return page(false, "Google sign-in failed. Please try again.", origin);
        const granted = url.searchParams.get("scope") ?? "";
        if (!granted.includes("calendar")) {
          return page(false, "Please tick the calendar permission so Pingbase can see when you're busy.", origin);
        }
        try {
          const { exchangeGoogleCode, saveGoogleConnection } = await import("@/lib/gcal.server");
          const tok = await exchangeGoogleCode(code, `${url.origin}/api/public/oauth/google/callback`);
          await saveGoogleConnection(state.w, state.u, tok);
          await logIntegration(state.w, "google_calendar", "info", `Connected Google Calendar ${tok.email ?? ""}`.trim());
          return page(true, "Google Calendar connected.", origin);
        } catch (e) {
          await logIntegration(state.w, "google_calendar", "error", `Google sign-in failed: ${e instanceof Error ? e.message : String(e)}`);
          return page(false, "Google sign-in failed. Please try again.", origin);
        }
      },
    },
  },
});
