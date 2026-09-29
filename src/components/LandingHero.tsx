import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
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
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import appScreenshot from "@/assets/landing-app-dashboard.jpg";
import heroBackground from "@/assets/landing-hero-background.jpg";
import industriesImage from "@/assets/landing-industries.jpg";
import industryHairBeauty from "@/assets/industry-hair-beauty.jpg";
import industryWellness from "@/assets/industry-wellness.jpg";
import industryClinics from "@/assets/industry-clinics.jpg";
import industryStudios from "@/assets/industry-studios.jpg";
import industryFitness from "@/assets/industry-fitness.jpg";
import ctaPhoto from "@/assets/landing-cta-photo.jpg";
import footerLandscape from "@/assets/pingbase-footer-landscape-clean.png";
import sculpture from "@/assets/dashboard-glass-sculpture.png";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

const INDUSTRIES = [
  { title: "Hair & beauty", body: "Turn DMs into salon bookings, without interrupting the appointment in front of you.", image: industryHairBeauty },
  { title: "Wellness", body: "Answer treatment questions and fill real openings around the clock.", image: industryWellness },
  { title: "Clinics", body: "Guide patients to the right service and keep every follow-up together.", image: industryClinics },
  { title: "Studios", body: "Collect references, confirm sessions and make schedule changes simple.", image: industryStudios },
  { title: "Fitness", body: "Move enquiries from first message to a confirmed class or consultation.", image: industryFitness },
];

const TESTIMONIALS = [
  {
    quote: "We stopped losing bookings overnight. Customers wake up with confirmed appointments, not unanswered DMs.",
    name: "Amara Cole",
    role: "Salon owner",
    metricA: ["24/7", "enquiries answered"],
    metricB: ["31%", "more bookings"],
    positionClass: "object-left",
  },
  {
    quote: "The whole team can see what Nia promised and step in without asking the customer to repeat themselves.",
    name: "Leah Morgan",
    role: "Studio manager",
    metricA: ["1", "shared inbox"],
    metricB: ["8h", "saved each week"],
    positionClass: "object-[75%_center]",
  },
  {
    quote: "Reschedules used to take five messages. Now customers choose another real time and the calendar updates.",
    name: "Maya Ellis",
    role: "Independent stylist",
    metricA: ["5×", "faster changes"],
    metricB: ["0", "double bookings"],
    positionClass: "object-left",
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

function CustomerStories() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const updateCurrent = () => setCurrent(api.selectedScrollSnap());
    updateCurrent();
    api.on("select", updateCurrent);
    api.on("reInit", updateCurrent);
    return () => {
      api.off("select", updateCurrent);
      api.off("reInit", updateCurrent);
    };
  }, [api]);

  const extendedTestimonials = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="relative overflow-hidden bg-sidebar py-24 text-sidebar-foreground md:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mb-12 max-w-[680px]">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase text-sidebar-primary">
            <span className="size-1.5 rounded-full bg-sidebar-primary" />Customer stories
          </div>
          <SectionHeading>More time for the work customers came for.</SectionHeading>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1440px]">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "center", slidesToScroll: 1, startIndex: TESTIMONIALS.length }}
          plugins={[Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {extendedTestimonials.map((item, index) => {
              const isActive = index % TESTIMONIALS.length === current % TESTIMONIALS.length;
              return (
                <CarouselItem key={`${item.name}-${index}`} className="basis-[90%] pl-4 md:basis-[80%] lg:basis-[70%]">
                  <article className={`transition-[opacity,transform] duration-500 motion-reduce:transition-none ${isActive ? "scale-100 opacity-100" : "scale-[.92] opacity-35"}`}>
                    <div className="hidden h-[320px] overflow-hidden rounded-lg bg-panel text-foreground md:flex">
                      <div className="h-full w-[30%] p-3">
                        <div className="relative size-full overflow-hidden rounded-md">
                          <img src={industriesImage} alt={`${item.name}, ${item.role}`} loading="lazy" width={1920} height={768} className={`size-full object-cover ${item.positionClass}`} />
                          <div className="absolute inset-x-0 bottom-0 bg-sidebar/80 p-4 text-sidebar-foreground">
                            <h3 className="text-base font-medium">{item.name}</h3>
                            <p className="mt-1 text-xs text-sidebar-foreground/70">{item.role} at Studio Nine Hair</p>
                          </div>
                          <Button size="icon" variant="secondary" aria-label={`Play ${item.name}'s story`} className="absolute bottom-4 right-3 size-8 rounded-full border-0 bg-panel text-foreground shadow-none hover:bg-panel-subtle"><Play className="size-3 fill-current" /></Button>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-6 lg:p-8">
                        <blockquote className="text-xl font-medium leading-snug lg:text-2xl">“{item.quote}”</blockquote>
                        <div className="flex flex-wrap items-center gap-8">
                          <div><p className="text-2xl font-medium">{item.metricA[0]}</p><p className="mt-1 text-xs text-secondary">{item.metricA[1]}</p></div>
                          <div><p className="text-2xl font-medium">{item.metricB[0]}</p><p className="mt-1 text-xs text-secondary">{item.metricB[1]}</p></div>
                          <Button variant="secondary" className="ml-auto rounded-full border-0 bg-panel-subtle shadow-none hover:bg-hover">See {item.name.split(" ")[0]}’s story <ArrowRight /></Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col overflow-hidden rounded-lg bg-panel text-foreground md:hidden">
                      <div className="aspect-[4/3] w-full p-3">
                        <div className="relative size-full overflow-hidden rounded-md">
                          <img src={industriesImage} alt={`${item.name}, ${item.role}`} loading="lazy" width={1920} height={768} className={`size-full object-cover ${item.positionClass}`} />
                          <div className="absolute inset-x-0 bottom-0 bg-sidebar/80 p-4 text-sidebar-foreground"><h3 className="text-base font-medium">{item.name}</h3><p className="mt-1 text-xs text-sidebar-foreground/70">{item.role} at Studio Nine Hair</p></div>
                          <Button size="icon" variant="secondary" aria-label={`Play ${item.name}'s story`} className="absolute bottom-4 right-3 size-8 rounded-full border-0 bg-panel text-foreground shadow-none"><Play className="size-3 fill-current" /></Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-5 p-5">
                        <blockquote className="text-lg font-medium leading-snug">“{item.quote}”</blockquote>
                        <div className="flex gap-6"><div><p className="text-xl font-medium">{item.metricA[0]}</p><p className="text-xs text-secondary">{item.metricA[1]}</p></div><div><p className="text-xl font-medium">{item.metricB[0]}</p><p className="text-xs text-secondary">{item.metricB[1]}</p></div></div>
                        <Button variant="secondary" className="w-full rounded-full border-0 bg-panel-subtle shadow-none">See {item.name.split(" ")[0]}’s story <ArrowRight /></Button>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((item, index) => (
            <Button key={item.name} variant="ghost" size="icon" aria-label={`Show ${item.name}'s story`} onClick={() => api?.scrollTo(TESTIMONIALS.length + index)} className={`h-2 min-h-2 rounded-full border-0 p-0 shadow-none transition-[width,background-color] ${current % TESTIMONIALS.length === index ? "w-6 bg-sidebar-primary hover:bg-sidebar-primary" : "w-2 bg-sidebar-accent hover:bg-sidebar-border"}`} />
          ))}
        </div>
      </div>
    </section>
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
            <Button asChild variant="outline" className="border-2 border-primary bg-sidebar text-sidebar-foreground shadow-none hover:bg-sidebar-accent">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-2 border-sidebar bg-panel shadow-none max-lg:hidden">
              <Link to="/auth">Book a demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-[1240px] px-5 pb-14 pt-14 sm:px-8 md:pb-20 md:pt-20">
          <h1 className="max-w-[860px] text-[46px] font-normal leading-[1.03] sm:text-[62px] md:text-[76px]">
            More bookings
            <br />
            from every <span className="font-normal text-tertiary">message</span>
          </h1>
          <p className="mt-7 max-w-[480px] text-[17px] leading-relaxed text-secondary md:text-lg">
            Turn customer chats into confirmed appointments. Nia answers, books and follows up across every channel.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-2 border-primary bg-sidebar px-7 text-sidebar-foreground shadow-none hover:bg-sidebar-accent">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-2 border-sidebar bg-panel px-7 shadow-none hover:bg-panel-subtle">
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

        <section aria-label="Pingbase product preview" className="w-full border-y border-border py-0">
          <div className="relative mx-auto flex h-[62vw] max-h-[700px] min-h-[310px] w-full max-w-[1240px] items-end justify-center overflow-hidden bg-panel-subtle px-5 sm:px-10 md:px-16">
            <img src={heroBackground} alt="" aria-hidden="true" width={1600} height={912} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-panel/15" />
            <img src={appScreenshot} alt="Pingbase dashboard showing appointments and customer conversations" className="relative z-10 w-full max-w-[1060px] rounded-t-xl border border-border-strong bg-panel shadow-lg" />
          </div>
        </section>

        <section id="industries" className="border-y border-border bg-panel py-20 md:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex items-end justify-between gap-8">
              <div>
                <Eyebrow>Built around your day</Eyebrow>
                <SectionHeading>One solution, made for appointment businesses.</SectionHeading>
                <p className="mt-5 max-w-[520px] text-base leading-7 text-secondary">Pingbase turns conversations into bookings across teams of every shape and size.</p>
              </div>
            </div>
            <Carousel opts={{ loop: true, align: "start", slidesToScroll: 1 }} className="mt-14">
              <CarouselContent className="-ml-5">
                {INDUSTRIES.map((item) => (
                  <CarouselItem key={item.title} className="basis-[82%] pl-5 sm:basis-1/2 lg:basis-1/4">
                  <article>
                    <div className="aspect-[4/5] w-full overflow-hidden rounded-lg"><img src={item.image} alt={`${item.title} professional with a customer`} loading="lazy" width={384} height={768} className="size-full object-cover" /></div>
                    <h3 className="mt-5 text-base font-medium">{item.title}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-secondary">{item.body}</p>
                    <a href="#platform" className="mt-6 inline-flex items-center gap-2 text-sm font-medium hover:text-primary">See how it works <ArrowRight className="size-4" /></a>
                  </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-8 flex justify-end gap-2">
                <CarouselPrevious className="static size-10 translate-y-0 rounded-full border-border bg-panel shadow-none" />
                <CarouselNext className="static size-10 translate-y-0 rounded-full border-border bg-panel shadow-none" />
              </div>
            </Carousel>
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
            <div className="mt-14 grid overflow-hidden rounded-lg border border-border-strong sm:grid-cols-2">
              {JOURNEY.map(({ icon: Icon, title, body }) => (
                <article key={title} className="min-h-[230px] border-b border-border-strong bg-panel p-7 last:border-b-0 even:border-l sm:p-10 sm:[&:nth-child(3)]:border-b-0">
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

        <CustomerStories />

        <section id="pricing" className="bg-panel py-20 md:py-28">
          <div className="relative mx-auto min-h-[440px] max-w-[1240px] overflow-hidden rounded-lg px-5 py-14 sm:px-8 md:flex md:items-center md:px-12">
            <img src={ctaPhoto} alt="Business owner using Pingbase at her salon" loading="lazy" width={1600} height={800} className="absolute inset-0 size-full object-cover" />
            <div className="relative z-10 max-w-[530px] text-sidebar-foreground">
              <h2 className="text-[38px] font-normal leading-[1.08] sm:text-[50px]">Your new AI concierge.<br />Ready every day.</h2>
              <p className="mt-5 max-w-[470px] text-base leading-7 text-sidebar-foreground/80">Always reachable. Connected to your calendar. Ready to turn the next message into a booking.</p>
              <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" variant="outline" className="h-12 rounded-md border border-primary bg-primary px-6 text-primary-foreground shadow-none hover:bg-primary hover:opacity-90"><Link to="/auth">Try for free</Link></Button><Button asChild size="lg" variant="outline" className="h-12 rounded-md border border-panel bg-panel px-6 text-foreground shadow-none hover:bg-panel-subtle"><Link to="/auth">Book a demo</Link></Button></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden border-t border-border bg-panel text-foreground">
        <img src={footerLandscape} alt="" aria-hidden="true" loading="lazy" width={1920} height={803} className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full object-contain object-bottom" />
        <div className="relative z-10 mx-auto max-w-[1120px] px-5 pb-[220px] pt-14 sm:px-8 sm:pb-[300px] md:pb-[430px]">
          <div className="grid gap-12 border-b border-border pb-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
            <div><div className="flex items-center gap-2 text-base font-semibold"><span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground"><MessagesSquare className="size-4" /></span>Pingbase</div><p className="mt-4 max-w-[230px] text-sm leading-6 text-secondary">The AI booking concierge for appointment businesses.</p></div>
            {FOOTER_LINKS.map((group) => <div key={group.title}><h3 className="text-xs font-medium uppercase text-tertiary">{group.title}</h3><ul className="mt-5 space-y-3">{group.links.map((link) => <li key={link}><a href="#platform" className="text-sm text-secondary transition-colors hover:text-foreground">{link}</a></li>)}</ul></div>)}
          </div>
          <div className="flex flex-col gap-4 pt-7 text-xs text-secondary sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Pingbase. All rights reserved.</p><div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" />All systems operational</span><Clock3 className="size-3.5" /><FileText className="size-3.5" /></div></div>
        </div>
      </footer>
    </div>
  );
}
