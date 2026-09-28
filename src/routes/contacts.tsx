import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Filter, Columns3, Settings2, Plus, BookUser, Link2, Star, X, ChevronLeft, ChevronRight, Check, Instagram, MessageCircle, Mail } from "lucide-react";

import { AppShell, Page, PageHeader, SideItem, SideLabel, EmptyState } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/design-system/components/Avatar";
import { Badge } from "@/design-system/components/Badge";
import { Button } from "@/design-system/components/Button";
import { formatSalonDateTime } from "@/lib/time";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Pingbase" },
      { name: "description", content: "One customer profile per person, linked across every channel they message from." },
      { property: "og:title", content: "Contacts — Pingbase" },
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
          count={list.length}
          actions={<><Button variant="secondary" size="sm">Export all</Button><Button variant="secondary" size="sm">Import</Button><Button size="sm" disabled title="Contacts are created automatically when customers message you"><Plus className="size-3.5" />New contact</Button></>}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <div className="flex w-full max-w-xl items-center gap-2">
            <div className="relative min-w-0 flex-1">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-tertiary" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for contact…"
               className="h-9 w-full rounded-lg border border-border bg-panel pl-8 pr-3 text-[12px] shadow-xs placeholder:text-tertiary focus:border-primary focus:outline-none" />
            </div>
            <Button variant="secondary" size="sm"><Filter className="size-3.5" />Filter</Button>
            <Button variant="secondary" size="sm"><Columns3 className="size-3.5" />View</Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-tertiary"><span>Page size: 100</span><Button variant="tertiary" size="sm" disabled><ChevronLeft className="size-3.5" /></Button><span>1 / 1</span><Button variant="tertiary" size="sm" disabled><ChevronRight className="size-3.5" /></Button></div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-panel shadow-xs">
          <table className="w-full min-w-[940px] whitespace-nowrap text-left text-[12px]">
            <thead className="border-b border-border bg-panel-subtle text-secondary">
              <tr>
                <th className="w-10 px-3 py-2.5 font-normal"><button type="button" aria-label="Select all contacts" onClick={() => setSelectedIds(selectedIds.length === list.length ? [] : list.map((c) => c.id))} className="grid size-4 place-items-center rounded border border-border-strong bg-panel">{selectedIds.length === list.length && list.length > 0 ? <Check className="size-3" /> : null}</button></th>
                <th className="px-2 py-2.5 font-normal">Name</th>
                <th className="px-3 py-2.5 font-normal">Email</th>
                <th className="px-3 py-2.5 font-normal">Phone number</th>
                <th className="px-3 py-2.5 font-normal">Conversations</th>
                <th className="px-3 py-2.5 font-normal">Channels</th>
                <th className="px-3 py-2.5 font-normal">Labels</th>
                <th className="px-3 py-2.5 font-normal">Last active</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                 <tr key={c.id} onClick={() => setSelected(c)} className="h-11 cursor-pointer border-b border-border-subtle last:border-0 hover:bg-panel-subtle">
                   <td className="px-3" onClick={(e) => e.stopPropagation()}><button type="button" aria-label={`Select ${c.full_name ?? "contact"}`} onClick={() => setSelectedIds((ids) => ids.includes(c.id) ? ids.filter((id) => id !== c.id) : [...ids, c.id])} className="grid size-4 place-items-center rounded border border-border-strong bg-panel">{selectedIds.includes(c.id) ? <Check className="size-3" /> : null}</button></td>
                   <td className="px-2"><span className="flex items-center gap-2"><Avatar name={c.full_name ?? "?"} size="sm" /><span className="font-normal text-foreground">{c.full_name ?? "Unnamed"}</span></span></td>
                   <td className="max-w-52 truncate px-3 text-secondary">{c.email ?? "—"}</td>
                   <td className="px-3 text-secondary">{c.phone ? <span className="rounded-md border border-border-subtle bg-panel-subtle px-2 py-1">{c.phone}</span> : "—"}</td>
                   <td className="px-3 text-secondary">{c.conversations.length}</td>
                   <td className="px-3"><span className="flex items-center gap-1">{[...new Set(c.channels.map((x) => x.channel))].map((ch) => <ChannelIcon key={ch} channel={ch} />)}</span></td>
                   <td className="px-3"><span className="flex max-w-48 flex-wrap gap-1">{(c.tags ?? []).slice(0, 2).map((t, i) => <Badge key={t} variant={i % 2 ? "purple" : "cyan"}>{t}</Badge>)}{(c.tags?.length ?? 0) > 2 && <Badge>+{(c.tags?.length ?? 0) - 2}</Badge>}</span></td>
                   <td className="px-3 text-tertiary">{c.last_interaction_at ? formatSalonDateTime(c.last_interaction_at) : "—"}</td>
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
           <div className="m-2 h-[calc(100%-1rem)] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-panel shadow-lg" onClick={(e) => e.stopPropagation()}>
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

function ChannelIcon({ channel }: { channel: string }) {
  const cls = "size-4";
  const shell = "grid size-6 place-items-center rounded-full border border-panel text-panel shadow-xs";
  if (channel === "instagram") return <span title="Instagram" className={`${shell} bg-instagram`}><Instagram className={cls} /></span>;
  if (channel === "messenger") return <span title="Messenger" className={`${shell} bg-facebook`}><MessageCircle className={cls} /></span>;
  if (channel === "gmail" || channel === "outlook") return <span title="Email" className={`${shell} bg-email`}><Mail className={cls} /></span>;
  return <span title={channel} className={`${shell} bg-whatsapp`}><MessageCircle className={cls} /></span>;
}
