import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/time";
import { getCustomerThread, payDepositTestMode, sendCustomerMessage } from "@/lib/concierge.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Message Studio Nine Hair" },
      { name: "description", content: "Chat with the Studio Nine Hair booking concierge and book a real appointment." },
      { property: "og:title", content: "Message Studio Nine Hair" },
      { property: "og:description", content: "Chat with the Studio Nine Hair booking concierge and book a real appointment." },
    ],
  }),
  component: CustomerChat,
});

function useVisitorId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let value = localStorage.getItem("s9-visitor-id");
    if (!value) {
      value = `visitor-${crypto.randomUUID()}`;
      localStorage.setItem("s9-visitor-id", value);
    }
    setId(value);
  }, []);
  return id;
}

function CustomerChat() {
  const visitorId = useVisitorId();
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const bottom = useRef<HTMLDivElement>(null);

  const thread = useQuery({
    queryKey: ["customer-thread", visitorId],
    enabled: Boolean(visitorId),
    refetchInterval: 4000,
    queryFn: () => getCustomerThread({ data: { visitorId: visitorId! } }),
  });

  const send = useMutation({
    mutationFn: (body: string) => sendCustomerMessage({ data: { visitorId: visitorId!, body } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-thread", visitorId] }),
    onError: () => toast.error("Message could not be delivered. Please try again."),
  });

  const pay = useMutation({
    mutationFn: (paymentId: string) => payDepositTestMode({ data: { paymentId } }),
    onSuccess: () => {
      toast.success("Deposit recorded");
      queryClient.invalidateQueries({ queryKey: ["customer-thread", visitorId] });
    },
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data?.messages?.length, send.isPending]);

  const messages = thread.data?.messages ?? [];
  const pendingPayments = (thread.data?.payments ?? []).filter((p) => p.status === "PENDING");

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-surface">
      <header className="border-b px-6 py-5">
        <h1 className="font-display text-2xl">Studio Nine Hair</h1>
        <p className="text-sm text-muted-foreground">
          Message us about braids, colour or a silk press — Nia replies right away.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">
            Try: “Hey, can I get knotless braids Saturday afternoon?”
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.direction === "inbound" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.direction === "inbound"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm"
              }
            >
              {m.direction === "outbound" && (
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  {m.sender_type === "HUMAN" ? `${m.sender_name ?? "Salon team"} (salon)` : "Nia"}
                </p>
              )}
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          </div>
        ))}
        {send.isPending && <p className="text-xs text-muted-foreground">Nia is typing…</p>}

        {pendingPayments.map((p) => (
          <div key={p.id} className="rounded-xl border border-accent/50 bg-accent/10 p-4">
            <p className="text-sm font-semibold">Deposit due: {money(p.amount_pence)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.provider === "test"
                ? "Stripe is not connected for this salon yet, so this is a test-mode deposit."
                : "Secure Stripe checkout."}
            </p>
            <Button
              size="sm"
              className="mt-3"
              disabled={pay.isPending}
              onClick={() => pay.mutate(p.id)}
            >
              Pay deposit
            </Button>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      <form
        className="flex gap-2 border-t p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body || !visitorId) return;
          setDraft("");
          send.mutate(body);
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          autoFocus
        />
        <Button type="submit" size="icon" disabled={send.isPending || !draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
