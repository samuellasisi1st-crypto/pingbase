import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button, Input } from "@/design-system";
import { disconnectWhatsApp, getWhatsAppStatus, saveWhatsAppCredentials } from "@/lib/channels.functions";

export function WhatsAppConnectForm() {
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getWhatsAppStatus);
  const save = useServerFn(saveWhatsAppCredentials);
  const disconnect = useServerFn(disconnectWhatsApp);
  const status = useQuery({ queryKey: ["whatsapp-status"], queryFn: () => fetchStatus() });
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["settings"] });
    void qc.invalidateQueries({ queryKey: ["whatsapp-status"] });
  };

  const onSave = async () => {
    setBusy(true);
    try {
      const res = await save({ data: { phoneNumberId: phoneNumberId.trim(), wabaId: wabaId.trim(), accessToken } });
      if (res.ok) {
        toast.success(`WhatsApp connected${res.displayPhoneNumber ? ` · ${res.displayPhoneNumber}` : ""}`);
        setAccessToken("");
        setPhoneNumberId("");
        setWabaId("");
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save those details.");
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const onDisconnect = async () => {
    setBusy(true);
    try {
      await disconnect();
      toast.success("WhatsApp disconnected");
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
          <p className="font-medium">WhatsApp</p>
          <p className="text-sm text-muted-foreground">
            {s.connected
              ? `Connected${s.displayPhoneNumber ? ` to ${s.displayPhoneNumber}` : ""}${s.verifiedName ? ` · ${s.verifiedName}` : ""}`
              : "Add your WhatsApp number details so Nia can answer messages sent to it."}
          </p>
          {s.lastError && <p className="mt-1 text-xs text-destructive">{s.lastError}</p>}
        </div>
        {s.connected && (
          <Button variant="destructive" size="sm" onClick={onDisconnect} disabled={busy}>
            Disconnect
          </Button>
        )}
      </div>

      {!s.connected && (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Phone Number ID</span>
            <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="1310873438784769" inputMode="numeric" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">WhatsApp Business Account ID (optional)</span>
            <Input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="2531507174010611" inputMode="numeric" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Access token</span>
            <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Paste your token" autoComplete="off" />
            <span className="text-xs text-muted-foreground">Stored securely on our servers. It is never shown again after saving.</span>
          </label>
          <div>
            <Button onClick={onSave} disabled={busy || !phoneNumberId.trim() || accessToken.length < 20}>
              {busy ? "Checking with WhatsApp…" : "Connect WhatsApp"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
