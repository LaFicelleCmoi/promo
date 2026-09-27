import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { removeFromWishlist, toggleWishlistNotify, updateTargetPrice } from "@/app/wishlist/actions";
import { formatPrice } from "@/lib/format";
import type { GameArt } from "@/lib/gameArt";
import { PLATFORM_LABELS, type Deal, type WishlistItem } from "@/lib/types";

type Props = { item: WishlistItem; deals: Deal[]; art: GameArt | null };

/** Un jeu suivi : image, meilleure offre ou prix actuel, prix cible modifiable, alerte et retrait. */
export function WishlistItemCard({ item, deals, art }: Props) {
  const sorted = [...deals].sort((a, b) => a.sale_price - b.sale_price);
  const bestDeal = sorted[0];
  const image = bestDeal?.image_url ?? art?.image ?? null;
  const onSale = Boolean(bestDeal);

  return (
    <article
      className={`card overflow-hidden transition ${onSale ? "border-deal/40 shadow-[0_0_0_1px_rgba(34,197,94,0.15)]" : ""}`}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[460/215] w-full shrink-0 bg-surface-2 sm:w-64">
          <GameImage src={image} fallbackLabel={item.title} className="h-full w-full object-cover" />
          {onSale && (
            <span className="absolute top-2 left-2 rounded-md bg-deal px-2 py-0.5 text-xs font-black text-black">
              EN PROMO
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-lg leading-snug font-bold text-white" title={item.title}>
                {item.title}
              </h2>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-slate-300">
                  {item.platform ? PLATFORM_LABELS[item.platform] : "Toutes plateformes"}
                </span>
              </div>
            </div>
            <form action={removeFromWishlist}>
              <input type="hidden" name="id" value={item.id} />
              <button
                aria-label={`Retirer ${item.title} de ma wishlist`}
                title="Retirer de ma wishlist"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
              >
                <svg
                  aria-hidden
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                </svg>
              </button>
            </form>
          </div>

          {onSale ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-deal/10 px-3 py-2.5">
              <div>
                <p className="text-xs text-deal">Meilleure offre</p>
                <p className="text-sm text-slate-200">
                  <span className="text-xl font-black text-deal tabular-nums">
                    {formatPrice(bestDeal.sale_price, bestDeal.currency)}
                  </span>{" "}
                  {bestDeal.discount > 0 && <span className="font-semibold">-{bestDeal.discount}%</span>} sur{" "}
                  {bestDeal.store}
                </p>
              </div>
              <Link href={`/jeu/${bestDeal.id}`} className="btn-primary h-9 px-4 text-sm">
                Voir la promo
              </Link>
            </div>
          ) : (
            <div className="rounded-lg bg-surface-2/60 px-3 py-2.5 text-sm">
              <p className="text-slate-300">Pas de promo pour le moment.</p>
              {art?.price != null && (
                <p className="mt-0.5 text-xs text-muted">
                  Prix actuel sur{" "}
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-slate-200 underline-offset-2 hover:underline"
                  >
                    {art.store}
                  </a>{" "}
                  : <span className="font-semibold text-slate-200">{formatPrice(art.price, art.currency)}</span>
                  {item.target_price !== null && art.price > item.target_price && (
                    <>
                      {" "}
                      · encore {formatPrice(art.price - item.target_price, art.currency)} au-dessus de ton prix cible
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <form action={updateTargetPrice} className="flex items-center gap-2">
              <input type="hidden" name="id" value={item.id} />
              <label htmlFor={`target-${item.id}`} className="text-xs text-muted">
                Prix cible
              </label>
              <div className="relative">
                <input
                  id={`target-${item.id}`}
                  name="target_price"
                  inputMode="decimal"
                  defaultValue={item.target_price ?? ""}
                  placeholder="—"
                  className="h-8 w-20 rounded-md border border-border bg-surface-2 pr-5 pl-2 text-sm text-white outline-none focus:border-accent"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted"
                >
                  €
                </span>
              </div>
              <button className="h-8 rounded-md px-2 text-xs font-semibold text-accent hover:bg-accent/10">OK</button>
            </form>

            <form action={toggleWishlistNotify}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="notify" value={String(!item.notify)} />
              <button
                role="switch"
                aria-checked={item.notify}
                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white"
              >
                <span
                  aria-hidden
                  className={`relative h-5 w-9 rounded-full transition ${item.notify ? "bg-accent" : "bg-surface-2 ring-1 ring-border"}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${item.notify ? "left-[18px]" : "left-0.5"}`}
                  />
                </span>
                Alerte email
              </button>
            </form>
          </div>

          {sorted.length > 1 && (
            <details className="group text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-accent hover:text-accent-hover">
                {sorted.length - 1} autre{sorted.length > 2 ? "s" : ""} offre{sorted.length > 2 ? "s" : ""}
              </summary>
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                {sorted.slice(1, 9).map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/jeu/${d.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface-2"
                    >
                      <span className="min-w-0 truncate text-slate-300">
                        {d.title} <span className="text-muted">· {d.store}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-deal tabular-nums">
                        {formatPrice(d.sale_price, d.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}
