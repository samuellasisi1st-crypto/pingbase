import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const LAST_UPDATED = "27 September 2026";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg">
            Pingbase
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>
        <p className="mt-6 text-base leading-relaxed text-foreground">{intro}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground [&_a]:underline [&_h2]:font-display [&_h2]:text-xl [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <footer className="border-t bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-muted-foreground">
          Pingbase · Contact: <a className="underline" href="mailto:support@pingbase.app">support@pingbase.app</a>
        </div>
      </footer>
    </div>
  );
}
