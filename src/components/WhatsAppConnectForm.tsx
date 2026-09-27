import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button, Input } from "@/design-system";
import {
  completeEmbeddedSignup,
  disconnectWhatsApp,
  getEmbeddedSignupConfig,
  getWhatsAppStatus,
  saveWhatsAppCredentials,
} from "@/lib/channels.functions";

type FBType = {
  init: (o: Record<string, unknown>) => void;
  login: (cb: (r: { authResponse?: { code?: string } }) => void, o: Record<string, unknown>) => void;
};

function loadFacebookSdk(appId: string): Promise<FBType> {
  const w = window as unknown as { FB?: FBType; fbAsyncInit?: () => void };
  if (w.FB) return Promise.resolve(w.FB);
  return new Promise((resolve, reject) => {
    w.fbAsyncInit = () => {
      w.FB!.init({ appId, autoLogAppEvents: true, xfbml: false, version: "v21.0" });
      resolve(w.FB!);
    };
    const el = document.createElement("script");
    el.src = "https://connect.facebook.net/en_US/sdk.js";
    el.async = true;
    el.crossOrigin = "anonymous";
    el.onerror = () => reject(new Error("Couldn't load Facebook. Check ad blockers and try again."));
    document.body.appendChild(el);
  });
}

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
  const [manual, setManual] = useState(false);
  const fetchEsConfig = useServerFn(getEmbeddedSignupConfig);
  const complete = useServerFn(completeEmbeddedSignup);
  const esConfig = useQuery({ queryKey: ["wa-es-config"], queryFn: () => fetchEsConfig() });
  const sessionRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!String(e.origin).endsWith("facebook.com")) return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.type === "WA_EMBEDDED_SIGNUP" && d.data?.waba_id) {
          sessionRef.current = { wabaId: d.data.waba_id, phoneNumberId: d.data.phone_number_id };
        }
      } catch {
        /* not ours */
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const onEmbeddedSignup = async () => {
    const cfg = esConfig.data;
    if (!cfg?.appId || !cfg.configId) return;
    setBusy(true);
    try {
      const FB = await loadFacebookSdk(cfg.appId);
      const code = await new Promise<string | null>((resolve) =>
        FB.login((r) => resolve(r.authResponse?.code ?? null), {
          config_id: cfg.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
        }),
      );
      const { wabaId, phoneNumberId } = sessionRef.current;
      if (!code) return toast.error("WhatsApp setup was cancelled.");
      if (!wabaId || !phoneNumberId) return toast.error("Meta didn't tell us which number you picked. Please try again.");
      const res = await complete({ data: { code, wabaId, phoneNumberId } });
      if (res.ok) toast.success(`WhatsApp connected${res.displayPhoneNumber ? ` · ${res.displayPhoneNumber}` : ""}`);
      else toast.error(res.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "WhatsApp setup failed.");
    } finally {
      setBusy(false);
      refresh();
    }
  };

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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {esConfig.data?.configId ? (
            <Button onClick={onEmbeddedSignup} disabled={busy}>
              {busy ? "Connecting…" : "Connect with WhatsApp"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">One-click WhatsApp connect isn't switched on yet.</p>
          )}
          <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setManual((m) => !m)}>
            {manual ? "Hide manual setup" : "Enter details manually"}
          </button>
        </div>
      )}

      {!s.connected && manual && (
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
