import { createFileRoute } from "@tanstack/react-router";

type MetaMessaging = {
  sender?: { id?: string };
  timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean; attachments?: Array<{ type?: string; payload?: { url?: string } }> };
  postback?: { mid?: string; title?: string; payload?: string };
};
type WaMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};
type WaChange = {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string; display_phone_number?: string };
    contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
    messages?: WaMessage[];
  };
};
type MetaPayload = { object?: string; entry?: Array<{ id?: string; messaging?: MetaMessaging[]; changes?: WaChange[] }> };

// One platform-wide webhook for every Pingbase business. Events are routed to a workspace by Page / Instagram ID.
export const Route = createFileRoute("/api/public/webhooks/meta")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const expected = process.env["META_WEBHOOK_VERIFY_TOKEN"];
        const challenge = url.searchParams.get("hub.challenge");
        if (url.searchParams.get("hub.mode") === "subscribe" && expected && url.searchParams.get("hub.verify_token") === expected && challenge) {
          return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const raw = await request.text();
        const appSecret = process.env["META_APP_SECRET"];
        const { verifyMetaSignature, findWorkspaceForMetaId, findWorkspaceForWhatsAppPhoneId, logIntegration, fetchMetaProfileName } =
          await import("@/lib/channels.server");
        if (!appSecret || !verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: MetaPayload;
        try {
          payload = JSON.parse(raw) as MetaPayload;
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const channel = payload.object === "instagram" ? "instagram" : payload.object === "page" ? "messenger" : null;
        const isWhatsApp = payload.object === "whatsapp_business_account";
        if (!channel && !isWhatsApp) return new Response("ok");
        const { processInboundMessage } = await import("@/lib/pipeline.server");

        if (isWhatsApp) {
          for (const entry of payload.entry ?? []) {
            for (const change of entry.changes ?? []) {
              const value = change.value;
              const phoneNumberId = value?.metadata?.phone_number_id;
              if (!phoneNumberId || !value?.messages?.length) continue;
              const workspaceId = await findWorkspaceForWhatsAppPhoneId(phoneNumberId);
              if (!workspaceId) {
                console.warn(`WhatsApp webhook: no workspace for phone_number_id ${phoneNumberId}`);
                continue;
              }
              for (const m of value.messages) {
                const from = m.from;
                if (!from) continue;
                const text =
                  m.text?.body ??
                  m.button?.text ??
                  m.interactive?.button_reply?.title ??
                  m.interactive?.list_reply?.title ??
                  (m.type && m.type !== "text" ? `[Sent ${m.type}]` : null);
                if (!text) continue;
                const profileName = value.contacts?.find((c) => c.wa_id === from)?.profile?.name ?? null;
                try {
                  await processInboundMessage({
                    workspaceId,
                    channel: "whatsapp",
                    externalId: from,
                    externalMessageId: m.id ?? `${from}:${m.timestamp ?? Date.now()}`,
                    displayName: profileName,
                    phone: `+${from}`,
                    body: text,
                    metadata: {
                      wa_type: m.type ?? null,
                      wa_timestamp: m.timestamp ?? null,
                      wa_reply_id: m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? null,
                    },
                  });
                } catch (e) {
                  await logIntegration(workspaceId, "whatsapp", "error", `Inbound processing failed: ${e instanceof Error ? e.message : String(e)}`);
                }
              }
            }
          }
          return new Response("ok");
        }
        if (!channel) return new Response("ok");

        for (const entry of payload.entry ?? []) {
          if (!entry.id) continue;
          const workspaceId = await findWorkspaceForMetaId(channel, entry.id);
          if (!workspaceId) continue;
          for (const ev of entry.messaging ?? []) {
            const senderId = ev.sender?.id;
            if (!senderId || senderId === entry.id || ev.message?.is_echo) continue;
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
