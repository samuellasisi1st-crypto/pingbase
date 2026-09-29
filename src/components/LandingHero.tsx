import { useEffect, useRef, useState } from "react";
import testimonialFeature from "@/assets/testimonial-feature.jpg";
import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  CheckCircle2,
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
import heroBackgroundAsset from "@/assets/landing-hero-bg.jpg.asset.json";
import appScreenshotAsset from "@/assets/pingbase-product-ui.png.asset.json";
import niaRobotAsset from "@/assets/nia-robot.jpg.asset.json";
import omnichannelUiAsset from "@/assets/nia-omnichannel-ui.png.asset.json";
import phoneCtaAsset from "@/assets/landing-phone-cta.jpg.asset.json";
import industriesImage from "@/assets/landing-industries.jpg";
import industryHairBeauty from "@/assets/industry-hair-beauty.jpg";
import industryWellness from "@/assets/industry-wellness.jpg";
import industryClinics from "@/assets/industry-clinics.jpg";
import industryStudios from "@/assets/industry-studios.jpg";
import industryFitness from "@/assets/industry-fitness.jpg";
import ctaPhoto from "@/assets/landing-cta-photo.jpg";
import footerLandscape from "@/assets/pingbase-footer-landscape-clean.png";
import platformConvertGlass from "@/assets/platform-convert-glass.png";
import platformTimeGlass from "@/assets/platform-time-glass.png";
import platformRevenueGlass from "@/assets/platform-revenue-glass.png";
import platformContextGlass from "@/assets/platform-context-glass.png";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const MENU = [
  { label: "Industries", href: "#industries" },
  { label: "Platform", href: "#platform" },
  { label: "Nia", href: "#nia" },
  { label: "Stories", href: "#stories" },
];

const CHECKS = ["14-day free trial", "No credit card required", "Cancel anytime"];
const HERO_WORDS = ["message", "enquiry", "DM", "conversation"];

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

const PLATFORM_OUTCOMES = [
  {
    title: "Convert more enquiries",
    body: "Reply while customers are ready to book, even outside opening hours.",
    image: platformConvertGlass,
    alt: "Glass conversation and confirmation icon",
  },
  {
    title: "Protect your team’s time",
    body: "Keep routine questions and scheduling out of your team’s day.",
    image: platformTimeGlass,
    alt: "Glass clock and sparkle icon",
  },
  {
    title: "Know what drives revenue",
    body: "Connect conversations to appointments, services and outcomes.",
    image: platformRevenueGlass,
    alt: "Glass revenue growth icon",
  },
  {
    title: "Keep every customer connected",
    body: "Carry verified customer context across channels, bookings and follow-ups.",
    image: platformContextGlass,
    alt: "Glass customer and connected channels icon",
  },
];

const TESTIMONIALS = [
  {
    quote: "We needed coverage without adding to payroll. Pingbase filled the gap instantly and gave us way more consistency than temporary staff.",
    name: "Amara Cole",
    role: "Owner, Studio Nine Hair",
    image: industryHairBeauty,
    tone: "dark",
    span: "lg:col-start-1 lg:row-start-1 lg:row-span-2",
  },
  {
    quote: "We used to miss DMs and lose leads after hours. Now Nia handles every channel and we wake up to booked clients.",
    name: "Leah Morgan",
    role: "Studio manager, East London",
    image: industryStudios,
    tone: "neutral",
    span: "lg:col-start-2 lg:row-start-1",
  },
  {
    quote: "We no longer miss calls, and clients get an immediate reply even after hours. It feels like having a 24/7 front desk without the overhead.",
    name: "Maya Ellis",
    role: "Independent stylist",
    image: industryWellness,
    tone: "neutral",
    span: "lg:col-start-3 lg:row-start-1",
  },
  {
    quote: "With Pingbase, I’m booking more appointments than before. Clients learn about my services, identify relevant options and confirm in my list.",
    name: "Nia Okafor",
    role: "Founder, Nia Skin Studio",
    image: industryClinics,
    tone: "neutral",
    span: "lg:col-start-2 lg:row-start-2",
  },
  {
    quote: "Pingbase understands our callers, captures the right information, and routes calls to the right person. My customers don’t even realize it’s AI.",
    name: "Dana M.",
    role: "Partner, BrightPath Clinic",
    image: industryFitness,
    tone: "neutral",
    span: "lg:col-start-1 lg:row-start-3",
  },
  {
    quote: "Nia sounds natural, conversations flow nicely, and the appointment-booking feature works like a charm. It just asked for my web address and handled setup by itself.",
    name: "Amy G.",
    role: "Co-founder, Rooted Skincare",
    image: industryHairBeauty,
    tone: "accent",
    span: "lg:col-start-3 lg:row-start-2 lg:row-span-2",
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

function RotatingHeroWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % HERO_WORDS.length), 2400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-grid min-w-[12ch] text-tertiary" aria-live="polite">
      <span key={HERO_WORDS[index]} className="col-start-1 row-start-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {HERO_WORDS[index]}
      </span>
    </span>
  );
}

function CustomerStories() {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }));

  return (
    <section className="bg-panel py-20 text-foreground md:py-28">
      <div className="mx-auto max-w-[1360px] border-x border-border px-5 sm:px-8">
        <div className="grid gap-8 border-t border-border pt-5 md:grid-cols-[1fr_370px] md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase text-secondary">
              <span className="size-2 rounded-sm bg-primary" />Testimonials
            </div>
            <h2 className="max-w-[620px] text-[42px] font-medium leading-[1.02] sm:text-[54px] lg:text-[64px]">
              Customers love<br />using Pingbase
            </h2>
          </div>
          <div className="pb-1">
            <p className="max-w-[350px] text-sm leading-6 text-secondary">See how appointment businesses use Pingbase to reply faster, stay available and turn more conversations into bookings.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-md border-0 bg-primary text-primary-foreground shadow-none hover:bg-primary hover:opacity-90"><Link to="/auth">Start free trial</Link></Button>
              <Button asChild variant="outline" className="rounded-md border border-border-strong bg-panel shadow-none hover:bg-panel-subtle"><Link to="/auth">Book a demo</Link></Button>
            </div>
          </div>
        </div>

        <figure className="relative mt-14 overflow-hidden rounded-md">
          <img src={testimonialFeature} alt="A salon owner sharing her experience using Pingbase" className="aspect-[16/9] w-full object-cover" />
          <button
            type="button"
            aria-label="Play customer story"
            className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-panel/90 text-foreground shadow-lg transition-transform hover:scale-105 sm:size-20"
          >
            <Play className="ml-1 size-6 fill-current sm:size-7" aria-hidden="true" />
          </button>
          <blockquote className="absolute bottom-5 left-5 right-5 text-base font-medium leading-snug text-white drop-shadow sm:bottom-8 sm:left-8 sm:max-w-[470px] sm:right-auto sm:text-2xl">
            “Nia keeps our chairs full. Every enquiry gets an answer and a booking before we’re even back in the room.”
          </blockquote>
          <figcaption className="absolute bottom-5 right-5 hidden text-right text-sm text-white/90 drop-shadow sm:block sm:bottom-8 sm:right-8">
            <p className="font-medium">Studio Nine Hair</p>
            <p className="mt-0.5 text-xs opacity-80">Shoreditch, London</p>
          </figcaption>
        </figure>

        <Carousel
          className="mt-14"
          opts={{ align: "start", loop: true }}
          plugins={[autoplay.current]}
          aria-label="Customer testimonials"
        >
          <CarouselContent className="-ml-4">
            {TESTIMONIALS.map((item) => {
              const cardTone = item.tone === "dark"
                ? "bg-sidebar text-sidebar-foreground"
                : item.tone === "accent"
                  ? "bg-primary text-primary-foreground"
                  : "bg-panel-subtle text-foreground";
              const metaTone = item.tone === "neutral" ? "text-secondary" : "opacity-70";
              return (
                <CarouselItem key={item.name} className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3">
                  <article className={`flex h-[330px] flex-col justify-between rounded-md p-6 sm:p-7 ${cardTone}`}>
                    <div>
                      <p className={`mb-7 text-xs font-medium ${metaTone}`}>Studio Nine Hair</p>
                      <blockquote className="text-lg leading-[1.45] sm:text-xl">“{item.quote}”</blockquote>
                    </div>
                    <div className="mt-8 flex items-end justify-between gap-4">
                      <div><p className="text-xs font-medium">{item.name}</p><p className={`mt-1 text-[10px] ${metaTone}`}>{item.role}</p></div>
                      <img src={item.image} alt="" loading="lazy" width={384} height={768} className="size-10 shrink-0 rounded-full object-cover" />
                    </div>
                  </article>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="mt-6 flex justify-end gap-2">
            <CarouselPrevious className="static size-9 translate-y-0 rounded-md border-border-strong bg-panel shadow-none" />
            <CarouselNext className="static size-9 translate-y-0 rounded-md border-border-strong bg-panel shadow-none" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

export function LandingHero() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");

    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  return (
    <div className="min-h-dvh overflow-hidden bg-panel text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-panel/95 backdrop-blur">
        <div className="mx-auto grid h-16 w-full max-w-[1360px] grid-cols-[auto_1fr] items-center border-x border-border px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
          <Logo />
          <nav aria-label="Main" className="hidden items-center justify-self-center md:flex">
            {MENU.map((item) => (
                <a key={item.label} href={item.href} className="flex h-9 items-center gap-1 rounded-md px-3.5 text-[15px] text-secondary transition-colors hover:bg-hover hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="outline" className="rounded-md border-0 bg-sidebar text-sidebar-foreground shadow-none hover:bg-sidebar-accent">
              <Link to="/auth">Sign up</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-md border border-border-strong bg-panel shadow-none max-sm:px-3">
              <Link to="/auth">Book a demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-[1360px] border-x border-border px-5 pb-14 pt-14 sm:px-8 md:pb-20 md:pt-20">
          <h1 className="max-w-[1040px] text-[46px] font-normal leading-[1.03] sm:text-[62px] md:text-[76px]">
            More bookings
            <br />
            from every <RotatingHeroWord />
          </h1>
          <p className="mt-7 max-w-[480px] text-[17px] leading-relaxed text-secondary md:text-lg">
            Turn customer chats into confirmed appointments. Nia answers, books and follows up across every channel.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="outline" className="h-13 rounded-md border-0 bg-sidebar px-7 text-sidebar-foreground shadow-none hover:bg-sidebar-accent">
              <Link to="/auth">Sign up</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-md border border-border-strong bg-panel px-7 shadow-none hover:bg-panel-subtle">
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

        <section aria-label="Pingbase product preview" className="w-full border-b border-border py-0">
          <div className="relative mx-auto flex h-[62vw] max-h-[760px] min-h-[310px] w-full max-w-[1360px] items-center justify-center overflow-hidden border-x border-border bg-panel-subtle px-8 py-8 sm:px-16 sm:py-12 md:px-24 lg:px-32">
            <img src={heroBackgroundAsset.url} alt="" aria-hidden="true" width={1024} height={768} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-panel/15" />
            <img src={appScreenshotAsset.url} alt="Pingbase inbox showing customer conversations, images and booking details" className="relative z-10 max-h-[78%] w-full max-w-[980px] object-contain object-center" />
          </div>
        </section>

        <section id="industries" className="border-b border-border bg-panel py-20 md:py-28">
          <div className="mx-auto max-w-[1360px] border-x border-border px-5 sm:px-8">
            <div className="flex items-end justify-between gap-8">
              <div>
                <Eyebrow>Built around your day</Eyebrow>
                <SectionHeading>One solution, made for appointment businesses.</SectionHeading>
                <p className="mt-5 max-w-[520px] text-base leading-7 text-secondary">Pingbase turns conversations into bookings across teams of every shape and size.</p>
              </div>
            </div>
          </div>
          <Carousel opts={{ loop: true, align: "start", slidesToScroll: 1 }} className="mt-14 w-full">
              <CarouselContent className="ml-0 pl-5 sm:pl-8 min-[1360px]:pl-[calc((100vw-1360px)/2+32px)]">
                {INDUSTRIES.map((item) => (
                  <CarouselItem key={item.title} className="basis-[82%] pl-5 first:pl-0 last:pr-5 sm:basis-[46%] lg:basis-[27%] xl:basis-[23%]">
                  <article>
                    <div className="aspect-[4/5] w-full overflow-hidden rounded-lg"><img src={item.image} alt={`${item.title} professional with a customer`} loading="lazy" width={384} height={768} className="size-full object-cover" /></div>
                    <h3 className="mt-5 text-base font-medium">{item.title}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-secondary">{item.body}</p>
                    <a href="#platform" className="mt-6 inline-flex items-center gap-2 text-sm font-medium hover:text-primary">See how it works <ArrowRight className="size-4" /></a>
                  </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mx-auto mt-8 flex max-w-[1360px] justify-end gap-2 border-x border-border px-5 sm:px-8">
                <CarouselPrevious className="static size-10 translate-y-0 rounded-full border-border bg-panel shadow-none" />
                <CarouselNext className="static size-10 translate-y-0 rounded-full border-border bg-panel shadow-none" />
              </div>
          </Carousel>
        </section>

        <section className="border-b border-border bg-panel" aria-label="Connected channels">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-center gap-x-10 gap-y-6 border-x border-border px-5 py-9 sm:px-8 md:justify-between">
            <p className="w-full text-center text-xs font-medium uppercase text-tertiary md:w-auto md:text-left">One inbox for every conversation</p>
            {CHANNELS.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-secondary">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-[1360px] border-x border-border px-5 py-24 sm:px-8 md:py-32">
          <div className="max-w-[720px]">
            <Eyebrow>One connected platform</Eyebrow>
            <SectionHeading>Unify conversations, bookings and follow-ups so every customer gets an answer.</SectionHeading>
            <p className="mt-6 max-w-[540px] text-base leading-7 text-secondary">
              Pingbase gives your team one clear view of every customer while Nia handles the repetitive work in the background.
            </p>
          </div>
          <div className="mt-16 grid border border-border sm:grid-cols-2">
            {PLATFORM_OUTCOMES.map((item, index) => (
              <article
                key={item.title}
                className={`relative flex min-h-[300px] flex-col justify-end p-7 sm:min-h-[340px] sm:p-9 lg:min-h-[360px] ${index % 2 === 1 ? "sm:border-l sm:border-border" : ""} ${index > 0 ? "border-t border-border sm:border-t-0" : ""} ${index > 1 ? "sm:border-t sm:border-border" : ""}`}
              >
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  width={816}
                  height={816}
                  className="absolute right-5 top-4 size-32 object-contain sm:right-7 sm:top-5 sm:size-36 lg:size-40"
                />
                <h3 className="max-w-[350px] text-xl font-medium">{item.title}</h3>
                <p className="mt-2 max-w-[350px] text-sm leading-6 text-secondary">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="solutions" className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
          <img src={niaRobotAsset.url} alt="Nia, the Pingbase AI concierge" width={736} height={736} className="absolute inset-0 size-full scale-[1.6] object-cover object-[center_10%] sm:scale-[1.4]" />
          <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/80 to-sidebar/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-transparent to-sidebar/55" />
          <div className="relative mx-auto min-h-[820px] max-w-[1360px] border-x border-sidebar-foreground/10 px-5 pb-0 pt-24 sm:px-8 md:pt-32">
            <div className="mx-auto max-w-[700px] text-center">
              <div className="mb-5 flex items-center justify-center gap-2 text-xs font-medium uppercase text-sidebar-primary">
                <span className="size-1.5 rounded-full bg-sidebar-primary" />
                One AI agent. Every channel.
              </div>
              <h2 className="text-[34px] font-medium leading-[1.08] sm:text-[48px] md:text-[56px]">Customers message wherever they like. Nia keeps it all together.</h2>
              <p className="mx-auto mt-6 max-w-[560px] text-base leading-7 text-sidebar-foreground/70">A continuous conversation across WhatsApp, Instagram, Messenger and email—with the same customer context behind every reply.</p>
            </div>

            <img src={omnichannelUiAsset.url} alt="Pingbase omnichannel inbox connected to WhatsApp and Instagram conversations" width={1920} height={877} className="absolute bottom-0 left-1/2 w-[88%] max-w-[1080px] -translate-x-1/2 object-contain object-bottom sm:w-[80%]" />
          </div>
        </section>

        <section id="nia" className="mx-auto max-w-[1360px] border-x border-border px-5 py-24 sm:px-8 md:py-32">
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
              <Button asChild variant="outline" className="mt-9 rounded-md"><Link to="/auth">See how Nia works <ArrowRight /></Link></Button>
            </div>
            <div className="relative min-h-[560px] overflow-hidden rounded-lg bg-panel-subtle">
              <img src={ctaPhoto} alt="Salon professional supported by Nia" width={1600} height={800} className="absolute inset-0 size-full object-cover object-center" />
              <div className="absolute left-5 top-5 w-[calc(100%-2.5rem)] max-w-[390px] rounded-lg border border-border bg-panel p-4 shadow-md sm:left-10 sm:top-10">
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="size-4" /></span><div><p className="text-sm font-medium">Nia</p><p className="text-xs text-secondary">Booking concierge</p></div><span className="ml-auto size-2 rounded-full bg-success" /></div>
                <div className="mt-5 rounded-md bg-panel-subtle p-4 text-sm leading-6">Maya has two openings on Friday. Would you prefer 11:00am or 3:30pm?</div>
                <div className="mt-3 flex gap-2"><span className="rounded-full border border-border px-3 py-1.5 text-xs">11:00am</span><span className="rounded-full border border-primary bg-blue-soft px-3 py-1.5 text-xs text-blue-strong">3:30pm</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-panel-subtle">
          <div className="mx-auto max-w-[1360px] border-x border-border px-5 py-24 sm:px-8 md:py-32">
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

        <section id="resources" className="mx-auto max-w-[1360px] border-x border-border px-5 py-24 sm:px-8 md:py-32">
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

        <div id="stories"><CustomerStories /></div>

        <section id="pricing" className="bg-panel py-20 md:py-28">
          <div className="mx-auto max-w-[1360px] border-x border-border px-5 sm:px-8">
          <div className="relative min-h-[440px] overflow-hidden rounded-lg px-5 py-14 sm:px-8 md:flex md:items-center md:px-12">
            <img src={phoneCtaAsset.url} alt="Business owner using her phone" loading="lazy" width={736} height={414} className="absolute inset-0 size-full object-cover object-center" />
            <div className="relative z-10 max-w-[530px] text-foreground">
              <h2 className="text-[38px] font-normal leading-[1.08] sm:text-[50px]">Your new AI concierge.<br />Ready every day.</h2>
              <p className="mt-5 max-w-[470px] text-base leading-7 text-secondary">Always reachable. Connected to your calendar. Ready to turn the next message into a booking.</p>
              <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" variant="outline" className="h-12 rounded-md border border-primary bg-primary px-6 text-primary-foreground shadow-none hover:bg-primary hover:opacity-90"><Link to="/auth">Try for free</Link></Button><Button asChild size="lg" variant="outline" className="h-12 rounded-md border border-panel bg-panel px-6 text-foreground shadow-none hover:bg-panel-subtle"><Link to="/auth">Book a demo</Link></Button></div>
            </div>
          </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden border-t border-border bg-panel text-foreground">
        <img src={footerLandscape} alt="" aria-hidden="true" loading="lazy" width={1920} height={803} className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full object-contain object-bottom" />
        <div className="relative z-10 mx-auto max-w-[1360px] border-x border-border px-5 pb-[220px] pt-14 sm:px-8 sm:pb-[300px] md:pb-[430px]">
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
