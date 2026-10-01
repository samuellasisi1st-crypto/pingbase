import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Called by the backend scheduler (apikey header) or manually with the cron secret.
// Safe to call repeatedly: every send is claimed and deduped, so extra calls never double-message.
export const Route = createFileRoute("/api/public/cron/followups")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const schedulerOk = !!apikey && apikey === process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!schedulerOk) {
          const denied = await authenticateCronRequest(request);
          if (denied) return denied;
        }
        const { runFollowups } = await import("@/lib/followups.server");
        return Response.json(await runFollowups());
      },
    },
  },
});
