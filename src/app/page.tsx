import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Filters, type FilterValues } from "@/components/Filters";
import { isPlatform } from "@/lib/types";
import { Hero } from "@/components/Hero";
import { DealResults, ResultsSkeleton } from "@/components/DealResults";
import { LastChanceRail } from "@/components/LastChanceRail";

type SearchParams = Promise<FilterValues>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const platform = isPlatform(params.platform) ? params.platform : undefined;
  const supabase = await createClient();

  const { data: storeRows } = await supabase.from("deal_stores").select("store, platform, deals");
  const rows = (storeRows ?? []) as { store: string; platform: string; deals: number }[];
  const platformCounts: Record<string, number> = {};
  for (const r of rows) platformCounts[r.platform] = (platformCounts[r.platform] ?? 0) + r.deals;
  const stores = [...new Set(rows.filter((r) => !platform || r.platform === platform).map((r) => r.store))].sort();

  const values = { ...params, platform };
  // Clé des filtres : à chaque changement, seule la grille affiche son squelette, le reste de la page reste en place.
  const resultsKey = JSON.stringify(values);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Hero
        deals={Object.values(platformCounts).reduce((a, b) => a + b, 0)}
        platforms={Object.values(platformCounts).filter((n) => n > 0).length}
        query={params.q}
      />

      {/* Rangée « Dernière chance » seulement sur la vue d'accueil, sans filtre. */}
      {Object.values(params).every((v) => !v) && (
        <Suspense fallback={null}>
          <LastChanceRail />
        </Suspense>
      )}

      <Filters values={values} stores={stores} platformCounts={platformCounts} />

      <Suspense key={resultsKey} fallback={<ResultsSkeleton />}>
        <DealResults values={values} />
      </Suspense>
    </div>
  );
}
