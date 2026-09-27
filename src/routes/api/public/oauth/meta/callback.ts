import { createFileRoute } from "@tanstack/react-router";

// Facebook Login redirect target. The signed `state` proves which workspace started the flow.
export const Route = createFileRoute("/api/public/oauth/meta/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const { readState, metaPlatform, GRAPH, savePendingPages, connectMetaPage, logIntegration } = await import("@/lib/channels.server");
        const state = readState(url.searchParams.get("state"));
        const back = (q: string) => Response.redirect(`${state?.o ?? url.origin}/settings?tab=channels&${q}`, 302);
        if (!state) return back("meta=error&reason=expired");
        if (url.searchParams.get("error")) return back("meta=cancelled");
        const code = url.searchParams.get("code");
        if (!code) return back("meta=error&reason=nocode");

        try {
          const { appId, appSecret } = metaPlatform();
          const redirectUri = `${url.origin}/api/public/oauth/meta/callback`;
          const tokRes = await fetch(
            `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`,
          );
          const tok = (await tokRes.json()) as { access_token?: string; error?: { message?: string } };
          if (!tok.access_token) throw new Error(tok.error?.message ?? "Facebook did not return a token");

          // Long-lived user token → Page tokens that don't expire.
          const llRes = await fetch(
            `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(tok.access_token)}`,
          );
          const ll = (await llRes.json()) as { access_token?: string };
          const userToken = ll.access_token ?? tok.access_token;

          const pagesRes = await fetch(
            `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token=${encodeURIComponent(userToken)}`,
          );
          const pages = (await pagesRes.json()) as { data?: Array<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }> };
          const list = pages.data ?? [];
          if (list.length === 0) return back("meta=error&reason=nopages");
          if (list.length === 1) {
            const res = await connectMetaPage(state.w, list[0]!);
            return back(res.ok ? "meta=connected" : "meta=error&reason=subscribe");
          }
          await savePendingPages(state.w, list);
          return back("meta=choose");
        } catch (e) {
          await logIntegration(state.w, "meta", "error", `Facebook sign-in failed: ${e instanceof Error ? e.message : String(e)}`);
          return back("meta=error&reason=oauth");
        }
      },
    },
  },
});
