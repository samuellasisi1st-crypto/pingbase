import { createFileRoute } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { PlaceholderPage, meta } from "@/components/SimplePages";

export const Route = createFileRoute("/team-chat")({
  head: () => meta("Team Chat", "Talk privately with your team about customers and bookings."),
  component: () => (
    <PlaceholderPage title="Team Chat" subtitle="Talk privately with your team about customers and bookings." icon={MessagesSquare} emptyTitle="No team messages yet" emptyBody="Mention a teammate on any conversation to discuss it here without the customer seeing." />
  ),
});
