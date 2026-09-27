import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, CheckCircle2, XCircle } from "lucide-react";
import { sendWhatsAppTest } from "@/lib/channels.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhatsApp test — Pingbase" },
      { name: "description", content: "Send a test WhatsApp message from your connected business number." },
      { property: "og:title", content: "WhatsApp test — Pingbase" },
      { property: "og:description", content: "Send a test WhatsApp message from your connected business number." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WhatsAppTestPage,
});

type Result = { ok: boolean; message: string } | null;

function WhatsAppTestPage() {
  const send = useServerFn(sendWhatsAppTest);
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState<"text" | "template" | null>(null);
  const [result, setResult] = useState<Result>(null);

  const submit = async (mode: "text" | "template") => {
    setSending(mode);
    setResult(null);
    try {
      const r = await send({ data: { to: to.trim(), mode, text: text.trim() || undefined } });
      setResult(
        r.ok
          ? { ok: true, message: `Delivered to WhatsApp (message ID ${r.messageId ?? "—"})` }
          : { ok: false, message: r.error },
      );
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setSending(null);
    }
  };

  const valid = /^\+?\d{7,15}$/.test(to.trim());

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">WhatsApp test</h1>
        <p className="mt-1 text-sm text-secondary">
          Send a message from your connected business number.
        </p>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !sending) submit("text");
          }}
        >
          <div>
            <label htmlFor="to" className="mb-1 block text-sm font-medium text-foreground">
              Send to
            </label>
            <input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="+447407054474"
              inputMode="tel"
              className="h-10 w-full rounded-md border border-border bg-panel px-3 text-sm placeholder:text-tertiary focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-tertiary">Full number with country code, digits only.</p>
          </div>

          <div>
            <label htmlFor="text" className="mb-1 block text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Hi! This is a test from Pingbase."
              className="w-full resize-none rounded-md border border-border bg-panel px-3 py-2 text-sm placeholder:text-tertiary focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!valid || sending !== null}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-primary)] text-sm font-semibold text-white shadow-button-glow transition hover:brightness-105 active:brightness-95 disabled:opacity-50"
          >
            <Send className="size-4" />
            {sending === "text" ? "Sending…" : "Send message"}
          </button>

          <button
            type="button"
            disabled={!valid || sending !== null}
            onClick={() => submit("template")}
            className="h-10 w-full rounded-full border border-border bg-panel text-sm font-medium text-foreground transition hover:bg-hover disabled:opacity-50"
          >
            {sending === "template" ? "Sending…" : "Send hello_world template instead"}
          </button>

          <p className="text-xs text-tertiary">
            Free-text messages only deliver if the customer messaged you in the last 24 hours.
            Otherwise use the template button.
          </p>

          {result && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                result.ok
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
