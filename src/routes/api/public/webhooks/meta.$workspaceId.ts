import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const workspaceIdSchema = z.string().uuid();

type MetaMessaging = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean; attachments?: Array<{ type?: string; payload?: { url?: string } }> };
  postback?: { mid?: string; title?: string; payload?: string };
};
type MetaPayload = { object?: string; entry?: Array<{ id?: string; messaging?: MetaMessaging[] }> };

export const Route = createFileRoute("/api/public/webhooks/meta/$workspaceId")({
  server: {
    handlers: {
      // Meta's one-time verification handshake.
      GET: async ({ request, params }) => {
        const parsed = workspaceIdSchema.safeParse(params.workspaceId);
        if (!parsed.success) return new Response("Not found", { status: 404 });
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const { getMetaConfig } = await import("@/lib/channels.server");
        const config = await getMetaConfig(parsed.data);
        if (mode === "subscribe" && token && config.verify_token && token === config.verify_token && challenge) {
          return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request, params }) => {
        const parsed = workspaceIdSchema.safeParse(params.workspaceId);
        if (!parsed.success) return new Response("Not found", { status: 404 });
        const workspaceId = parsed.data;
        const raw = await request.text();

        const { getMetaSecrets, getMetaConfig, verifyMetaSignature, logIntegration, fetchMetaProfileName } = await import(
          "@/lib/channels.server"
        );
        const secrets = await getMetaSecrets(workspaceId);
        if (!secrets) return new Response("Not connected", { status: 404 });
        if (!verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), secrets.app_secret)) {
          await logIntegration(workspaceId, "meta", "warn", "Rejected webhook with invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: MetaPayload;
        try {
          payload = JSON.parse(raw) as MetaPayload;
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const channel = payload.object === "instagram" ? "instagram" : payload.object === "page" ? "messenger" : null;
        if (!channel) return new Response("ok");

        const config = await getMetaConfig(workspaceId);
        const ownIds = new Set([config.page_id, config.ig_account_id].filter(Boolean) as string[]);
        const { processInboundMessage } = await import("@/lib/pipeline.server");

        for (const entry of payload.entry ?? []) {
          for (const ev of entry.messaging ?? []) {
            const senderId = ev.sender?.id;
            if (!senderId || ownIds.has(senderId) || ev.message?.is_echo) continue;
            const text =
              ev.message?.text ??
              ev.postback?.title ??
              (ev.message?.attachments?.length ? `[Sent ${ev.message.attachments.map((a) => a.type ?? "file").join(", ")}]` : null);
            if (!text) continue;
            try {
              const displayName = await fetchMetaProfileName(workspaceId, channel, senderId);
              await processInboundMessage({
                workspaceId,
                channel,
                externalId: senderId,
                externalMessageId: ev.message?.mid ?? ev.postback?.mid ?? `${senderId}:${ev.timestamp ?? Date.now()}`,
                displayName,
                body: text,
                metadata: { attachments: ev.message?.attachments ?? [], meta_timestamp: ev.timestamp ?? null },
              });
            } catch (e) {
              await logIntegration(workspaceId, channel, "error", `Inbound processing failed: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
        return new Response("ok");
      },
    },
  },
});
