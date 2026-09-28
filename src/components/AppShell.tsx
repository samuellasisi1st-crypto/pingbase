import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  Inbox, MessagesSquare, Send, Zap, Users, CalendarDays, Star, BarChart3, Bot,
  Search, Bell, HelpCircle, Megaphone, Settings, ChevronDown, LogOut, Sparkles,
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
  "flex min-h-9 items-center gap-2.5 rounded-lg border border-transparent px-3 text-[13px] font-medium text-secondary transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
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
    <div className="flex h-dvh overflow-hidden bg-app p-2">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-panel focus:px-3 focus:py-2 focus:text-sm">Skip to content</a>
      <aside className="hidden w-60 shrink-0 flex-col rounded-l-xl border border-border-subtle bg-panel px-3 py-3 md:flex">
        <button className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-panel p-2 text-left shadow-xs hover:bg-hover">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground text-[13px] font-bold text-panel">P</span>
          <span className="min-w-0 flex-1">
            <span className="block text-micro font-semibold uppercase text-tertiary">Workspace</span>
            <span className="block truncate text-body font-semibold text-foreground">Studio Nine Hair</span>
          </span>
          <ChevronDown className="size-3.5 text-tertiary" />
        </button>
        <div className="relative mb-5">
          <Search className="absolute left-3 top-2.5 size-4 text-tertiary" />
          <input aria-label="Search Pingbase" placeholder="Search" className="h-9 w-full rounded-lg border border-transparent bg-hover pl-9 pr-3 text-body text-foreground placeholder:text-tertiary focus:border-border-strong focus:bg-panel focus:outline-none" />
        </div>
        <p className="mb-2 px-3 text-micro font-semibold uppercase text-tertiary">Workspace</p>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5">
          {NAV.map((i) => (
            <Link key={i.to} to={i.to} activeOptions={{ exact: i.to === "/" }} className={itemCls} activeProps={{ className: activeCls }}>
              <i.icon className="size-4 shrink-0" aria-hidden="true" /> {i.label}
            </Link>
          ))}
        </nav>
        <p className="mb-2 mt-4 px-3 text-micro font-semibold uppercase text-tertiary">Manage</p>
        <nav aria-label="Account" className="flex flex-col gap-0.5">
          {FOOT.map((i) => (
            <Link key={i.to} to={i.to} className={itemCls} activeProps={{ className: activeCls }}>
              <i.icon className="size-4 shrink-0" aria-hidden="true" /> {i.label}
            </Link>
          ))}
          <div className="mt-3 flex items-center gap-2 border-t border-border-subtle px-2 pt-3">
            <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 hover:bg-hover">
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
        <aside aria-label="Views" className="hidden w-60 shrink-0 flex-col overflow-y-auto border-y border-r border-border-subtle bg-panel-subtle px-3 py-4 lg:flex">
          {secondary}
        </aside>
      )}

      <main id="main" className="min-w-0 flex-1 overflow-y-auto rounded-r-xl border-y border-r border-border-subtle bg-panel shadow-xs">
        {title ? (
          <div className="px-8 pb-8 pt-5">
            <h1 className="flex h-10 items-center text-2xl font-semibold text-foreground">{title}</h1>
            <div className="mt-6">{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, count }: { title: string; subtitle?: string; actions?: ReactNode; count?: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0">
        <h1 className="flex h-10 items-center gap-2 text-2xl font-semibold text-foreground">
          <span className="truncate">{title}</span>
          {count !== undefined && <span className="rounded-md bg-hover px-2 py-0.5 text-xs font-medium text-secondary">{count}</span>}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1400px] space-y-6 px-8 pb-10 pt-7">{children}</div>;
}

export function SideLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 mt-6 px-3 text-micro font-semibold uppercase text-tertiary">{children}</p>;
}

export function SideItem({ active, icon: Icon, label, count, onClick }: {
  active?: boolean; icon: React.ComponentType<{ className?: string }>; label: string; count?: number | undefined; onClick?: () => void;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`${itemCls} w-full ${active ? activeCls : ""}`}>
      <Icon className="size-4 shrink-0" aria-hidden="true" /> <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {count ? <span className="text-xs tabular-nums text-secondary">{count}</span> : null}
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
