import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { money } from "@/lib/time";
import { getPaymentPublic, payDepositTestMode } from "@/lib/concierge.functions";

export const Route = createFileRoute("/pay/$paymentId")({
  head: () => ({
    meta: [
      { title: "Pay your deposit — Studio Nine Hair" },
      { name: "description", content: "Secure your appointment at Studio Nine Hair by paying the booking deposit." },
      { property: "og:title", content: "Pay your deposit — Studio Nine Hair" },
      { property: "og:description", content: "Secure your appointment at Studio Nine Hair by paying the booking deposit." },
    ],
  }),
  component: PayPage,
});

function PayPage() {
  const { paymentId } = useParams({ from: "/pay/$paymentId" });

  const payment = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => getPaymentPublic({ data: { paymentId } }),
  });

  const pay = useMutation({
    mutationFn: () => payDepositTestMode({ data: { paymentId } }),
    onSuccess: () => {
      toast.success("Deposit paid — your appointment is confirmed.");
      payment.refetch();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Payment failed"),
  });

  if (payment.isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!payment.data) return <div className="p-10">This payment link is no longer valid.</div>;

  const p = payment.data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-6">
      <div className="w-full max-w-md rounded-2xl border bg-surface p-8">
        <h1 className="font-display text-2xl">Studio Nine Hair</h1>
        <p className="mt-1 text-sm text-muted-foreground">Booking deposit</p>

        <p className="mt-6 font-display text-4xl">{money(p.amount_pence)}</p>
        <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>

        {p.status === "PAID" ? (
          <p className="mt-6 rounded-lg bg-success/15 p-3 text-sm">Paid — your appointment is confirmed.</p>
        ) : (
          <>
            {p.provider === "test" && (
              <p className="mt-6 rounded-lg bg-warning/15 p-3 text-xs">
                Card payments are not connected for this salon yet, so this is a test-mode deposit.
              </p>
            )}
            <Button className="mt-4 w-full" disabled={pay.isPending} onClick={() => pay.mutate()}>
              Pay deposit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
