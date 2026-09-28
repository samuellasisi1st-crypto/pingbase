import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle, Bot, Search, Plus, Filter, SlidersHorizontal, Inbox as InboxIcon, UserCheck, ChevronLeft,
  MailOpen, CalendarClock, CreditCard, CheckCircle2, Send, Clock, Users, PanelRightOpen, PanelLeftClose, PanelLeftOpen, X,
} from "lucide-react";

import { AppShell, SideItem, SideLabel } from "@/components/AppShell";
import { ChatComposerTools } from "@/components/ChatComposerTools";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/design-system/components/Avatar";
import { Badge } from "@/design-system/components/Badge";
import { Button } from "@/design-system/components/Button";
import { AIHandlingPill } from "@/design-system/components/AIHandlingPill";
import { Tabs } from "@/design-system/components/Tabs";
import { formatSalonDateTime, money } from "@/lib/time";
import { sendHumanReply, setHandlingMode } from "@/lib/concierge.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inbox — Pingbase" },
      { name: "description", content: "Every customer conversation across every channel, handled by AI with human takeover." },
      { property: "og:title", content: "Inbox — Pingbase" },
      { property: "og:description", content: "Every customer conversation across every channel, handled by AI with human takeover." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InboxPage,
});

type View = "all" | "attention" | "ai" | "human" | "unread" | "booking" | "payment" | "confirmed";
const VIEWS: { v: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { v: "all", label: "All conversations", icon: InboxIcon },
  { v: "attention", label: "Needs attention", icon: AlertTriangle },
  { v: "ai", label: "AI handling", icon: Bot },
  { v: "human", label: "Assigned to team", icon: UserCheck },
  { v: "unread", label: "Unread", icon: MailOpen },
  { v: "booking", label: "Booking enquiries", icon: CalendarClock },
  { v: "payment", label: "Awaiting payment", icon: CreditCard },
  { v: "confirmed", label: "Confirmed", icon: CheckCircle2 },
];
const CHANNELS = ["instagram", "messenger", "whatsapp", "telegram", "gmail", "outlook"];
const CH_LABEL: Record<string, string> = {
  instagram: "Instagram", messenger: "Messenger", whatsapp: "WhatsApp", telegram: "Telegram",
  gmail: "Email", outlook: "Email", test: "Test chat",
};
const CH_DOT: Record<string, string> = {
  instagram: "bg-purple-500", messenger: "bg-cyan-500", whatsapp: "bg-green-500",
  telegram: "bg-cyan-400", gmail: "bg-red-500", outlook: "bg-cyan-600", test: "bg-yellow-400",
};
const DONE = ["BOOKED", "COMPLETED"];

type Conversation = {
  id: string; channel: string; state: string; handling_mode: string; intent: string | null;
  unread: boolean; needs_attention: boolean; assigned_to: string | null; last_message_at: string;
  contact: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
};

const human = (s: string) => s.replaceAll("_", " ").toLowerCase().replace(/^./, (x) => x.toUpperCase());
function stateBadge(c: Pick<Conversation, "state" | "needs_attention">) {
  if (c.needs_attention) return <Badge variant="yellow">Needs human</Badge>;
  if (DONE.includes(c.state)) return <Badge variant="green">Confirmed</Badge>;
  if (c.state === "AWAITING_PAYMENT") return <Badge variant="purple">Awaiting payment</Badge>;
  return <Badge variant="cyan">{human(c.state)}</Badge>;
}
function shortTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Now";
  if (diff < 86_400_000 && new Date().getDate() === d.getDate())
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  if (diff < 2 * 86_400_000) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/London" });
}

function InboxPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("all");
  const [channel, setChannel] = useState<string | null>(null);
  const [tab, setTab] = useState("open");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewsOpen, setViewsOpen] = useState(true);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,channel,state,handling_mode,intent,unread,needs_attention,assigned_to,last_message_at,contact:contact_id(id,full_name,email,phone)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Conversation[];
    },
  });

  const previews = useQuery({
    queryKey: ["message-previews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages").select("conversation_id, body, created_at, direction")
        .neq("direction", "internal").order("created_at", { ascending: false }).limit(400);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const m of data ?? []) if (!map[m.conversation_id]) map[m.conversation_id] = m.body;
      return map;
    },
  });

  useEffect(() => {
    const sub = supabase
      .channel("inbox-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: ["message-previews"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () =>
        queryClient.invalidateQueries({ queryKey: ["conversations"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () =>
        queryClient.invalidateQueries({ queryKey: ["conversation-detail"] }))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [queryClient]);

  const matches = (c: Conversation, v: View) => {
    switch (v) {
      case "attention": return c.needs_attention;
      case "ai": return c.handling_mode === "AI";
      case "human": return c.handling_mode === "HUMAN";
      case "unread": return c.unread;
      case "booking": return ["DISCOVERY", "COLLECTING_REQUIREMENTS", "CHECKING_AVAILABILITY", "AWAITING_SLOT_SELECTION", "AWAITING_DETAILS"].includes(c.state);
      case "payment": return c.state === "AWAITING_PAYMENT";
      case "confirmed": return DONE.includes(c.state);
      default: return true;
    }
  };

  const all = conversations.data ?? [];
  const list = useMemo(() => all.filter((c) => {
    if (channel && c.channel !== channel) return false;
    if (!matches(c, view)) return false;
    if (tab === "open" && DONE.includes(c.state)) return false;
    if (tab === "snoozed" && c.handling_mode !== "PAUSED") return false;
    if (tab === "done" && !DONE.includes(c.state)) return false;
    if (q && !`${c.contact?.full_name ?? ""} ${previews.data?.[c.id] ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [all, channel, view, tab, q, previews.data]);

  useEffect(() => {
    if (!activeId && list[0] && window.matchMedia("(min-width: 1024px)").matches) setActiveId(list[0].id);
  }, [activeId, list]);

  const secondary = (
    <>
      {VIEWS.map((x) => (
        <SideItem key={x.v} icon={x.icon} label={x.label} active={view === x.v && !channel}
          count={all.filter((c) => matches(c, x.v)).length || undefined}
          onClick={() => { setView(x.v); setChannel(null); }} />
      ))}
      <SideLabel>Channels</SideLabel>
      {CHANNELS.map((ch) => {
        const n = all.filter((c) => c.channel === ch).length;
        return (
          <button key={ch} onClick={() => { setChannel(ch); setView("all"); }}
            className={`flex h-8 w-full items-center gap-2 rounded-md border px-2.5 text-[12px] font-normal ${channel === ch ? "border-border bg-panel text-foreground shadow-xs" : "border-transparent text-secondary hover:bg-hover"}`}>
            <span className={`size-2 rounded-full ${CH_DOT[ch]}`} />
            <span className="flex-1 text-left">{ch === "gmail" ? "Gmail" : ch === "outlook" ? "Outlook" : CH_LABEL[ch]}</span>
            {n > 0 && <span className="text-[11px] text-tertiary">{n}</span>}
          </button>
        );
      })}
    </>
  );

  return (
    <AppShell secondary={secondary} secondaryOpen={viewsOpen}>
      <div className="grid h-full min-h-0 min-w-0 grid-cols-1 overflow-x-hidden lg:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)]">
        <div className={`${activeId ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-border-subtle bg-panel`}>
          <div className="flex items-center justify-between px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
            <div className="flex min-w-0 items-center gap-1.5">
              <Button type="button" title={viewsOpen ? "Collapse inbox views" : "Expand inbox views"} aria-label={viewsOpen ? "Collapse inbox views" : "Expand inbox views"} size="sm" variant="tertiary" className="hidden px-1.5 lg:inline-flex" onClick={() => setViewsOpen((open) => !open)}>
                {viewsOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </Button>
              <p className="truncate text-[15px] font-semibold text-foreground">
                {channel ? CH_LABEL[channel] : VIEWS.find((x) => x.v === view)?.label}{" "}
                <span className="text-[13px] font-normal text-tertiary">{list.length}</span>
              </p>
            </div>
            <a href="/chat" target="_blank" rel="noreferrer" aria-label="New test conversation"
              className="grid size-8 place-items-center rounded-lg bg-primary text-panel shadow-control hover:bg-primary-hover">
              <Plus className="size-4" />
            </a>
          </div>
          <div className="-mt-1 flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">{VIEWS.map((item) => <button key={item.v} type="button" onClick={() => { setView(item.v); setChannel(null); }} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] ${view === item.v && !channel ? "border-border-strong bg-hover text-foreground" : "border-border-subtle text-secondary"}`}>{item.label}</button>)}</div>
          <div className="px-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-tertiary" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations…"
                 className="h-9 w-full rounded-lg border border-border bg-panel pl-8 pr-2 text-[13px] shadow-xs placeholder:text-tertiary focus:border-primary focus:outline-none" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Tabs value={tab} onChange={setTab} items={[{ value: "open", label: "Open" }, { value: "snoozed", label: "Paused" }, { value: "done", label: "Done" }]} />
              <Filter className="size-4 text-tertiary" />
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 text-[12px] text-tertiary">
            Newest first <SlidersHorizontal className="size-3.5" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.isLoading && <p className="p-4 text-[13px] text-tertiary">Loading…</p>}
            {!conversations.isLoading && list.length === 0 && (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <MailOpen className="size-10 text-tertiary" />
                <p className="mt-3 text-[14px] font-semibold text-foreground">You're all caught up</p>
                <p className="mt-1 text-[13px] text-secondary">Nothing here right now. Nia is watching every channel.</p>
              </div>
            )}
            {list.map((c) => {
              const name = c.contact?.full_name ?? "New customer";
              const selected = activeId === c.id;
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                   className={`flex w-full gap-3 border-b border-border-subtle px-5 py-3.5 text-left transition-colors ${selected ? "bg-panel shadow-[inset_3px_0_0_var(--action-primary)]" : "hover:bg-hover"}`}>
                  <span className="relative shrink-0">
                    <Avatar name={name} size="lg" />
                    <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-panel ${CH_DOT[c.channel] ?? "bg-gray-400"}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14px] font-semibold text-foreground">{name}</span>
                      <span className="shrink-0 text-[11px] text-tertiary">{shortTime(c.last_message_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-medium text-secondary">
                      {c.intent ? human(c.intent) : CH_LABEL[c.channel]} · {CH_LABEL[c.channel]}
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-tertiary">{previews.data?.[c.id] ?? "…"}</span>
                      {c.unread && <span className="grid size-4 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-panel">1</span>}
                    </span>
                    <span className="mt-1.5 block">{stateBadge(c)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="border-t border-border-subtle py-2 text-center text-[12px] text-tertiary">Showing {list.length} conversations</p>
        </div>

        {activeId ? <ConversationPane conversationId={activeId} onBack={() => setActiveId(null)} /> : (
          <div className="hidden items-center justify-center text-tertiary lg:flex">Select a conversation</div>
        )}
      </div>
    </AppShell>
  );
}

type Appt = { id: string; starts_at: string; status: string; deposit_status: string; price_pence: number; service: { name: string } | null; staff: { name: string } | null };

function ConversationPane({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);

  const detail = useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: async () => {
      const [conversation, messages, handoffs, actions] = await Promise.all([
        supabase.from("conversations").select("*, contact:contact_id(*)").eq("id", conversationId).single(),
        supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at"),
        supabase.from("handoffs").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: false }),
        supabase.from("ai_action_logs").select("tool_name,success,created_at").eq("conversation_id", conversationId)
          .order("created_at", { ascending: false }).limit(12),
      ]);
      const contactId = (conversation.data?.contact as { id: string } | null)?.id;
      const appointments = contactId
        ? await supabase.from("appointments").select("*, service:service_id(name), staff:staff_id(name)").eq("contact_id", contactId).order("starts_at")
        : { data: [] };
      return {
        conversation: conversation.data,
        messages: messages.data ?? [],
        handoffs: handoffs.data ?? [],
        actions: actions.data ?? [],
        appointments: (appointments.data ?? []) as unknown as Appt[],
      };
    },
  });

  useEffect(() => {
    const sub = supabase
      .channel(`conv-${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, () =>
        queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] }))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [conversationId, queryClient]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const reply = useMutation({
    mutationFn: (body: string) => sendHumanReply({ data: { conversationId, body } }),
    onSuccess: (result) => {
      setDraft("");
      if (!result.delivered) toast.warning("Saved, but this channel is not connected yet so it was not delivered.");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send"),
  });

  const mode = useMutation({
    mutationFn: (m: "AI" | "HUMAN" | "PAUSED") => setHandlingMode({ data: { conversationId, mode: m } }),
    onSuccess: refresh,
  });

  if (detail.isLoading || !detail.data?.conversation) {
    return <div className="flex items-center justify-center text-tertiary">Loading conversation…</div>;
  }

  const c = detail.data.conversation as never as {
    handling_mode: string; state: string; channel: string; intent: string | null; needs_attention: boolean;
    contact: { full_name: string | null; email: string | null; phone: string | null; notes: string | null; ai_summary: string | null; tags: string[] | null } | null;
  };
  const name = c.contact?.full_name ?? "New customer";
  const openHandoff = detail.data.handoffs.find((h) => h.status === "OPEN");
  const next = detail.data.appointments.find((a) => new Date(a.starts_at) > new Date() && a.status !== "CANCELLED");
  const pill = c.needs_attention ? "attention" : c.handling_mode === "AI" ? "handling" : c.handling_mode === "HUMAN" ? "human" : "paused";

  let lastDay = "";

  return (
    <div className={`relative grid min-h-0 min-w-0 grid-cols-1 overflow-x-hidden bg-panel-subtle ${customerOpen ? "xl:grid-cols-[minmax(0,1fr)_18rem]" : ""}`}>
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border-subtle bg-panel px-4 py-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button title="Back to conversations" aria-label="Back to conversations" size="sm" variant="tertiary" className="lg:hidden" onClick={onBack}><ChevronLeft className="size-4"/></Button>
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-foreground">{name}</p>
              <p className="truncate text-[12px] text-secondary">{CH_LABEL[c.channel]} · {c.intent ? human(c.intent) : human(c.state)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <span className="hidden sm:block"><AIHandlingPill state={pill} /></span>
             <Button title="Pause AI" aria-label="Pause AI" size="sm" variant="tertiary" onClick={() => mode.mutate("PAUSED")}><Clock className="size-4" /></Button>
            {c.handling_mode !== "HUMAN" && (
              <Button size="sm" variant="secondary" title="Take over" onClick={() => mode.mutate("HUMAN")}><Users className="size-3.5" /><span className="hidden sm:inline">Take over</span></Button>
            )}
            {c.handling_mode !== "AI" && (
              <Button size="sm" title="Return to AI" onClick={() => mode.mutate("AI")}><Bot className="size-3.5" /><span className="hidden sm:inline">Return to AI</span></Button>
            )}
            {!customerOpen && <Button title="Show customer details" aria-label="Show customer details" size="sm" variant="tertiary" onClick={() => setCustomerOpen(true)}><PanelRightOpen className="size-4" /></Button>}
          </div>
        </div>

        {openHandoff && (
          <div className="mx-4 mt-4 rounded-lg border border-yellow-strong/25 bg-yellow-soft px-4 py-3 text-[13px] sm:mx-6">
            <p className="flex items-center gap-2 font-semibold text-foreground"><AlertTriangle className="size-4" /> Handed over: {openHandoff.reason}</p>
            <p className="mt-1 text-secondary">{openHandoff.summary}</p>
            {openHandoff.recommended_action && <p className="mt-1 text-secondary">Suggested: {openHandoff.recommended_action}</p>}
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-app px-4 py-4 sm:px-8 sm:py-6">
          {detail.data.messages.map((m) => {
            const day = new Date(m.created_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
            const showDay = day !== lastDay;
            lastDay = day;
            const time = new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
            return (
              <div key={m.id}>
                {showDay && <p className="py-2 text-center text-[12px] text-tertiary">{day}</p>}
                {m.direction === "internal" ? (
                  <p className="flex items-center gap-2 text-[12px] text-secondary"><Bot className="size-3.5 text-primary" /> {m.body}</p>
                ) : (
                  <div className={m.direction === "outbound" ? "flex justify-end" : "flex justify-start"}>
                     <div className={`max-w-[88%] rounded-xl border px-3.5 py-2.5 text-[14px] shadow-xs sm:max-w-[72%] ${m.direction === "outbound" ? "border-outbound-border bg-outbound text-foreground" : "border-border-subtle bg-panel-subtle text-foreground"}`}>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 text-right text-[11px] text-tertiary">
                        {time}{m.direction === "outbound" && ` · ${m.sender_type === "AI" ? "Nia" : m.sender_name ?? "Team"}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form className="bg-panel-subtle p-3 sm:p-4" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) reply.mutate(draft.trim()); }}>
           <div className="rounded-lg border border-border bg-panel shadow-sm focus-within:border-primary">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (draft.trim()) reply.mutate(draft.trim()); } }}
              placeholder={c.handling_mode === "AI" ? `Reply to ${name}… (this takes the conversation off Nia)` : `Reply to ${name}…`}
               className="block w-full resize-none rounded-t-lg bg-transparent px-4 py-3 text-[14px] placeholder:text-tertiary focus:outline-none" />
            <div className="flex items-center justify-between border-t border-border-subtle px-3 py-2">
              <ChatComposerTools conversationId={conversationId} workspaceId={(c as unknown as { workspace_id: string }).workspace_id} draft={draft} setDraft={setDraft} onSent={refresh} />
              <Button type="submit" size="sm" disabled={reply.isPending || !draft.trim()}><Send className="mr-1.5 size-3.5" />Send</Button>
            </div>
          </div>
        </form>
      </div>

      {customerOpen && <aside className="fixed inset-0 z-40 min-h-0 overflow-y-auto bg-panel pb-20 sm:left-auto sm:w-80 sm:border-l sm:border-border-subtle lg:absolute lg:inset-y-0 lg:right-0 lg:pb-0 xl:static xl:block xl:w-auto">
         <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4 text-[14px] font-semibold text-foreground">Customer<Button title="Close customer details" aria-label="Close customer details" size="sm" variant="tertiary" onClick={() => setCustomerOpen(false)}><X className="size-4" /></Button></div>
        <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
          <Avatar name={name} size="lg" />
          <div><p className="text-[15px] font-semibold text-foreground">{name}</p><p className="text-[12px] text-secondary">{CH_LABEL[c.channel]}</p></div>
        </div>
        <Section title="Booking">
          {next ? (
            <>
              <p className="text-[14px] font-medium text-foreground">{next.service?.name} · {next.staff?.name}</p>
              <p className="mt-0.5 text-[12px] text-secondary">{formatSalonDateTime(next.starts_at)} · {money(next.price_pence)}</p>
              <div className="mt-2 flex gap-1.5">
                <Badge variant={next.status === "CONFIRMED" ? "green" : "yellow"}>{human(next.status)}</Badge>
                <Badge>Deposit {next.deposit_status.toLowerCase()}</Badge>
              </div>
            </>
          ) : <p className="text-[13px] text-secondary">No upcoming booking</p>}
          <div className="mt-2">{stateBadge(c)}</div>
        </Section>
        <Section title="AI summary"><p className="text-[13px] leading-relaxed text-secondary">{c.contact?.ai_summary || "No summary yet."}</p></Section>
        <Section title="Attributes">
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-2"><dt className="text-secondary">Email</dt><dd className="truncate text-foreground">{c.contact?.email ?? "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-secondary">Phone</dt><dd className="text-foreground">{c.contact?.phone ?? "—"}</dd></div>
          </dl>
          {c.contact?.tags?.length ? <div className="mt-2 flex flex-wrap gap-1">{c.contact.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div> : null}
        </Section>
        <Section title="Customer notes"><p className="text-[13px] text-secondary">{c.contact?.notes || "No notes yet."}</p></Section>
        <Section title="Recent activity">
          {detail.data.actions.length === 0 && <p className="text-[13px] text-tertiary">No AI actions yet</p>}
          <ul className="space-y-1.5 text-[12px] text-secondary">
            {detail.data.actions.slice(0, 6).map((a, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>{a.success ? "✓" : "✕"} {human(a.tool_name)}</span>
                <span className="text-tertiary">{shortTime(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </aside>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border-subtle px-5 py-4">
      <h3 className="mb-2 text-[13px] font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}
