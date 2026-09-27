import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Inbox, CalendarDays, Users, Settings, MessagesSquare, LogOut } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Inbox", icon: Inbox },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <div className="px-2">
          <p className="font-display text-xl text-sidebar-foreground">Pink OS</p>
          <p className="text-xs text-sidebar-foreground/60">Booking concierge</p>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <a
            href="/chat"
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex items-center gap-3 rounded-lg border border-sidebar-border px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent"
          >
            <MessagesSquare className="size-4" />
            Open test chat
          </a>
        </nav>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-surface px-6 py-4">
          <h1 className="font-display text-xl">{title}</h1>
          <div className="flex items-center gap-2 md:hidden">
            {NAV.map((item) => (
              <Button key={item.to} asChild variant="ghost" size="icon">
                <Link to={item.to}>
                  <item.icon className="size-4" />
                </Link>
              </Button>
            ))}
          </div>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
