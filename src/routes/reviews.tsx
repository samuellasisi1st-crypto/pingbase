import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { PlaceholderPage, meta } from "@/components/SimplePages";

export const Route = createFileRoute("/reviews")({
  head: () => meta("Reviews", "Collect and reply to reviews after every appointment."),
  component: () => (
    <PlaceholderPage title="Reviews" subtitle="Collect and reply to reviews after every appointment." icon={Star} emptyTitle="No reviews yet" emptyBody="Nia can ask happy customers for a review after their visit." />
  ),
});
