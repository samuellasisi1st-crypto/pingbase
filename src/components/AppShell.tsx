import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import defaultLogo from "@/assets/workspace-logo.jpg.asset.json";
import {
  Inbox, Users, CalendarDays, Bot, Search, Settings, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, Zap, Scissors, LayoutDashboard, MoreHorizontal, X, Bell, CircleHelp,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/design-system/components/Avatar";
import { Button } from "@/design-system/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/services", label: "Services", icon: Scissors },
  { to: "/automations", label: "Automations", icon: Zap },
  { to: "/ai-agents", label: "AI Agents", icon: Bot },
] as const;

const FOOT = [
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/appointments", label: "Bookings", icon: CalendarDays },
] as const;
const MOBILE_MORE = [
  { to: "/services", label: "Services", icon: Scissors },
  { to: "/automations", label: "Automations", icon: Zap },
  { to: "/ai-agents", label: "AI Agents", icon: Bot },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const itemCls =
  "flex h-8 items-center gap-2 rounded-lg border border-transparent px-2.5 text-[12px] font-normal text-secondary transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:border-border hover:bg-hover hover:text-foreground hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const activeCls = "bg-accent font-normal text-foreground shadow-control ring-1 ring-inset ring-border-strong";

export function AppShell({
  children,
  title,
  secondary,
  secondaryOpen: controlledSecondaryOpen,
}: {
  children: ReactNode;
  title?: string;
  secondary?: ReactNode;
  secondaryOpen?: boolean;
}) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const secondaryOpen = controlledSecondaryOpen ?? true;
  const workspace = useQuery({ queryKey: ["workspace"], enabled: !!session, queryFn: async () => {
    const { data } = await supabase.from("workspaces").select("id,name,logo_url").limit(1).maybeSingle();
    return data;
  } });
  const wsName = workspace.data?.name ?? "Studio Nine Hair";
  const wsLogo = workspace.data?.logo_url || defaultLogo.url;

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-secondary">Loading…</div>;
  }

  const email = session.user.email ?? "You";

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden bg-app md:p-2">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-panel focus:px-3 focus:py-2 focus:text-sm">Skip to content</a>
      <TooltipProvider delayDuration={120}>
      <aside className={`hidden shrink-0 flex-col rounded-l-xl border border-border-strong bg-panel py-3 shadow-xs transition-[width] md:flex ${navOpen ? "w-52 px-2.5" : "w-12 px-1.5"}`}>
        <div className={`mb-3 flex items-center ${navOpen ? "gap-1" : "justify-center"}`}>
          <Link to="/settings" search={{ section: "workspace" } as never} title="Workspace settings" className={`flex min-w-0 items-center rounded-lg border border-border bg-panel text-left shadow-xs hover:bg-hover ${navOpen ? "flex-1 gap-2 p-1.5" : "p-1"}`}>
          <img src={wsLogo} alt="" className="size-7 shrink-0 rounded-lg object-cover" />
          {navOpen && <span className="min-w-0 flex-1">
            <span className="block text-micro font-semibold uppercase text-tertiary">Workspace</span>
            <span className="block truncate text-[12px] font-normal text-foreground">{wsName}</span>
          </span>}
          {navOpen && <ChevronDown className="size-3 text-tertiary" />}
          </Link>
        </div>
        {navOpen && <p className="mb-1.5 px-2.5 text-micro font-semibold uppercase text-tertiary">Workspace</p>}
        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5">
          {NAV.map((i) => {
            const link = <Link to={i.to} aria-label={!navOpen ? i.label : undefined} activeOptions={{ exact: i.to === "/" }} className={`${itemCls} ${navOpen ? "" : "justify-center px-0"}`} activeProps={{ className: activeCls }}>
              <i.icon className="size-3.5 shrink-0" aria-hidden="true" /> {navOpen && i.label}
            </Link>;
            return navOpen ? <span key={i.to} className="contents">{link}</span> : <Tooltip key={i.to}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right" sideOffset={9} className="border border-border-strong bg-foreground px-2.5 py-1.5 text-[11px] font-normal text-panel shadow-md">{i.label}</TooltipContent></Tooltip>;
          })}
        </nav>
        {navOpen && <p className="mb-1.5 mt-3 px-2.5 text-micro font-semibold uppercase text-tertiary">Manage</p>}
        <nav aria-label="Account" className="flex flex-col gap-0.5">
          {FOOT.map((i) => {
            const link = <Link to={i.to} aria-label={!navOpen ? i.label : undefined} className={`${itemCls} ${navOpen ? "" : "justify-center px-0"}`} activeProps={{ className: activeCls }}>
              <i.icon className="size-3.5 shrink-0" aria-hidden="true" /> {navOpen && i.label}
            </Link>;
            return navOpen ? <span key={i.to} className="contents">{link}</span> : <Tooltip key={i.to}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right" sideOffset={9} className="border border-border-strong bg-foreground px-2.5 py-1.5 text-[11px] font-normal text-panel shadow-md">{i.label}</TooltipContent></Tooltip>;
          })}
          <ThemeToggle expanded={navOpen} />
          <Button type="button" title={navOpen ? "Collapse navigation" : "Expand navigation"} aria-label={navOpen ? "Collapse navigation" : "Expand navigation"} size="sm" variant="tertiary" className={`w-full ${navOpen ? "justify-start px-2.5" : "px-0"}`} onClick={() => setNavOpen((open) => !open)}>
            {navOpen ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
            {navOpen && <span>Collapse</span>}
          </Button>
          <div className={`mt-2 flex items-center border-t border-border-subtle pt-2 ${navOpen ? "gap-2 px-1" : "flex-col gap-1"}`}>
            <Link to="/profile" title="My profile" className={`flex min-w-0 items-center rounded-lg p-1 hover:bg-hover ${navOpen ? "flex-1 gap-2" : "justify-center"}`}>
              <Avatar name={email} size="sm" />
              {navOpen && <span className="truncate text-[12px] font-normal text-secondary">My profile</span>}
            </Link>
            {navOpen && <button
              aria-label="Sign out"
              title="Sign out"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="rounded p-1 text-tertiary hover:bg-hover hover:text-foreground"
            >
              <LogOut className="size-3.5" />
            </button>}
          </div>
        </nav>
      </aside>
      </TooltipProvider>

      {secondary && secondaryOpen && (
        <aside aria-label="Views" className="hidden w-52 shrink-0 flex-col overflow-y-auto border-y border-r border-border bg-panel px-2.5 py-3 lg:flex">
          {secondary}
        </aside>
      )}

      <main id="main" className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-panel pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:rounded-r-xl md:border-y md:border-r md:border-border md:pb-0 md:shadow-xs">
        {title ? (
          <div className="px-8 pb-8 pt-5">
            <h1 className="flex h-10 items-center text-2xl font-semibold text-foreground">{title}</h1>
            <div className="mt-6">{children}</div>
          </div>
        ) : (
          children
        )}
      </main>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-panel/95 px-2 pt-1.5 backdrop-blur md:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}><ul className="grid grid-cols-5 gap-1">{MOBILE_NAV.map((item) => { const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to); return <li key={item.to}><Link to={item.to} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] ${active ? "bg-hover text-foreground" : "text-tertiary"}`}><item.icon className="size-4"/><span className="max-w-full truncate">{item.label}</span></Link></li>; })}<li><button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)} className={`flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] ${MOBILE_MORE.some((item) => pathname.startsWith(item.to)) ? "bg-hover text-foreground" : "text-tertiary"}`}><MoreHorizontal className="size-4"/><span>More</span></button></li></ul></nav>
      {moreOpen && <div className="fixed inset-0 z-50 flex items-end bg-foreground/20 md:hidden" onClick={() => setMoreOpen(false)}><div className="w-full rounded-t-xl border border-border bg-panel px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 shadow-lg" onClick={(event) => event.stopPropagation()}><div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center"><div><p className="text-[15px] text-foreground">More</p><p className="text-[11px] text-tertiary">Studio Nine Hair</p></div><Button variant="tertiary" size="sm" title="Close" onClick={() => setMoreOpen(false)}><X className="size-4"/></Button></div><div className="grid grid-cols-2 gap-2">{MOBILE_MORE.map((item) => <Link key={item.to} to={item.to} onClick={() => setMoreOpen(false)} className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-panel-subtle px-3 text-[12px] text-foreground"><item.icon className="size-4 text-secondary"/>{item.label}</Link>)}</div><Link to="/profile" onClick={() => setMoreOpen(false)} className="mt-2 flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 text-[12px] text-foreground"><Avatar name={email} size="sm"/>My profile</Link><ThemeToggle expanded className="mt-2 min-h-12 rounded-lg border border-border px-3" /></div></div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, count }: { title: string; subtitle?: string; actions?: ReactNode; count?: number }) {
  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
      <div className="min-w-0">
        <h1 className="flex h-10 items-center gap-2 text-2xl font-semibold text-foreground">
          <span className="truncate">{title}</span>
          {count !== undefined && <span className="rounded-md bg-hover px-2 py-0.5 text-xs font-medium text-secondary">{count}</span>}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1400px] space-y-5 px-4 pb-8 pt-5 sm:space-y-6 md:px-8 md:pb-10 md:pt-7">{children}</div>;
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
