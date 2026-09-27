import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  Inbox, MessagesSquare, Send, Zap, Users, CalendarDays, Star, BarChart3, Bot,
  Search, Bell, HelpCircle, Megaphone, Settings, ChevronDown, LogOut,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/design-system/components/Avatar";

const NAV = [
  { to: "/", label: "Inbox", icon: Inbox },
  { to: "/team-chat", label: "Team Chat", icon: MessagesSquare },
  { to: "/campaigns", label: "Campaigns", icon: Send },
  { to: "/automations", label: "Automations", icon: Zap },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/ai-agents", label: "AI Agents", icon: Bot },
] as const;

const FOOT = [
  { to: "/search", label: "Search", icon: Search },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/help", label: "Help", icon: HelpCircle },
  { to: "/whats-new", label: "What's new?", icon: Megaphone },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const itemCls =
  "flex h-9 items-center gap-2.5 rounded-md border border-transparent px-2.5 text-[13px] text-secondary transition-colors hover:bg-hover hover:text-foreground";
const activeCls = "border-border bg-panel font-semibold text-foreground shadow-xs";

export function AppShell({
  children,
  title,
  secondary,
}: {
  children: ReactNode;
  title?: string;
  secondary?: ReactNode;
}) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-secondary">Loading…</div>;
  }

  const email = session.user.email ?? "You";

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border-subtle bg-panel px-3 py-4 md:flex">
        <button className="mb-5 flex items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-hover">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground text-[13px] font-bold text-panel">P</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-foreground">Studio Nine Hair</span>
            <span className="block text-[11px] text-tertiary">Pink OS</span>
          </span>
          <ChevronDown className="size-3.5 text-tertiary" />
        </button>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((i) => (
            <Link key={i.to} to={i.to} activeOptions={{ exact: i.to === "/" }} className={itemCls} activeProps={{ className: activeCls }}>
              <i.icon className="size-4" /> {i.label}
            </Link>
          ))}
        </nav>
        <nav className="flex flex-col gap-0.5">
          {FOOT.map((i) => (
            <Link key={i.to} to={i.to} className={itemCls} activeProps={{ className: activeCls }}>
              <i.icon className="size-4" /> {i.label}
            </Link>
          ))}
          <div className="mt-1 flex items-center gap-2 px-1.5 py-1">
            <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-2 rounded-md hover:bg-hover">
              <Avatar name={email} size="sm" />
              <span className="truncate text-[13px] text-secondary">My profile</span>
            </Link>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="rounded p-1 text-tertiary hover:bg-hover hover:text-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </nav>
      </aside>

      {secondary && (
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border-subtle bg-panel px-3 py-4 lg:flex">
          {secondary}
        </aside>
      )}

      <main className="min-w-0 flex-1 overflow-y-auto bg-panel">
        {title ? (
          <div className="px-8 py-7">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <div className="mt-6">{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1400px] space-y-6 px-8 py-7">{children}</div>;
}

export function SideLabel({ children }: { children: ReactNode }) {
  return <p className="mb-1 mt-5 px-2 text-[11px] font-medium text-tertiary">{children}</p>;
}

export function SideItem({ active, icon: Icon, label, count, onClick }: {
  active?: boolean; icon: React.ComponentType<{ className?: string }>; label: string; count?: number | undefined; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className={`${itemCls} w-full ${active ? activeCls : ""}`}>
      <Icon className="size-4" /> <span className="flex-1 text-left">{label}</span>
      {count ? <span className="text-[11px] text-tertiary">{count}</span> : null}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: {
  icon: React.ComponentType<{ className?: string }>; title: string; body: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="grid size-20 place-items-center rounded-2xl border border-border bg-hover">
        <Icon className="size-9 text-tertiary" />
      </div>
      <p className="mt-5 text-[15px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-secondary">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-5 shadow-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">{label}</p>
      {hint && <p className="mt-1 text-[12px] text-tertiary">{hint}</p>}
      <p className="mt-4 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
