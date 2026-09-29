import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, MessagesSquare } from "lucide-react";
import appScreenshot from "@/assets/landing-app-dashboard.jpg";

const MENU = [
  { label: "Platform", dropdown: true },
  { label: "Solutions", dropdown: true },
  { label: "Resources", dropdown: true },
  { label: "Pricing", dropdown: false },
];

const CHECKS = ["14-day free trial", "No credit card required", "Cancel anytime"];

const primaryPill =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] px-5 text-[15px] font-semibold text-white shadow-button-glow transition-[filter,box-shadow] duration-150 hover:brightness-105 active:brightness-95";
const outlinePill =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-panel px-5 text-[15px] font-medium text-foreground shadow-xs transition-colors duration-150 hover:bg-hover";

export function LandingHero() {
  return (
    <div className="flex min-h-dvh flex-col bg-panel text-foreground">
      <header className="mx-auto grid h-16 w-full max-w-[1240px] grid-cols-[auto_1fr] items-center px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <Link to="/" className="flex items-center gap-2" aria-label="Pingbase home">
          <span className="grid size-7 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-white shadow-button-glow">
            <MessagesSquare className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">Pingbase</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center justify-self-center md:flex">
          {MENU.map((item) => (
            <a
              key={item.label}
              href="#"
              className="flex h-9 items-center gap-1 rounded-full px-3.5 text-[15px] text-secondary transition-colors duration-150 hover:bg-hover hover:text-foreground"
            >
              {item.label}
              {item.dropdown && <ChevronDown className="size-3.5 text-tertiary" aria-hidden="true" />}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Link to="/auth" className="hidden h-9 items-center rounded-full px-3.5 text-[15px] text-secondary transition-colors duration-150 hover:text-foreground sm:inline-flex">
            Sign in
          </Link>
          <Link to="/auth" className={primaryPill}>
            Get started
          </Link>
          <Link to="/auth" className={`${outlinePill} hidden lg:inline-flex`}>
            Book a demo
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1240px] px-5 pb-14 pt-14 sm:px-8 md:pb-20 md:pt-20">
        <h1 className="max-w-[820px] text-[46px] font-bold leading-[1.03] tracking-[-0.03em] sm:text-[62px] md:text-[76px]">
          More bookings
          <br />
          from every <span className="font-medium text-tertiary">message</span>
        </h1>
        <p className="mt-7 max-w-[430px] text-[17px] leading-relaxed text-secondary md:text-lg">
          Turn customer chats into confirmed appointments that fill your calendar.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link to="/auth" className={`${primaryPill} h-11 px-6`}>
            Get started
          </Link>
          <Link to="/auth" className={`${outlinePill} h-11 px-6`}>
            Book a demo
          </Link>
        </div>
        <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
          {CHECKS.map((label) => (
            <li key={label} className="flex items-center gap-1.5 text-[13px] text-secondary">
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section aria-hidden="true" className="w-full overflow-hidden bg-gradient-to-b from-hover to-panel-subtle">
        <div className="mx-auto flex h-[52vw] max-h-[620px] min-h-[240px] w-full max-w-[1500px] items-start justify-center px-5 pt-10 sm:px-8 md:pt-14">
          <img
            src={appScreenshot}
            alt=""
            className="w-full max-w-[1180px] rounded-t-xl border border-border-strong bg-panel shadow-lg"
          />
        </div>
      </section>
    </div>
  );
}
