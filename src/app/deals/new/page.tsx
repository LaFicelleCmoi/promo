import type { Metadata } from "next";
import { DealForm } from "@/components/DealForm";
import { NoTransactionNotice } from "@/components/NoTransactionNotice";

export const metadata: Metadata = { title: "Proposer une promo — Promo Tracker" };

export default function NewDealPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Proposer une promo</h1>
        <p className="mt-1 text-sm text-muted">
          Un bon plan PlayStation Store, Xbox, boîte physique ou mobile ? Partage-le avec la communauté.
        </p>
      </div>
      <DealForm />
      <NoTransactionNotice compact />
    </div>
  );
}
