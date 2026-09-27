import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { GameImage } from "@/components/GameImage";
import type { Deal } from "@/lib/types";

function hoursLeft(iso: string) {
  const h = Math.max(1, Math.floor((new Date(iso).getTime() - Date.now()) / 3_600_000));
  return h < 24 ? `${h} h` : `${Math.floor(h / 24)} j ${h % 24} h`;
}

/** « Dernière chance » : les grosses promos qui se terminent dans les 48 h, en rangée défilante. */
export async function LastChanceRail() {
  const supabase = await createClient();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3_600_000);
  const { data } = await supabase
    .from("deals")
    .select("*")
    .gt("ends_at", now.toISOString())
    .lt("ends_at", in48h.toISOString())
    .gte("discount", 50)
    .gt("sale_price", 0)
    .not("image_url", "is", null)
    .order("discount", { ascending: false })
    .limit(14);

  const deals = ((data ?? []) as Deal[]).sort((a, b) => a.ends_at!.localeCompare(b.ends_at!));
  if (deals.length < 3) return null;

  return (
    <section aria-labelledby="last-chance-title" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="last-chance-title" className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-danger motion-reduce:animate-none" />
            Dernière chance
          </h2>
          <p className="text-xs text-muted sm:text-sm">Grosses promos qui se terminent dans les 48 heures.</p>
        </div>
        <Link
          href="/?sort=ending#resultats"
          className="shrink-0 text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Tout voir →
        </Link>
      </div>

      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {deals.map((deal) => (
          <li key={deal.id} className="w-60 shrink-0 snap-start sm:w-64">
            <Link
              href={`/jeu/${deal.id}`}
              className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:border-danger/50"
            >
              <div className="relative aspect-[460/215] overflow-hidden bg-surface-2">
                <GameImage
                  src={deal.image_url}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute top-2 left-2 rounded-md bg-deal px-1.5 py-0.5 text-xs font-black text-black">
                  -{deal.discount}%
                </span>
                <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                  <svg
                    aria-hidden
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="mr-1 inline align-[-1px]"
                  >
                    <circle cx="12" cy="13" r="8" />
                    <path d="M12 9v4l2 2M9 2h6" />
                  </svg>
                  {hoursLeft(deal.ends_at!)}
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-white group-hover:text-accent">{deal.title}</p>
                <p className="mt-1 flex items-baseline justify-between gap-2 text-xs text-muted">
                  <span className="truncate">{deal.store}</span>
                  <span className="text-sm font-bold text-deal tabular-nums">
                    {formatPrice(deal.sale_price, deal.currency)}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
