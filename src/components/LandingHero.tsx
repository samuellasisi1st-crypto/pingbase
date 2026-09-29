import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Instagram,
  Mail,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import appScreenshot from "@/assets/landing-app-dashboard.jpg";
import sculpture from "@/assets/dashboard-glass-sculpture.png";
import { Button } from "@/components/ui/button";

const MENU = [
  { label: "Platform", href: "#platform", dropdown: true },
  { label: "Solutions", href: "#solutions", dropdown: true },
  { label: "Resources", href: "#resources", dropdown: true },
  { label: "Pricing", href: "#pricing", dropdown: false },
];

const CHECKS = ["14-day free trial", "No credit card required", "Cancel anytime"];

const CHANNELS = [
  { label: "WhatsApp", icon: MessageCircle },
  { label: "Instagram", icon: Instagram },
  { label: "Messenger", icon: MessagesSquare },
  { label: "Email", icon: Mail },
  { label: "Calendar", icon: CalendarCheck2 },
];

const JOURNEY = [
  {
    icon: MessageCircle,
    title: "Answers every enquiry",
    body: "Nia replies with the right service, price and policy information from your business.",
  },
  {
    icon: CalendarCheck2,
    title: "Books real availability",
    body: "Customers choose from live times, with every slot checked again before confirmation.",
  },
  {
    icon: RefreshCw,
    title: "Handles changes",
    body: "Rescheduling and cancellations follow your rules without creating double bookings.",
  },
  {
    icon: Users,
    title: "Hands over with context",
    body: "Your team can take over any conversation and see exactly what has already happened.",
  },
];

const FOOTER_LINKS = [
  { title: "Platform", links: ["Unified inbox", "AI agent", "Appointments", "Automations"] },
  { title: "Solutions", links: ["Hair & beauty", "Wellness", "Clinics", "Studios"] },
  { title: "Company", links: ["About", "Customers", "Contact", "Partners"] },
  { title: "Resources", links: ["Help centre", "Guides", "Privacy", "Terms"] },
];

function Logo() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="Pingbase home">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-button-glow">
        <MessagesSquare className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate text-[17px] font-semibold">Pingbase</span>
    </Link>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase text-primary">
      <span className="size-1.5 rounded-full bg-primary" />
      {children}
    </div>
  );
}

function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`max-w-[720px] text-[34px] font-medium leading-[1.08] sm:text-[44px] lg:text-[52px] ${className}`}>
      {children}
    </h2>
  );
}

function MessageBubble({ side, children }: { side?: "left" | "right"; children: React.ReactNode }) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${side === "right" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-panel text-foreground shadow-xs"}`}>
        {children}
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <div className="min-h-dvh overflow-hidden bg-panel text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-panel/95 backdrop-blur">
        <div className="mx-auto grid h-16 w-full max-w-[1240px] grid-cols-[auto_1fr] items-center px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
          <Logo />
          <nav aria-label="Main" className="hidden items-center justify-self-center md:flex">
            {MENU.map((item) => (
              <a key={item.label} href={item.href} className="flex h-9 items-center gap-1 rounded-full px-3.5 text-[15px] text-secondary transition-colors hover:bg-hover hover:text-foreground">
                {item.label}
                {item.dropdown && <ChevronDown className="size-3.5 text-tertiary" aria-hidden="true" />}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="ghost" className="rounded-full max-sm:hidden">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full max-lg:hidden">
              <Link to="/auth">Book a demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-[1240px] px-5 pb-14 pt-14 sm:px-8 md:pb-20 md:pt-20">
          <h1 className="max-w-[860px] text-[46px] font-medium leading-[1.03] sm:text-[62px] md:text-[76px]">
            More bookings
            <br />
            from every <span className="font-medium text-tertiary">message</span>
          </h1>
          <p className="mt-7 max-w-[480px] text-[17px] leading-relaxed text-secondary md:text-lg">
            Turn customer chats into confirmed appointments. Nia answers, books and follows up across every channel.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 rounded-full px-6">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
              <Link to="/auth">Book a demo</Link>
            </Button>
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

        <section aria-label="Pingbase product preview" className="w-full overflow-hidden bg-gradient-to-b from-hover to-panel-subtle">
          <div className="mx-auto flex h-[52vw] max-h-[620px] min-h-[260px] w-full max-w-[1500px] items-start justify-center px-5 pt-10 sm:px-8 md:pt-14">
            <img src={appScreenshot} alt="Pingbase dashboard showing appointments and customer conversations" className="w-full max-w-[1180px] rounded-t-xl border border-border-strong bg-panel shadow-lg" />
          </div>
        </section>

        <section className="border-y border-border bg-panel" aria-label="Connected channels">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-10 gap-y-6 px-5 py-9 sm:px-8 md:justify-between">
            <p className="w-full text-center text-xs font-medium uppercase text-tertiary md:w-auto md:text-left">One inbox for every conversation</p>
            {CHANNELS.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-secondary">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-[1120px] px-5 py-24 sm:px-8 md:py-32">
          <div className="grid gap-14 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <Eyebrow>One connected platform</Eyebrow>
              <SectionHeading>
                Unify conversations, bookings and follow-ups so every customer gets an answer.
              </SectionHeading>
            </div>
            <p className="max-w-[440px] text-base leading-7 text-secondary lg:justify-self-end">
              Pingbase gives your team one clear view of every customer while Nia handles the repetitive work in the background.
            </p>
          </div>
          <div className="mt-16 grid border-y border-border md:grid-cols-3">
            {[
              ["01", "Convert more enquiries", "Reply while customers are ready to book, even outside opening hours."],
              ["02", "Protect your team’s time", "Keep routine questions and scheduling out of your team’s day."],
              ["03", "Know what drives revenue", "Connect conversations to appointments, services and outcomes."],
            ].map(([number, title, body], index) => (
              <article key={number} className={`py-8 md:px-8 ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}>
                <span className="text-xs font-medium text-primary">{number}</span>
                <h3 className="mt-8 text-xl font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-secondary">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="solutions" className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 md:py-32">
            <div className="mx-auto max-w-[700px] text-center">
              <div className="mb-5 flex items-center justify-center gap-2 text-xs font-medium uppercase text-sidebar-primary">
                <span className="size-1.5 rounded-full bg-sidebar-primary" />
                One AI agent. Every channel.
              </div>
              <h2 className="text-[34px] font-medium leading-[1.08] sm:text-[48px] md:text-[56px]">Customers message wherever they like. Nia keeps it all together.</h2>
              <p className="mx-auto mt-6 max-w-[560px] text-base leading-7 text-sidebar-foreground/70">A continuous conversation across WhatsApp, Instagram, Messenger and email—with the same customer context behind every reply.</p>
            </div>

            <div className="relative mx-auto mt-16 max-w-[980px] overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent p-4 shadow-lg sm:p-7">
              <div className="grid min-h-[480px] overflow-hidden rounded-md border border-sidebar-border bg-panel text-foreground md:grid-cols-[240px_1fr_250px]">
                <aside className="hidden border-r border-border bg-panel-subtle p-4 md:block">
                  <div className="flex items-center gap-2 border-b border-border pb-4 text-sm font-medium"><MessagesSquare className="size-4 text-primary" /> Inbox</div>
                  {[
                    ["MT", "Mia Thompson", "Can I do Saturday?", "2m"],
                    ["SK", "Sofia Khan", "Thanks, perfect", "18m"],
                    ["IR", "Imani Reed", "Sent an image", "1h"],
                  ].map(([initials, name, preview, time], index) => (
                    <div key={name} className={`mt-2 flex gap-3 rounded-md p-3 ${index === 0 ? "bg-active" : ""}`}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-hover text-xs font-medium">{initials}</span>
                      <div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-xs font-medium"><span className="truncate">{name}</span><span className="text-tertiary">{time}</span></div><p className="mt-1 truncate text-xs text-secondary">{preview}</p></div>
                    </div>
                  ))}
                </aside>
                <div className="flex flex-col p-4 sm:p-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div><p className="text-sm font-medium">Mia Thompson</p><p className="mt-1 text-xs text-secondary">Instagram · AI handling</p></div>
                    <span className="rounded-full bg-blue-soft px-2.5 py-1 text-xs font-medium text-blue-strong">Nia is replying</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-end gap-3 py-6">
                    <MessageBubble>Hi, do you have any appointments for a silk press this Saturday?</MessageBubble>
                    <MessageBubble side="right">I do. Maya is available at 10:30am or 2:00pm. Which works best?</MessageBubble>
                    <MessageBubble>2pm please — I’ll pay in store.</MessageBubble>
                    <MessageBubble side="right">You’re booked with Maya for Saturday at 2:00pm. I’ve sent your confirmation here.</MessageBubble>
                  </div>
                  <div className="rounded-full border border-border bg-panel-subtle px-4 py-3 text-sm text-tertiary">Reply to Mia…</div>
                </div>
                <aside className="hidden border-l border-border bg-panel-subtle p-5 md:block">
                  <p className="text-xs font-medium uppercase text-tertiary">Customer</p>
                  <div className="mt-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground">MT</span><div><p className="text-sm font-medium">Mia Thompson</p><p className="text-xs text-secondary">3 appointments</p></div></div>
                  <div className="mt-7 space-y-4 border-t border-border pt-5 text-xs"><div><p className="text-tertiary">Next booking</p><p className="mt-1 font-medium">Silk press · Saturday</p></div><div><p className="text-tertiary">Preferred channel</p><p className="mt-1 font-medium">Instagram</p></div><div><p className="text-tertiary">Handled by</p><p className="mt-1 font-medium">Nia</p></div></div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1120px] px-5 py-24 sm:px-8 md:py-32">
          <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow>Meet your AI agent</Eyebrow>
              <SectionHeading>Nia turns enquiries into confirmed appointments.</SectionHeading>
              <p className="mt-6 max-w-[470px] text-base leading-7 text-secondary">Give Nia your services, team, hours and policies. She uses your live calendar and booking rules to guide every customer from first question to confirmation.</p>
              <div className="mt-9 space-y-5">
                {[
                  "Knows your services, prices and policies",
                  "Checks real availability before offering a time",
                  "Confirms, reschedules and cancels bookings",
                  "Asks your team for help when judgement is needed",
                ].map((item) => <div key={item} className="flex items-start gap-3 text-sm"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-blue-soft text-blue-strong"><Check className="size-3" /></span>{item}</div>)}
              </div>
              <Button asChild variant="outline" className="mt-9 rounded-full"><Link to="/auth">See how Nia works <ArrowRight /></Link></Button>
            </div>
            <div className="relative min-h-[500px] overflow-hidden rounded-lg bg-panel-subtle">
              <img src={sculpture} alt="Blue glass Pingbase sculpture" className="absolute -right-20 bottom-[-15%] h-[92%] max-w-none object-contain opacity-90" />
              <div className="absolute left-5 top-6 w-[78%] max-w-[350px] rounded-lg border border-border bg-panel p-4 shadow-md sm:left-10 sm:top-10">
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="size-4" /></span><div><p className="text-sm font-medium">Nia</p><p className="text-xs text-secondary">Booking concierge</p></div><span className="ml-auto size-2 rounded-full bg-success" /></div>
                <div className="mt-5 rounded-md bg-panel-subtle p-4 text-sm leading-6">Maya has two openings on Friday. Would you prefer 11:00am or 3:30pm?</div>
                <div className="mt-3 flex gap-2"><span className="rounded-full border border-border px-3 py-1.5 text-xs">11:00am</span><span className="rounded-full border border-primary bg-blue-soft px-3 py-1.5 text-xs text-blue-strong">3:30pm</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-panel-subtle">
          <div className="mx-auto max-w-[1120px] px-5 py-24 sm:px-8 md:py-32">
            <Eyebrow>Every stage, covered</Eyebrow>
            <SectionHeading>One customer journey, without the manual hand-offs.</SectionHeading>
            <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {JOURNEY.map(({ icon: Icon, title, body }) => (
                <article key={title} className="bg-panel p-7 sm:p-10">
                  <span className="grid size-10 place-items-center rounded-md bg-blue-soft text-blue-strong"><Icon className="size-5" /></span>
                  <h3 className="mt-8 text-xl font-medium">{title}</h3>
                  <p className="mt-3 max-w-[390px] text-sm leading-6 text-secondary">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="resources" className="mx-auto max-w-[1120px] px-5 py-24 sm:px-8 md:py-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-border bg-panel-subtle p-6 sm:p-10">
              <div className="absolute left-[12%] top-[12%] grid size-14 place-items-center rounded-xl border border-border bg-panel shadow-md"><MessageCircle className="size-6 text-success" /></div>
              <div className="absolute right-[14%] top-[18%] grid size-14 place-items-center rounded-xl border border-border bg-panel shadow-md"><Instagram className="size-6 text-primary" /></div>
              <div className="absolute bottom-[16%] left-[18%] grid size-14 place-items-center rounded-xl border border-border bg-panel shadow-md"><Mail className="size-6 text-chart-3" /></div>
              <div className="absolute bottom-[12%] right-[15%] grid size-14 place-items-center rounded-xl border border-border bg-panel shadow-md"><CalendarCheck2 className="size-6 text-chart-4" /></div>
              <div className="absolute inset-0 m-auto grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-button-glow"><MessagesSquare className="size-10" /></div>
              <div className="absolute left-1/2 top-1/2 h-px w-[32%] -translate-x-full -rotate-[28deg] bg-border-strong" />
              <div className="absolute left-1/2 top-1/2 h-px w-[30%] rotate-[25deg] bg-border-strong" />
              <div className="absolute bottom-[27%] left-1/2 h-px w-[27%] -translate-x-full rotate-[30deg] bg-border-strong" />
              <div className="absolute bottom-[25%] left-1/2 h-px w-[28%] -rotate-[31deg] bg-border-strong" />
            </div>
            <div>
              <Eyebrow>Fits your business</Eyebrow>
              <SectionHeading>Connect the tools your customers and team already use.</SectionHeading>
              <p className="mt-6 max-w-[470px] text-base leading-7 text-secondary">Bring messages, calendars, files and customer details together. Pingbase keeps each business separate and every conversation secure.</p>
              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                <div><ShieldCheck className="size-5 text-primary" /><h3 className="mt-3 text-sm font-medium">Private by design</h3><p className="mt-2 text-sm leading-6 text-secondary">Each workspace keeps its own data, channels and customer records.</p></div>
                <div><Sparkles className="size-5 text-primary" /><h3 className="mt-3 text-sm font-medium">Simple to set up</h3><p className="mt-2 text-sm leading-6 text-secondary">Add your business details, connect channels and let Nia start helping.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto max-w-[1120px] px-5 py-24 sm:px-8 md:py-32">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase text-sidebar-primary"><span className="size-1.5 rounded-full bg-sidebar-primary" />Built for appointment teams</div>
                <h2 className="text-[34px] font-medium leading-[1.08] sm:text-[48px]">A calmer day for your team. A faster answer for every customer.</h2>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-border sm:grid-cols-3">
                {[["24/7", "enquiries answered"], ["1", "shared customer view"], ["0", "invented time slots"]].map(([metric, label]) => <div key={label} className="bg-sidebar-accent p-6 sm:p-8"><p className="text-4xl font-medium text-sidebar-primary">{metric}</p><p className="mt-3 text-sm text-sidebar-foreground/70">{label}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1120px] px-5 py-24 sm:px-8 md:py-32">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div><Eyebrow>Customer stories</Eyebrow><SectionHeading>More time for the work customers came for.</SectionHeading></div>
            <div className="flex gap-1 text-primary" aria-label="Five star rating">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="size-4 fill-current" />)}</div>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              ["We stopped losing bookings overnight. Customers wake up with confirmed appointments, not unanswered DMs.", "Amara Cole", "Salon owner"],
              ["The whole team can see what Nia promised and step in without asking the customer to repeat themselves.", "Leah Morgan", "Studio manager"],
              ["Reschedules used to take five messages. Now customers choose another real time and the calendar updates.", "Maya Ellis", "Independent stylist"],
            ].map(([quote, name, role]) => (
              <figure key={name} className="flex min-h-[270px] flex-col rounded-lg border border-border bg-panel p-7">
                <blockquote className="text-lg font-medium leading-7">“{quote}”</blockquote>
                <figcaption className="mt-auto pt-8"><p className="text-sm font-medium">{name}</p><p className="mt-1 text-xs text-secondary">{role}</p></figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-t border-border bg-panel-subtle">
          <div className="mx-auto max-w-[900px] px-5 py-24 text-center sm:px-8 md:py-32">
            <Eyebrow>Start today</Eyebrow>
            <h2 className="text-[40px] font-medium leading-[1.05] sm:text-[56px] md:text-[64px]">Turn the next message into your next booking.</h2>
            <p className="mx-auto mt-6 max-w-[540px] text-base leading-7 text-secondary">Bring your channels, calendar and team into one place. Nia handles the conversation while you focus on the appointment.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3"><Button asChild size="lg" className="h-11 rounded-full px-6"><Link to="/auth">Get started <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6"><Link to="/auth">Book a demo</Link></Button></div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">{CHECKS.map((item) => <span key={item} className="flex items-center gap-1.5 text-xs text-secondary"><CheckCircle2 className="size-3.5 text-primary" />{item}</span>)}</div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-[1120px] px-5 py-14 sm:px-8">
          <div className="grid gap-12 border-b border-sidebar-border pb-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
            <div><div className="flex items-center gap-2 text-base font-semibold"><span className="grid size-7 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><MessagesSquare className="size-4" /></span>Pingbase</div><p className="mt-4 max-w-[230px] text-sm leading-6 text-sidebar-foreground/60">The AI booking concierge for appointment businesses.</p></div>
            {FOOTER_LINKS.map((group) => <div key={group.title}><h3 className="text-xs font-medium uppercase text-sidebar-foreground/50">{group.title}</h3><ul className="mt-5 space-y-3">{group.links.map((link) => <li key={link}><a href="#platform" className="text-sm text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground">{link}</a></li>)}</ul></div>)}
          </div>
          <div className="flex flex-col gap-4 pt-7 text-xs text-sidebar-foreground/50 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Pingbase. All rights reserved.</p><div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" />All systems operational</span><Clock3 className="size-3.5" /><FileText className="size-3.5" /></div></div>
        </div>
      </footer>
    </div>
  );
}
