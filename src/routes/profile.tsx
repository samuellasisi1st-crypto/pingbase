import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Page, PageHeader } from "@/components/AppShell";
import { meta } from "@/components/SimplePages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/design-system/components/Avatar";
import { Button } from "@/design-system/components/Button";

export const Route = createFileRoute("/profile")({
  head: () => meta("My profile", "Your Pingbase account."),
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const email = session?.user.email ?? "";
  return (
    <AppShell>
      <Page>
        <PageHeader title="My profile" subtitle="Your Pingbase account." />
        <div className="max-w-xl rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <Avatar name={email || "You"} size="xl" />
            <div><p className="text-[15px] font-semibold text-foreground">{email}</p><p className="text-[13px] text-secondary">Owner · Studio Nine Hair</p></div>
          </div>
          <Button variant="secondary" className="mt-6" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>Sign out</Button>
        </div>
      </Page>
    </AppShell>
  );
}
