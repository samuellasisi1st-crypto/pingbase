import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatSalonDateTime, money } from "@/lib/time";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — Pingbase" },
      { name: "description", content: "Every booking the concierge has made, with deposits and staff assignment." },
      { property: "og:title", content: "Appointments — Pingbase" },
      { property: "og:description", content: "Every booking the concierge has made, with deposits and staff assignment." },
    ],
  }),
  component: AppointmentsPage,
});

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

function AppointmentsPage() {
  const [status, setStatus] = useState("ALL");

  const appointments = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, service:service_id(name), staff:staff_id(name), contact:contact_id(full_name,email,phone)")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = (appointments.data ?? []).filter((a) => status === "ALL" || a.status === status);

  return (
    <AppShell title="Appointments">
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs ${
                status === s ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground"
              }`}
            >
              {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        {appointments.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!appointments.isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No appointments in this view yet.</p>
        )}

        <div className="grid gap-3">
          {(rows as unknown as Array<{
            id: string;
            starts_at: string;
            ends_at: string;
            status: string;
            deposit_status: string;
            price_pence: number;
            deposit_pence: number;
            service: { name: string } | null;
            staff: { name: string } | null;
            contact: { full_name: string | null; email: string | null; phone: string | null } | null;
          }>).map((a) => (
            <div key={a.id} className="rounded-xl border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{a.service?.name ?? "Service"}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSalonDateTime(a.starts_at)} – {formatSalonDateTime(a.ends_at).split(", ").pop()} · with{" "}
                    {a.staff?.name}
                  </p>
                  <p className="mt-1 text-sm">
                    {a.contact?.full_name ?? "Customer"}
                    {a.contact?.email ? ` · ${a.contact.email}` : ""}
                    {a.contact?.phone ? ` · ${a.contact.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={a.status === "CONFIRMED" ? "default" : a.status === "CANCELLED" ? "destructive" : "secondary"}>
                    {a.status}
                  </Badge>
                  <Badge variant="outline">{money(a.price_pence)}</Badge>
                  {a.deposit_pence > 0 && (
                    <Badge variant="outline">
                      deposit {money(a.deposit_pence)} · {a.deposit_status.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
