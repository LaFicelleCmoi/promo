import { PLATFORM_LABELS, type Deal } from "@/lib/types";
import { formatPrice, formatTimeLeft } from "@/lib/format";
import { deleteDeal } from "@/app/deals/actions";
import { addToWishlist } from "@/app/wishlist/actions";

type Props = { deal: Deal; userId?: string | null };

export function DealCard({ deal, userId }: Props) {
  const sale = formatPrice(deal.sale_price, deal.currency);
  const normal = deal.normal_price && deal.normal_price > deal.sale_price ? formatPrice(deal.normal_price, deal.currency) : null;
  const timeLeft = formatTimeLeft(deal.ends_at);
  const lowest =
    deal.tracked_days >= 3 && deal.lowest_price !== null && deal.lowest_price < deal.sale_price
      ? formatPrice(deal.lowest_price, deal.currency)
      : null;
  const isOwner = deal.source === "community" && userId && deal.created_by === userId;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/60">
      <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="relative block aspect-[460/215] bg-surface-2">
        {deal.image_url ? (
          // Images servies par des CDN tiers très variés : <img> évite de les lister dans next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
              <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59l-.9 7.2A2.5 2.5 0 0 0 4.28 18.6c.84 0 1.62-.43 2.07-1.14L8 15h8l1.65 2.46c.45.71 1.23 1.14 2.07 1.14a2.5 2.5 0 0 0 2.48-2.81l-.9-7.2A4 4 0 0 0 17.32 5z" />
            </svg>
          </div>
        )}
        {deal.discount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-deal px-1.5 py-0.5 text-xs font-black text-black sm:px-2 sm:text-sm">
            -{deal.discount}%
          </span>
        )}
        {deal.is_lowest && deal.sale_price > 0 && (
          <span className="absolute bottom-2 left-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black sm:px-2 sm:text-xs">
            Plus bas prix
          </span>
        )}
        {deal.sale_price === 0 && (
          <span className="absolute top-2 right-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white sm:px-2 sm:text-xs">
            GRATUIT
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium sm:gap-1.5 sm:text-[11px]">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-slate-300">{PLATFORM_LABELS[deal.platform]}</span>
          <span className="max-w-full truncate rounded bg-surface-2 px-1.5 py-0.5 text-muted">{deal.store}</span>
          {deal.source === "community" && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">Communauté</span>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm leading-snug font-semibold sm:text-base" title={deal.title}>
          <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-accent">
            {deal.title}
          </a>
        </h3>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1 sm:pt-2">
          <div>
            {normal && <div className="text-xs text-muted line-through">{normal}</div>}
            <div className="text-base font-bold text-deal sm:text-lg">{sale}</div>
          </div>
          {timeLeft && <span className="text-[11px] text-amber-400 sm:text-xs">{timeLeft}</span>}
        </div>

        {lowest && (
          <p className="text-[11px] text-muted sm:text-xs" title={`Suivi depuis ${deal.tracked_days} jours`}>
            Plus bas observé : <span className="text-slate-300">{lowest}</span>
          </p>
        )}

        <a
          href={deal.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          title={`Ouvre ${deal.store} dans un nouvel onglet — aucun achat sur Promo Tracker`}
          className="btn-ghost w-full min-w-0 gap-1 px-2 py-2 text-xs"
        >
          <span className="min-w-0 truncate">
            <span className="sm:hidden">Voir l&apos;offre</span>
            <span className="hidden sm:inline">Voir sur {deal.store}</span>
          </span>
          <span aria-hidden>↗</span>
        </a>

        {userId && (
          <div className="flex gap-2 border-t border-border pt-2 sm:pt-3">
            <form action={addToWishlist} className="flex-1">
              <input type="hidden" name="title" value={deal.title} />
              <input type="hidden" name="platform" value={deal.platform} />
              <input type="hidden" name="notify" value="1" />
              <button className="w-full py-1 text-left text-xs text-muted hover:text-accent">
                + <span className="hidden sm:inline">Ajouter à ma </span>wishlist
              </button>
            </form>
            {isOwner && (
              <form action={deleteDeal}>
                <input type="hidden" name="id" value={deal.id} />
                <button className="py-1 text-xs text-muted hover:text-danger">Supprimer</button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
