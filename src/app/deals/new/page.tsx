import type { Metadata } from "next";
import { DealForm } from "@/components/DealForm";
import { NoTransactionNotice } from "@/components/NoTransactionNotice";
import { getSettings } from "@/lib/settings";
import { getUser } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Proposer une promo — Promo Tracker" };

export default async function NewDealPage() {
  const [{ communityDealsOpen }, user] = await Promise.all([getSettings(), getUser()]);
  if (!communityDealsOpen && !isAdmin(user)) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <h1 className="text-2xl font-bold">Propositions fermées</h1>
        <p className="mt-2 text-muted">Les propositions de promos sont temporairement suspendues. Reviens bientôt !</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
