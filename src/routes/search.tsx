import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PlaceholderPage, meta } from "@/components/SimplePages";

export const Route = createFileRoute("/search")({
  head: () => meta("Search", "Find any customer, conversation or booking."),
  component: () => (
    <PlaceholderPage title="Search" subtitle="Find any customer, conversation or booking." icon={Search} emptyTitle="Search everything" emptyBody="Customers, messages and appointments in one place." />
  ),
});
