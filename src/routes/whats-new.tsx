import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PlaceholderPage, meta } from "@/components/SimplePages";

export const Route = createFileRoute("/whats-new")({
  head: () => meta("What's new", "The latest improvements to Pingbase."),
  component: () => (
    <PlaceholderPage title="What's new" subtitle="The latest improvements to Pingbase." icon={Megaphone} emptyTitle="You're up to date" emptyBody="New features will be announced here." />
  ),
});
