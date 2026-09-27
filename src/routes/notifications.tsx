import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, PlugZap } from "lucide-react";

import { AppShell, Page, PageHeader, EmptyState } from "@/components/AppShell";
import { meta } from "@/components/SimplePages";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/design-system/components/Badge";
import { formatSalonDateTime } from "@/lib/time";

export const Route = createFileRoute("/notifications")({
  head: () => meta("Notifications", "Handovers that need you and channel problems, in one place."),
  component: NotificationsPage,
});

function NotificationsPage() {
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const [h, l] = await Promise.all([
        supabase.from("handoffs").select("*").order("created_at", { ascending: false }).limit(30),
        supabase.from("integration_logs").select("*").in("level", ["error", "warn"]).order("created_at", { ascending: false }).limit(30),
      ]);
      const items = [
        ...(h.data ?? []).map((x) => ({ id: x.id, at: x.created_at, kind: "handoff" as const, title: `Handover: ${x.reason}`, body: x.summary, open: x.status === "OPEN" })),
        ...(l.data ?? []).map((x) => ({ id: x.id, at: x.created_at, kind: "log" as const, title: `${x.channel ?? "Channel"} ${x.level === "error" ? "error" : "warning"}`, body: x.message, open: false })),
      ];
      return items.sort((a, b) => b.at.localeCompare(a.at));
    },
  });
  const items = q.data ?? [];
  return (
    <AppShell>
      <Page>
        <PageHeader title="Notifications" subtitle="Handovers that need you and channel problems." />
        <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border">
          {items.map((n) => (
            <Link key={n.id} to={n.kind === "handoff" ? "/" : "/settings"} className="flex gap-3 px-5 py-4 hover:bg-hover">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-hover">
                {n.kind === "handoff" ? <AlertTriangle className="size-4 text-secondary" /> : <PlugZap className="size-4 text-secondary" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[14px] font-medium capitalize text-foreground">{n.title}{n.open && <Badge variant="yellow">Open</Badge>}</span>
                <span className="mt-0.5 block truncate text-[13px] text-secondary">{n.body}</span>
              </span>
              <span className="shrink-0 text-[12px] text-tertiary">{formatSalonDateTime(n.at)}</span>
            </Link>
          ))}
          {!q.isLoading && items.length === 0 && <EmptyState icon={Bell} title="All quiet" body="You'll be told here when Nia needs a person." />}
        </div>
      </Page>
    </AppShell>
  );
}
