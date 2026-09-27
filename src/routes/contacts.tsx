import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatSalonDateTime } from "@/lib/time";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Pink OS" },
      { name: "description", content: "One customer profile per person, linked across every channel they message from." },
      { property: "og:title", content: "Contacts — Pink OS" },
      { property: "og:description", content: "One customer profile per person, linked across every channel they message from." },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const contacts = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, channels:contact_channels(channel,external_id,verified)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const detail = useQuery({
    queryKey: ["contact-detail", selected],
    enabled: Boolean(selected),
    queryFn: async () => {
      const [conversations, appointments] = await Promise.all([
        supabase.from("conversations").select("id,channel,state,handling_mode,last_message_at").eq("contact_id", selected!).order("last_message_at", { ascending: false }),
        supabase.from("appointments").select("id,starts_at,status,service:service_id(name)").eq("contact_id", selected!).order("starts_at", { ascending: false }),
      ]);
      return { conversations: conversations.data ?? [], appointments: appointments.data ?? [] };
    },
  });

  const rows = (contacts.data ?? []).filter((c) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return [c.full_name, c.email, c.phone].some((v) => (v ?? "").toLowerCase().includes(term));
  });

  return (
    <AppShell title="Contacts">
      <div className="grid h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-[24rem_1fr]">
        <div className="flex min-h-0 flex-col border-r bg-surface">
          <div className="border-b p-3">
            <Input placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">No contacts yet.</p>}
            {(rows as unknown as Array<{
              id: string;
              full_name: string | null;
              email: string | null;
              phone: string | null;
              created_at: string;
              channels: Array<{ channel: string; verified: boolean }>;
            }>).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`block w-full border-b px-4 py-3 text-left hover:bg-surface-muted ${selected === c.id ? "bg-surface-muted" : ""}`}
              >
                <p className="font-medium">{c.full_name ?? "Unnamed customer"}</p>
                <p className="text-xs text-muted-foreground">{c.email ?? c.phone ?? "No contact details"}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.channels?.map((ch, i) => (
                    <Badge key={i} variant="outline" className="capitalize">
                      {ch.channel}
                      {ch.verified ? " ✓" : ""}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-6">
          {!selected && <p className="text-sm text-muted-foreground">Select a contact to see their full history.</p>}
          {selected && detail.data && (
            <div className="space-y-6">
              <section>
                <h2 className="font-display text-lg">Conversations</h2>
                {detail.data.conversations.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
                <div className="mt-2 space-y-2">
                  {detail.data.conversations.map((c) => (
                    <div key={c.id} className="rounded-lg border bg-surface p-3 text-sm">
                      <span className="capitalize">{c.channel}</span> · {c.state.replaceAll("_", " ").toLowerCase()} ·{" "}
                      {c.handling_mode} · {formatSalonDateTime(c.last_message_at)}
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h2 className="font-display text-lg">Appointments</h2>
                {detail.data.appointments.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
                <div className="mt-2 space-y-2">
                  {(detail.data.appointments as unknown as Array<{ id: string; starts_at: string; status: string; service: { name: string } | null }>).map((a) => (
                    <div key={a.id} className="rounded-lg border bg-surface p-3 text-sm">
                      {a.service?.name} · {formatSalonDateTime(a.starts_at)} · {a.status}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
