import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Filter, Columns3, Settings2, Plus, BookUser, Link2, Star, X } from "lucide-react";

import { AppShell, Page, PageHeader, SideItem, SideLabel, EmptyState } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/design-system/components/Avatar";
import { Badge } from "@/design-system/components/Badge";
import { Button } from "@/design-system/components/Button";
import { formatSalonDateTime } from "@/lib/time";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Pink OS" },
      { name: "description", content: "One customer profile per person, linked across every channel they message from." },
      { property: "og:title", content: "Contacts — Pink OS" },
      { property: "og:description", content: "One customer profile per person, linked across every channel they message from." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactsPage,
});

type Contact = {
  id: string; full_name: string | null; email: string | null; phone: string | null; tags: string[] | null;
  notes: string | null; ai_summary: string | null; created_at: string; last_interaction_at: string | null;
  channels: { channel: string; external_id: string; verified: boolean }[];
  conversations: { id: string }[];
};

function ContactsPage() {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"all" | "multi" | "vip">("all");
  const [selected, setSelected] = useState<Contact | null>(null);

  const contacts = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, channels:contact_channels(channel,external_id,verified), conversations(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Contact[];
    },
  });

  const all = contacts.data ?? [];
  const list = useMemo(() => all.filter((c) => {
    if (view === "multi" && new Set(c.channels.map((x) => x.channel)).size < 2) return false;
    if (view === "vip" && !c.tags?.some((t) => /vip|regular/i.test(t))) return false;
    return !q || `${c.full_name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase());
  }), [all, q, view]);

  const secondary = (
    <>
      <p className="mb-3 px-2 text-[13px] text-secondary">Views</p>
      <SideItem icon={Users} label="All contacts" active={view === "all"} count={all.length} onClick={() => setView("all")} />
      <SideLabel>Saved contact filters</SideLabel>
      <SideItem icon={Link2} label="Linked across channels" active={view === "multi"} onClick={() => setView("multi")} />
      <SideItem icon={Star} label="Regulars & VIPs" active={view === "vip"} onClick={() => setView("vip")} />
    </>
  );

  return (
    <AppShell secondary={secondary}>
      <Page>
        <PageHeader
          title={view === "all" ? "All contacts" : view === "multi" ? "Linked across channels" : "Regulars & VIPs"}
          subtitle={`${list.length} people · one profile per person across every channel`}
          actions={<><Button variant="secondary" disabled>Export all</Button><Button disabled title="Contacts are created automatically when customers message you"><Plus className="mr-1.5 size-4" />New contact</Button></>}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 size-4 text-tertiary" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for contact…"
              className="h-9 w-full rounded-md border border-border bg-panel pl-8 pr-2 text-[13px] placeholder:text-tertiary focus:border-primary focus:outline-none" />
          </div>
          <Button variant="secondary" size="sm"><Filter className="mr-1.5 size-3.5" />Filter</Button>
          <Button variant="secondary" size="sm"><Columns3 className="mr-1.5 size-3.5" />View</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-panel-subtle text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Conversations</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Channels</th>
                <th className="px-4 py-3 font-medium">Labels</th>
                <th className="px-4 py-3 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer border-b border-border-subtle last:border-0 hover:bg-hover">
                  <td className="px-4 py-3"><span className="flex items-center gap-2.5"><Avatar name={c.full_name ?? "?"} size="sm" /><span className="font-medium text-foreground">{c.full_name ?? "Unnamed"}</span></span></td>
                  <td className="px-4 py-3 text-secondary">{c.conversations.length}</td>
                  <td className="px-4 py-3 text-secondary">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-secondary">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3"><span className="flex flex-wrap gap-1">{[...new Set(c.channels.map((x) => x.channel))].map((ch) => <Badge key={ch} variant="cyan" className="capitalize">{ch}</Badge>)}</span></td>
                  <td className="px-4 py-3"><span className="flex flex-wrap gap-1">{(c.tags ?? []).map((t) => <Badge key={t}>{t}</Badge>)}</span></td>
                  <td className="px-4 py-3 text-tertiary">{c.last_interaction_at ? formatSalonDateTime(c.last_interaction_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!contacts.isLoading && list.length === 0 && (
            <EmptyState icon={BookUser} title="No contacts here yet" body="Customers are added automatically the first time they message you on any channel." />
          )}
        </div>
      </Page>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-foreground/20" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-panel shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <p className="text-[15px] font-semibold">Contact</p>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-hover"><X className="size-4" /></button>
            </div>
            <div className="flex items-center gap-3 px-5 py-5">
              <Avatar name={selected.full_name ?? "?"} size="xl" />
              <div><p className="text-lg font-semibold">{selected.full_name ?? "Unnamed"}</p><p className="text-[13px] text-secondary">Customer since {formatSalonDateTime(selected.created_at)}</p></div>
            </div>
            <div className="space-y-5 px-5 pb-8 text-[13px]">
              <div><p className="mb-1 font-semibold">AI summary</p><p className="text-secondary">{selected.ai_summary ?? "No summary yet."}</p></div>
              <div><p className="mb-1 font-semibold">Linked channels</p>
                {selected.channels.map((ch) => (
                  <p key={ch.channel + ch.external_id} className="flex justify-between py-1 text-secondary"><span className="capitalize">{ch.channel}</span><span>{ch.verified ? "Verified" : "Unverified"}</span></p>
                ))}
              </div>
              <div><p className="mb-1 font-semibold">Notes</p><p className="text-secondary">{selected.notes ?? "No notes yet."}</p></div>
              <div className="flex items-center gap-2 text-tertiary"><Settings2 className="size-3.5" /> Profiles are only merged on verified email, phone or an explicit link.</div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
