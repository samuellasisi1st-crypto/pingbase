import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { PlaceholderPage, meta } from "@/components/SimplePages";

export const Route = createFileRoute("/campaigns")({
  head: () => meta("Campaigns", "Send offers and updates to customers on the channels they already use."),
  component: () => (
    <PlaceholderPage title="Campaigns" subtitle="Send offers and updates to customers on the channels they already use." icon={Send} emptyTitle="Create your first campaign" emptyBody="Reach regulars on WhatsApp, Instagram or email with a single message." />
  ),
});
