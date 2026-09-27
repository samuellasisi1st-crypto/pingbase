import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button, Input } from "@/design-system";
import { connectMeta, disconnectMeta, getMetaSetup } from "@/lib/channels.functions";

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          Copy
        </Button>
      </div>
    </div>
  );
}

export function MetaConnectForm({ connected }: { connected: boolean }) {
  const qc = useQueryClient();
  const fetchSetup = useServerFn(getMetaSetup);
  const connect = useServerFn(connectMeta);
  const disconnect = useServerFn(disconnectMeta);
  const setup = useQuery({ queryKey: ["meta-setup"], queryFn: () => fetchSetup() });

  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setToken] = useState("");
  const [appSecret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["settings"] });
    void qc.invalidateQueries({ queryKey: ["meta-setup"] });
  };

  const onConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await connect({ data: { pageId: pageId || setup.data?.pageId || "", pageAccessToken, appSecret } });
      if (res.ok) {
        toast.success(
          res.instagramLinked
            ? `Connected ${res.pageName} and Instagram @${res.igUsername ?? ""}`
            : `Connected ${res.pageName}. No Instagram account is linked to this Page yet.`,
        );
        setToken("");
        setSecret("");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message.replace(/^\[.*?\]\s*/, "") : "Something went wrong");
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const onDisconnect = async () => {
    setBusy(true);
    try {
      await disconnect();
      toast.success("Instagram and Messenger disconnected");
    } finally {
      setBusy(false);
      refresh();
    }
  };

  if (setup.isLoading) return <p className="text-sm text-muted-foreground">Loading Meta setup…</p>;
  if (setup.error || !setup.data)
    return <p className="text-sm text-destructive">Couldn't load Meta setup. Refresh and try again.</p>;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const s = setup.data;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Instagram &amp; Messenger (Meta)</p>
          <p className="text-sm text-muted-foreground">
            {connected && s.pageName
              ? `Connected to ${s.pageName}${s.igUsername ? ` · Instagram @${s.igUsername}` : ""}`
              : "Customers message your Facebook Page or Instagram; Nia replies here in the unified inbox."}
          </p>
        </div>
        {s.hasSecrets && (
          <Button variant="destructive" size="sm" onClick={onDisconnect} disabled={busy}>
            Disconnect
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium">Step 1 — In your Meta app, open Webhooks and paste these</p>
        <CopyField label="Callback URL" value={`${origin}${s.webhookPath}`} />
        <CopyField label="Verify token" value={s.verifyToken} />
        <p className="text-xs text-muted-foreground">
          Subscribe to <span className="font-mono">messages</span> and{" "}
          <span className="font-mono">messaging_postbacks</span> for both the Page and Instagram objects. Use your
          published site address for the callback so Meta can always reach it.
        </p>
      </div>

      <form onSubmit={onConnect} className="mt-5 space-y-3">
        <p className="text-sm font-medium">Step 2 — Enter your Page credentials</p>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Facebook Page ID</span>
          <Input
            required
            inputMode="numeric"
            placeholder={s.pageId || "e.g. 104857392019283"}
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Page access token (long-lived)</span>
          <Input
            required
            type="password"
            autoComplete="off"
            placeholder={s.hasSecrets ? "Saved — enter a new one to replace" : "EAAG…"}
            value={pageAccessToken}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">App secret</span>
          <Input
            required
            type="password"
            autoComplete="off"
            placeholder={s.hasSecrets ? "Saved — enter a new one to replace" : "32-character app secret"}
            value={appSecret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Token needs: pages_show_list, pages_messaging, pages_manage_metadata, pages_read_engagement,
          instagram_basic, instagram_manage_messages. Credentials are stored privately and never shown again.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? "Checking with Meta…" : s.hasSecrets ? "Update & reconnect" : "Connect"}
        </Button>
      </form>
    </div>
  );
}
