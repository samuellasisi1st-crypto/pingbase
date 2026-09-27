import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Bot, Send, User } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatSalonDateTime, money } from "@/lib/time";
import { sendHumanReply, setHandlingMode } from "@/lib/concierge.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inbox — Studio Nine concierge" },
      { name: "description", content: "Every customer conversation across every channel, handled by AI with human takeover." },
      { property: "og:title", content: "Inbox — Studio Nine concierge" },
      { property: "og:description", content: "Every customer conversation across every channel, handled by AI with human takeover." },
    ],
  }),
  component: InboxPage,
});

const FILTERS = [
  "All",
  "AI Handling",
  "Needs Attention",
  "Human Handling",
  "Unassigned",
  "Unread",
  "Booking Enquiries",
  "Awaiting Customer",
  "Awaiting Payment",
  "Confirmed",
] as const;

const CHANNELS = ["all", "test", "instagram", "messenger", "whatsapp", "telegram", "gmail", "outlook"];

type Conversation = {
  id: string;
  channel: string;
  state: string;
  handling_mode: string;
  intent: string | null;
  unread: boolean;
  needs_attention: boolean;
  assigned_to: string | null;
  last_message_at: string;
  contact: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
};

function InboxPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [channel, setChannel] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

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
        .from("messages")
        .select("conversation_id, body, created_at, direction")
        .neq("direction", "internal")
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const m of data ?? []) if (!map[m.conversation_id]) map[m.conversation_id] = m.body;
      return map;
    },
  });

  useEffect(() => {
    const channelSub = supabase
      .channel("inbox-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: ["message-previews"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversation-detail"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [queryClient]);

  const list = useMemo(() => {
    const all = conversations.data ?? [];
    return all.filter((c) => {
      if (channel !== "all" && c.channel !== channel) return false;
      switch (filter) {
        case "AI Handling":
          return c.handling_mode === "AI";
        case "Needs Attention":
          return c.needs_attention;
        case "Human Handling":
          return c.handling_mode === "HUMAN";
        case "Unassigned":
          return !c.assigned_to;
        case "Unread":
          return c.unread;
        case "Booking Enquiries":
          return ["DISCOVERY", "COLLECTING_REQUIREMENTS", "CHECKING_AVAILABILITY", "AWAITING_SLOT_SELECTION"].includes(c.state);
        case "Awaiting Customer":
          return ["AWAITING_SLOT_SELECTION", "AWAITING_DETAILS"].includes(c.state);
        case "Awaiting Payment":
          return c.state === "AWAITING_PAYMENT";
        case "Confirmed":
          return c.state === "BOOKED" || c.state === "COMPLETED";
        default:
          return true;
      }
    });
  }, [conversations.data, filter, channel]);

  useEffect(() => {
    if (!activeId && list[0]) setActiveId(list[0].id);
  }, [list, activeId]);

  return (
    <AppShell title="Unified inbox">
      <div className="grid h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-[22rem_1fr]">
        <div className="flex min-h-0 flex-col border-r bg-surface">
          <div className="space-y-2 border-b p-3">
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:bg-hover"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${
                    channel === c ? "border-accent bg-accent/20" : "border-border text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
            {!conversations.isLoading && list.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                No conversations yet. Open the test chat and send a message as a customer.
              </p>
            )}
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`block w-full border-b px-4 py-3 text-left transition-colors hover:bg-surface-muted ${
                  activeId === c.id ? "bg-surface-muted" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{c.contact?.full_name ?? "New customer"}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatSalonDateTime(c.last_message_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {previews.data?.[c.id] ?? "…"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <Badge variant="outline" className="capitalize">{c.channel}</Badge>
                  <Badge variant={c.handling_mode === "AI" ? "secondary" : "default"}>{c.handling_mode}</Badge>
                  {c.needs_attention && <Badge variant="destructive">Needs attention</Badge>}
                  {c.unread && <Badge className="bg-accent text-accent-foreground">Unread</Badge>}
                  <span className="text-[11px] text-muted-foreground">{c.state.replaceAll("_", " ").toLowerCase()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeId ? (
          <ConversationPane conversationId={activeId} />
        ) : (
          <div className="flex items-center justify-center text-muted-foreground">Select a conversation</div>
        )}
      </div>
    </AppShell>
  );
}

function ConversationPane({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const detail = useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: async () => {
      const [conversation, messages, handoffs, actions] = await Promise.all([
        supabase
          .from("conversations")
          .select("*, contact:contact_id(*)")
          .eq("id", conversationId)
          .single(),
        supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at"),
        supabase
          .from("handoffs")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false }),
        supabase
          .from("ai_action_logs")
          .select("tool_name,success,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);
      const contactId = (conversation.data?.contact as { id: string } | null)?.id;
      const appointments = contactId
        ? await supabase
            .from("appointments")
            .select("*, service:service_id(name), staff:staff_id(name)")
            .eq("contact_id", contactId)
            .order("starts_at")
        : { data: [] };
      return {
        conversation: conversation.data,
        messages: messages.data ?? [],
        handoffs: handoffs.data ?? [],
        actions: actions.data ?? [],
        appointments: (appointments.data ?? []) as never[],
      };
    },
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] });
  }, [conversationId, queryClient]);

  useEffect(() => {
    const sub = supabase
      .channel(`conv-${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, () =>
        queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [conversationId, queryClient]);

  const reply = useMutation({
    mutationFn: (body: string) => sendHumanReply({ data: { conversationId, body } }),
    onSuccess: (result) => {
      setDraft("");
      if (!result.delivered) toast.warning("Saved, but this channel is not connected yet so it was not delivered.");
      queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send"),
  });

  const mode = useMutation({
    mutationFn: (m: "AI" | "HUMAN" | "PAUSED") => setHandlingMode({ data: { conversationId, mode: m } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  if (detail.isLoading || !detail.data?.conversation) {
    return <div className="flex items-center justify-center text-muted-foreground">Loading conversation…</div>;
  }

  const c = detail.data.conversation as never as {
    handling_mode: string;
    state: string;
    channel: string;
    intent: string | null;
    contact: { full_name: string | null; email: string | null; phone: string | null; created_at: string; notes: string | null };
  };
  const openHandoff = detail.data.handoffs.find((h) => h.status === "OPEN");

  return (
    <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[1fr_20rem]">
      <div className="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-surface px-5 py-3">
          <div>
            <p className="font-medium">{c.contact?.full_name ?? "New customer"}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {c.channel} · {c.state.replaceAll("_", " ").toLowerCase()} · {c.intent ?? "intent unknown"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={c.handling_mode === "AI" ? "secondary" : "default"}>
              {c.handling_mode === "AI" ? "AI handling" : c.handling_mode === "HUMAN" ? "You are handling" : "AI paused"}
            </Badge>
            {c.handling_mode !== "HUMAN" ? (
              <Button size="sm" onClick={() => mode.mutate("HUMAN")}>Take over</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => mode.mutate("AI")}>Return to AI</Button>
            )}
          </div>
        </div>

        {openHandoff && (
          <div className="border-b bg-warning/15 px-5 py-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4" /> Handed over: {openHandoff.reason}
            </p>
            <p className="mt-1 text-muted-foreground">{openHandoff.summary}</p>
            {openHandoff.recommended_action && (
              <p className="mt-1 text-muted-foreground">Suggested: {openHandoff.recommended_action}</p>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {detail.data.messages.map((m) => (
            <div key={m.id} className={m.direction === "outbound" ? "flex justify-end" : "flex justify-start"}>
              {m.direction === "internal" ? (
                <div className="w-full rounded-lg border border-dashed bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
                  Internal note · {m.body}
                </div>
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.direction === "outbound"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-surface-muted"
                  }`}
                >
                  <p className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                    {m.direction === "outbound" ? (
                      m.sender_type === "AI" ? <Bot className="size-3" /> : <User className="size-3" />
                    ) : null}
                    {m.direction === "outbound" ? (m.sender_type === "AI" ? "Nia" : m.sender_name ?? "Team") : "Customer"} ·{" "}
                    {formatSalonDateTime(m.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <form
          className="flex gap-2 border-t bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) reply.mutate(draft.trim());
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={c.handling_mode === "AI" ? "Replying takes the conversation off the AI…" : "Write a reply…"}
          />
          <Button type="submit" size="icon" disabled={reply.isPending || !draft.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      <aside className="hidden min-h-0 space-y-5 overflow-y-auto border-l bg-surface p-5 text-sm xl:block">
        <section>
          <h3 className="font-display text-base">Customer</h3>
          <p className="mt-1">{c.contact?.full_name ?? "Name not given yet"}</p>
          <p className="text-muted-foreground">{c.contact?.email ?? "No email"}</p>
          <p className="text-muted-foreground">{c.contact?.phone ?? "No phone"}</p>
        </section>

        <section>
          <h3 className="font-display text-base">Appointments</h3>
          {detail.data.appointments.length === 0 && <p className="text-muted-foreground">None yet</p>}
          {(detail.data.appointments as unknown as Array<{
            id: string;
            starts_at: string;
            status: string;
            deposit_status: string;
            price_pence: number;
            service: { name: string };
            staff: { name: string };
          }>).map((a) => (
            <div key={a.id} className="mt-2 rounded-lg border p-3">
              <p className="font-medium">{a.service?.name}</p>
              <p className="text-muted-foreground">{formatSalonDateTime(a.starts_at)} · {a.staff?.name}</p>
              <p className="mt-1 flex gap-1">
                <Badge variant={a.status === "CONFIRMED" ? "default" : "secondary"}>{a.status}</Badge>
                <Badge variant="outline">{money(a.price_pence)}</Badge>
                <Badge variant="outline">deposit {a.deposit_status.toLowerCase()}</Badge>
              </p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="font-display text-base">Recent AI actions</h3>
          {detail.data.actions.length === 0 && <p className="text-muted-foreground">No tool calls yet</p>}
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {detail.data.actions.map((a, i) => (
              <li key={i}>
                {a.success ? "✓" : "✕"} {a.tool_name} · {formatSalonDateTime(a.created_at)}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
