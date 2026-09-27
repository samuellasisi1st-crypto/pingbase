import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, MessageSquareText, RefreshCw, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Badge, Button, Input, Tabs, Textarea } from "@/design-system";
import {
  createWhatsAppTemplate,
  listWhatsAppTemplates,
  sendWhatsAppTest,
} from "@/lib/channels.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WhatsApp testing — Pingbase" },
      { name: "description", content: "Send WhatsApp messages and manage approved templates with Pingbase." },
      { property: "og:title", content: "WhatsApp testing — Pingbase" },
      { property: "og:description", content: "Send WhatsApp messages and manage approved templates with Pingbase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WhatsAppTestPage,
});

type Notice = { ok: boolean; message: string } | null;
const TEMPLATE_NAME = "appointment_reminder";

function WhatsAppTestPage() {
  const send = useServerFn(sendWhatsAppTest);
  const listTemplates = useServerFn(listWhatsAppTemplates);
  const createTemplate = useServerFn(createWhatsAppTemplate);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("send");
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const templates = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: () => listTemplates(),
    enabled: tab === "templates" && signedIn === true,
  });

  const validNumber = /^\+?\d{7,15}$/.test(to.trim());
  const preset = templates.data?.templates.find((template) => template.name === TEMPLATE_NAME);

  if (signedIn === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-panel p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Sign in to continue</h1>
          <p className="mt-1 text-sm text-secondary">You need to be signed in to send WhatsApp messages.</p>
          <Link
            to="/auth"
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-sm font-semibold text-primary-foreground shadow-button-glow"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  async function submitMessage() {
    setSending(true);
    setNotice(null);
    try {
      const result = await send({ data: { to: to.trim(), mode: "text", text: text.trim() || undefined } });
      setNotice(
        result.ok
          ? { ok: true, message: `Meta accepted the message. ID: ${result.messageId ?? "not returned"}` }
          : { ok: false, message: result.error },
      );
    } catch (error) {
      setNotice({ ok: false, message: error instanceof Error ? error.message : "The message could not be sent." });
    } finally {
      setSending(false);
    }
  }

  async function activateTemplate() {
    setCreating(true);
    setNotice(null);
    try {
      const result = await createTemplate({
        data: {
          name: TEMPLATE_NAME,
          category: "UTILITY",
          language: "en_GB",
          body: "Your appointment at Studio Nine Hair is coming up. Reply to this message if you need help with your booking.",
        },
      });
      if (result.ok) {
        setNotice({ ok: true, message: `Template submitted to Meta. Status: ${result.status}` });
        await queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      } else {
        setNotice({ ok: false, message: result.error });
      }
    } catch (error) {
      setNotice({ ok: false, message: error instanceof Error ? error.message : "The template could not be created." });
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-7">
          <p className="text-label font-semibold text-primary">Pingbase</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">WhatsApp testing</h1>
        </header>

        <Tabs
          items={[
            { value: "send", label: "Send message" },
            { value: "templates", label: "Templates" },
          ]}
          value={tab}
          onChange={(value) => {
            setTab(value);
            setNotice(null);
          }}
          className="mb-6"
        />

        {tab === "send" ? (
          <section aria-labelledby="send-title" className="max-w-md">
            <h2 id="send-title" className="text-lg font-semibold text-foreground">Send a WhatsApp message</h2>
            <p className="mt-1 text-sm text-secondary">Messages are sent from your connected business number.</p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (validNumber && !sending) void submitMessage();
              }}
            >
              <Field label="Send to" htmlFor="recipient">
                <Input
                  id="recipient"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="+447407054474"
                  inputMode="tel"
                  size="lg"
                />
                <p className="mt-1.5 text-caption text-tertiary">Use the full number with country code.</p>
              </Field>
              <Field label="Message" htmlFor="message">
                <Textarea
                  id="message"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Type your message"
                  rows={4}
                />
              </Field>
              <Button type="submit" size="lg" disabled={!validNumber || sending} className="w-full sm:w-auto">
                <Send className="size-4" />
                {sending ? "Sending…" : "Send message"}
              </Button>
              <p className="text-caption text-tertiary">Free-text replies work within 24 hours of the customer’s last message.</p>
            </form>
          </section>
        ) : (
          <section aria-labelledby="templates-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="templates-title" className="text-lg font-semibold text-foreground">WhatsApp templates</h2>
                <p className="mt-1 text-sm text-secondary">Pre-approved messages for reminders sent after 24 hours.</p>
              </div>
              <Button variant="tertiary" size="sm" onClick={() => templates.refetch()} disabled={templates.isFetching}>
                <RefreshCw className={`size-3.5 ${templates.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="mt-6 overflow-hidden rounded-md border border-border bg-panel">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-green-soft text-green-strong">
                    <MessageSquareText className="size-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">Appointment reminder</h3>
                      {preset && <StatusBadge status={preset.status} />}
                    </div>
                    <p className="mt-1 max-w-lg text-sm text-secondary">
                      Your appointment at Studio Nine Hair is coming up. Reply to this message if you need help with your booking.
                    </p>
                    <p className="mt-2 text-caption text-tertiary">Utility · English (UK)</p>
                  </div>
                </div>
                <Button
                  variant={preset ? "secondary" : "primary"}
                  size="sm"
                  disabled={creating || Boolean(preset)}
                  onClick={() => void activateTemplate()}
                >
                  {creating ? "Submitting…" : preset ? "Activated" : "Activate template"}
                </Button>
              </div>
            </div>

            {templates.isLoading && <p className="mt-4 text-sm text-secondary">Loading templates…</p>}
            {templates.data && !templates.data.ok && <Notice ok={false} message={templates.data.error} />}
            {templates.error && <Notice ok={false} message={(templates.error as Error).message} />}

            {(templates.data?.templates.length ?? 0) > 0 && (
              <div className="mt-7">
                <h3 className="text-sm font-semibold text-foreground">Templates on this account</h3>
                <div className="mt-2 divide-y divide-border border-y border-border">
                  {templates.data?.templates.map((template) => (
                    <div key={template.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
                        <p className="text-caption text-tertiary">{template.category.toLowerCase()} · {template.language}</p>
                      </div>
                      <StatusBadge status={template.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {notice && <Notice ok={notice.ok} message={notice.message} />}
      </div>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "APPROVED" ? "green" : status === "REJECTED" ? "red" : "yellow";
  return <Badge variant={variant}>{status}</Badge>;
}

function Notice({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div
      role="status"
      className={`mt-5 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
        ok ? "border-green-strong/15 bg-green-soft text-green-strong" : "border-red-strong/15 bg-red-soft text-red-strong"
      }`}
    >
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}