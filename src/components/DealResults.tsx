import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DealCard } from "@/components/DealCard";
import { SORTS, hrefWith, type FilterValues } from "@/components/Filters";
import { getWishlistKeys, wishlistKey } from "@/lib/wishlist";
import { getUsdToEur } from "@/lib/fx";
import type { Deal } from "@/lib/types";

const PAGE_SIZE = 24;

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (c) => `\\${c}`);
}

/** Pages affichées : 1 … 4 5 [6] 7 8 … 42 */
function pageList(current: number, total: number): (number | "…")[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  if (current <= 3) [2, 3, 4].forEach((p) => p <= total && pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => p >= 1 && pages.add(p));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export async function DealResults({ values, favorites = [] }: { values: FilterValues; favorites?: string[] }) {
  const page = Math.max(1, Number(values.page) || 1);
  const supabase = await createClient();

  let query = supabase
    .from("deals")
    .select("*", { count: "exact" })
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);

  // Chaque mot doit apparaître dans le titre, dans n'importe quel ordre (« star wars jedi » trouve « STAR WARS™ Jedi Bundle »).
  const words = (values.q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 8);
  for (const word of words) query = query.ilike("title", `%${escapeLike(word)}%`);
  if (values.platform) query = query.eq("platform", values.platform);
  else if (values.mine === "1" && favorites.length) query = query.in("platform", favorites);
  if (values.store) query = query.eq("store", values.store);
  if (Number(values.min) > 0) query = query.gte("discount", Number(values.min));
  if (values.max !== undefined && values.max !== "" && Number(values.max) >= 0)
    query = query.lte("sale_price", Number(values.max));
  if (values.free === "1") query = query.eq("sale_price", 0);
  if (values.low === "1") query = query.eq("is_lowest", true);

  switch (values.sort) {
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
  const [{ data, count, error }, { data: auth }, eurRate] = await Promise.all([
    query.order("id").range(from, from + PAGE_SIZE - 1),
    supabase.auth.getUser(),
    getUsdToEur(),
  ]);
  const deals = (data ?? []) as Deal[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userId = auth.user?.id;
  const wishlistKeys = await getWishlistKeys(supabase, userId);
  const pageHref = (p: number) => `${hrefWith(values, { page: p > 1 ? String(p) : undefined })}#resultats`;

  return (
    <>
      <div
        id="resultats"
        className="flex scroll-mt-20 flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"
      >
        <span>
          <span className="font-semibold text-slate-200">{new Intl.NumberFormat("fr-FR").format(total)}</span> promo
          {total > 1 ? "s" : ""}
          {totalPages > 1 && ` · page ${page} / ${totalPages}`}
        </span>
        <nav
          aria-label="Trier les promos"
          className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          <span className="mr-1 hidden self-center text-xs sm:inline">Trier :</span>
          {SORTS.map((sort) => {
            const active = (values.sort ?? "discount") === sort.value;
            return (
              <Link
                key={sort.value}
                href={`${hrefWith(values, { sort: sort.value === "discount" ? undefined : sort.value, page: undefined })}#resultats`}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? "bg-surface-2 text-white ring-1 ring-accent/60"
                    : "text-muted hover:bg-surface hover:text-white"
                }`}
              >
                {sort.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {error && (
        <p className="card border-danger/40 p-4 text-sm text-danger">
          Impossible de charger les promos : {error.message}. Réessaie dans un instant.
        </p>
      )}

      {deals.length === 0 && !error ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center sm:p-12">
          <svg
            aria-hidden
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5M8.5 11h5" />
          </svg>
          <p className="font-semibold text-white">Aucune promo ne correspond à ces filtres</p>
          <p className="max-w-sm text-sm text-muted">
            Essaie un autre mot-clé, retire un filtre, ou ajoute le jeu à ta wishlist pour être alerté de sa prochaine
            promo.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link href="/#resultats" className="btn-primary">
              Voir toutes les promos
            </Link>
            <Link href="/wishlist" className="btn-ghost">
              Ma wishlist
            </Link>
          </div>
        </div>
      ) : (
        <div className="deal-grid grid gap-3 xs:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              userId={userId}
              inWishlist={wishlistKeys.has(wishlistKey(deal.title, deal.platform))}
              eurRate={eurRate}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn-ghost h-10 px-3" aria-label="Page précédente">
              ←
            </Link>
          ) : (
            <span className="btn-ghost h-10 px-3 opacity-40" aria-hidden>
              ←
            </span>
          )}
          {pageList(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
                …
              </span>
            ) : (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={`hidden h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition sm:inline-flex ${
                  p === page
                    ? "inline-flex! border-accent bg-accent text-white"
                    : "border-border bg-surface text-slate-300 hover:border-accent hover:text-white"
                } ${p === 1 || p === totalPages ? "inline-flex!" : ""}`}
              >
                {p}
              </Link>
            ),
          )}
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="btn-ghost h-10 px-3" aria-label="Page suivante">
              →
            </Link>
          ) : (
            <span className="btn-ghost h-10 px-3 opacity-40" aria-hidden>
              →
            </span>
          )}
        </nav>
      )}
    </>
  );
}

export function ResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement des promos" className="space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-3 xs:grid-cols-2 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[460/215] animate-pulse bg-surface-2" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
              <div className="h-6 w-16 animate-pulse rounded bg-surface-2" />
              <div className="h-9 animate-pulse rounded-lg bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
