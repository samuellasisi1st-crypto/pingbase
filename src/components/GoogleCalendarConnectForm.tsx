import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/design-system";
import { Badge } from "@/components/ui/badge";
import { disconnectGoogleCalendar, getGoogleCalendarStatus, startGoogleCalendarConnect } from "@/lib/channels.functions";

const LABEL: Record<string, string> = {
  NOT_CONNECTED: "Not connected",
  CONNECTED: "Connected",
  ERROR: "Error",
  NEEDS_REAUTH: "Needs reauthorisation",
};

export function GoogleCalendarConnectForm() {
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getGoogleCalendarStatus);
  const start = useServerFn(startGoogleCalendarConnect);
  const disconnect = useServerFn(disconnectGoogleCalendar);
  const status = useQuery({ queryKey: ["google-calendar-status"], queryFn: () => fetchStatus() });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "pingbase-google") return;
      setBusy(false);
      if (e.data.ok) toast.success("Google Calendar connected");
      else toast.error(e.data.message);
      void qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [qc]);

  const onConnect = async () => {
    const popup = window.open("", "pingbase-google", "width=520,height=680");
    if (!popup) return toast.error("Please allow pop-ups and try again.");
    setBusy(true);
    try {
      const { url } = await start({ data: { origin: window.location.origin } });
      popup.location.href = url;
      const poll = window.setInterval(() => {
        if (!popup.closed) return;
        window.clearInterval(poll);
        setBusy(false);
        void qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
      }, 700);
    } catch {
      popup.close();
      setBusy(false);
      toast.error("Couldn't start Google sign-in.");
    }
  };

  const onDisconnect = async () => {
    setBusy(true);
    try {
      await disconnect();
      toast.success("Google Calendar disconnected");
      void qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
    } finally {
      setBusy(false);
    }
  };

  const s = status.data;
  const state = s?.status ?? "NOT_CONNECTED";

  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Google Calendar</p>
          <p className="text-sm text-muted-foreground">
            {state === "CONNECTED"
              ? `Reading busy times from ${s?.email ?? "your Google account"}. Those times are never offered to customers.`
              : "Connect your Google account so times you're busy are never offered to customers."}
          </p>
          {s?.lastError && state !== "CONNECTED" && <p className="mt-1 text-xs text-destructive">{s.lastError}</p>}
          {s && !s.configured && (
            <p className="mt-1 text-xs text-muted-foreground">Google sign-in isn't set up on Pingbase yet.</p>
          )}
        </div>
        <Badge variant={state === "CONNECTED" ? "default" : state === "NOT_CONNECTED" ? "secondary" : "destructive"}>
          {LABEL[state] ?? state}
        </Badge>
      </div>
      <div className="mt-3 flex gap-2">
        {state === "CONNECTED" ? (
          <Button variant="secondary" onClick={onDisconnect} disabled={busy}>Disconnect</Button>
        ) : (
          <Button onClick={onConnect} disabled={busy || !s?.configured}>
            {busy ? "Waiting for Google…" : state === "NOT_CONNECTED" ? "Connect Google Calendar" : "Reconnect"}
          </Button>
        )}
      </div>
    </div>
  );
}
