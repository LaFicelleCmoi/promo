import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DealCard } from "@/components/DealCard";
import { Filters, hrefWith, type FilterValues } from "@/components/Filters";
import { isPlatform, type Deal } from "@/lib/types";
import { NoTransactionNotice } from "@/components/NoTransactionNotice";

const PAGE_SIZE = 24;

type SearchParams = Promise<FilterValues>;

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (c) => `\\${c}`);
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const platform = isPlatform(params.platform) ? params.platform : undefined;
  const supabase = await createClient();

  const [{ data: userData }, { data: storeRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("deal_stores").select("store, platform, deals"),
  ]);

  let query = supabase
    .from("deals")
    .select("*", { count: "exact" })
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);

  if (params.q?.trim()) query = query.ilike("title", `%${escapeLike(params.q.trim())}%`);
  if (platform) query = query.eq("platform", platform);
  if (params.store) query = query.eq("store", params.store);
  if (Number(params.min) > 0) query = query.gte("discount", Number(params.min));
  if (params.max !== undefined && params.max !== "" && Number(params.max) >= 0) query = query.lte("sale_price", Number(params.max));
  if (params.free === "1") query = query.eq("sale_price", 0);

  switch (params.sort) {
    case "price":
      query = query.order("sale_price", { ascending: true });
      break;
    case "recent":
      query = query.order("created_at", { ascending: false });
      break;
    case "ending":
      query = query.order("ends_at", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("discount", { ascending: false }).order("sale_price", { ascending: true });
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order("id").range(from, from + PAGE_SIZE - 1);
  const deals = (data ?? []) as Deal[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const rows = (storeRows ?? []) as { store: string; platform: string; deals: number }[];
  const platformCounts: Record<string, number> = {};
  for (const r of rows) platformCounts[r.platform] = (platformCounts[r.platform] ?? 0) + r.deals;
  const stores = [...new Set(rows.filter((r) => !platform || r.platform === platform).map((r) => r.store))].sort();

  return (
    <div className="space-y-6 sm:space-y-8">
      <section>
        <h1 className="text-2xl leading-tight font-black tracking-tight text-balance sm:text-4xl">
          Toutes les promos jeux vidéo, <span className="text-accent">au même endroit</span>.
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          PC, PlayStation, Xbox, Nintendo Switch : Steam, Epic, GOG, eShop et les bons plans partagés par la communauté.
        </p>
      </section>

      <NoTransactionNotice />

      <Filters values={{ ...params, platform }} stores={stores} platformCounts={platformCounts} />

      {error && (
        <p className="card border-danger/40 p-4 text-sm text-danger">
          Impossible de charger les promos : {error.message}. Vérifie la configuration Supabase.
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {count ?? 0} promo{(count ?? 0) > 1 ? "s" : ""}
        </span>
        {totalPages > 1 && (
          <span>
            Page {page} / {totalPages}
          </span>
        )}
      </div>

      {deals.length === 0 && !error ? (
        <div className="card p-6 text-center text-muted sm:p-10">
          Aucune promo ne correspond à ces filtres.
        </div>
      ) : (
        <div className="grid gap-3 xs:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} userId={userData.user?.id} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="grid grid-cols-2 gap-2 sm:flex sm:justify-center">
          {page > 1 && (
            <Link href={hrefWith({ ...params, platform }, { page: String(page - 1) })} className="btn-ghost">
              ← Précédent
            </Link>
          )}
          {page < totalPages && (
            <Link href={hrefWith({ ...params, platform }, { page: String(page + 1) })} className="btn-ghost">
              Suivant →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
