import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { PlaceholderPage, meta } from "@/components/SimplePages";

export const Route = createFileRoute("/help")({
  head: () => meta("Help", "Guides and support for running Pingbase."),
  component: () => (
    <PlaceholderPage title="Help" subtitle="Guides and support for running Pingbase." icon={HelpCircle} emptyTitle="We're here to help" emptyBody="Email support@pingbase.app and a person will get back to you." />
  ),
});
