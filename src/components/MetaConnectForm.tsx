import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/design-system";
import { disconnectMeta, getMetaStatus, selectMetaPage, startMetaConnect } from "@/lib/channels.functions";

const REASONS: Record<string, string> = {
  expired: "The sign-in took too long. Please try again.",
  nopages: "No Facebook Pages were shared. Make sure you tick your Page when Facebook asks.",
  subscribe: "Facebook didn't let us listen for messages on that Page. Check you're an admin of the Page.",
  oauth: "Facebook sign-in failed. Please try again.",
  nocode: "Facebook sign-in failed. Please try again.",
};

export function MetaConnectForm(_: { connected: boolean }) {
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getMetaStatus);
  const start = useServerFn(startMetaConnect);
  const select = useServerFn(selectMetaPage);
  const disconnect = useServerFn(disconnectMeta);
  const status = useQuery({ queryKey: ["meta-status"], queryFn: () => fetchStatus() });
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["settings"] });
    void qc.invalidateQueries({ queryKey: ["meta-status"] });
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get("meta");
    if (!m) return;
    if (m === "connected") toast.success("Instagram & Messenger connected");
    if (m === "cancelled") toast("Facebook sign-in was cancelled");
    if (m === "error") toast.error(REASONS[p.get("reason") ?? ""] ?? "Couldn't connect. Please try again.");
    window.history.replaceState({}, "", window.location.pathname);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConnect = async () => {
    setBusy(true);
    try {
      const { url } = await start({ data: { origin: window.location.origin } });
      window.location.href = url;
    } catch {
      toast.error("Couldn't start Facebook sign-in.");
      setBusy(false);
    }
  };

  const onPick = async (pageId: string) => {
    setBusy(true);
    try {
      const res = await select({ data: { pageId } });
      if (res.ok) toast.success("Instagram & Messenger connected");
      else toast.error(res.error);
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

  if (status.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (status.error || !status.data) return <p className="text-sm text-destructive">Couldn't load this. Refresh and try again.</p>;
  const s = status.data;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Instagram &amp; Messenger</p>
          <p className="text-sm text-muted-foreground">
            {s.connected && s.pageName
              ? `Connected to ${s.pageName}${s.igUsername ? ` · Instagram @${s.igUsername}` : " · no Instagram account linked"}`
              : "Sign in with Facebook and pick your business Page. Nia will answer DMs from your Page and Instagram."}
          </p>
        </div>
        {s.connected ? (
          <Button variant="destructive" size="sm" onClick={onDisconnect} disabled={busy}>
            Disconnect
          </Button>
        ) : (
          <Button onClick={onConnect} disabled={busy}>
            {busy ? "Opening Facebook…" : "Connect with Facebook"}
          </Button>
        )}
      </div>

      {!s.connected && s.pendingPages.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Which Page should Pink OS use?</p>
          {s.pendingPages.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => onPick(p.id)}
              className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">{p.igUsername ? `@${p.igUsername}` : "No Instagram linked"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
