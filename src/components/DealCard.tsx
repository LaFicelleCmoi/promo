import { PLATFORM_LABELS, type Deal } from "@/lib/types";
import { formatPrice, formatTimeLeft } from "@/lib/format";
import { deleteDeal } from "@/app/deals/actions";
import { addToWishlist } from "@/app/wishlist/actions";

type Props = { deal: Deal; userId?: string | null };

export function DealCard({ deal, userId }: Props) {
  const sale = formatPrice(deal.sale_price, deal.currency);
  const normal = deal.normal_price && deal.normal_price > deal.sale_price ? formatPrice(deal.normal_price, deal.currency) : null;
  const timeLeft = formatTimeLeft(deal.ends_at);
  const isOwner = deal.source === "community" && userId && deal.created_by === userId;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/60">
      <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="relative block aspect-[460/215] bg-surface-2">
        {deal.image_url ? (
          // Images servies par des CDN tiers très variés : <img> évite de les lister dans next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-muted">🎮</div>
        )}
        {deal.discount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-deal px-2 py-0.5 text-sm font-black text-black">
            -{deal.discount}%
          </span>
        )}
        {deal.sale_price === 0 && (
          <span className="absolute top-2 right-2 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-white">
            GRATUIT
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-slate-300">{PLATFORM_LABELS[deal.platform]}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-muted">{deal.store}</span>
          {deal.source === "community" && (
            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">Communauté</span>
          )}
        </div>

        <h3 className="line-clamp-2 leading-snug font-semibold" title={deal.title}>
          <a href={deal.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-accent">
            {deal.title}
          </a>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {normal && <div className="text-xs text-muted line-through">{normal}</div>}
            <div className="text-lg font-bold text-deal">{sale}</div>
          </div>
          {timeLeft && <span className="text-xs text-amber-400">{timeLeft}</span>}
        </div>

        {userId && (
          <div className="flex gap-2 border-t border-border pt-3">
            <form action={addToWishlist} className="flex-1">
              <input type="hidden" name="title" value={deal.title} />
              <input type="hidden" name="platform" value={deal.platform} />
              <input type="hidden" name="notify" value="1" />
              <button className="w-full text-left text-xs text-muted hover:text-accent">+ Ajouter à ma wishlist</button>
            </form>
            {isOwner && (
              <form action={deleteDeal}>
                <input type="hidden" name="id" value={deal.id} />
                <button className="text-xs text-muted hover:text-danger">Supprimer</button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
