import { createFileRoute } from "@tanstack/react-router";
import { LandingHero } from "@/components/LandingHero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pingbase — AI booking concierge" },
      { name: "description", content: "Turn customer chats into confirmed appointments. Pingbase answers on WhatsApp, Instagram and Messenger and books real appointments in your calendar." },
      { property: "og:title", content: "Pingbase — AI booking concierge" },
      { property: "og:description", content: "Turn customer chats into confirmed appointments. Pingbase answers on WhatsApp, Instagram and Messenger and books real appointments in your calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

// The root URL is the public marketing home page. The signed-in app
// (dashboard, inbox, ...) starts at /dashboard.
function Home() {
  return <LandingHero />;
}
