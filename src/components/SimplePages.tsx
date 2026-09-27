import type { ComponentType, ReactNode } from "react";
import { AppShell, Page, PageHeader, EmptyState } from "@/components/AppShell";
import { Badge } from "@/design-system/components/Badge";

export function PlaceholderPage({ title, subtitle, icon, emptyTitle, emptyBody, children }: {
  title: string; subtitle: string; icon: ComponentType<{ className?: string }>; emptyTitle: string; emptyBody: string; children?: ReactNode;
}) {
  return (
    <AppShell>
      <Page>
        <PageHeader title={title} subtitle={subtitle} actions={<Badge variant="purple" size="md">Coming soon</Badge>} />
        {children}
        <div className="rounded-xl border border-border">
          <EmptyState icon={icon} title={emptyTitle} body={emptyBody} />
        </div>
      </Page>
    </AppShell>
  );
}

export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Pingbase` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Pingbase` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
