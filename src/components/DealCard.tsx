import Link from "next/link";
import { PLATFORM_LABELS, type Deal } from "@/lib/types";
import { formatPrice, formatTimeLeft } from "@/lib/format";
import { deleteDeal } from "@/app/deals/actions";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { WishlistButton } from "@/components/WishlistButton";
import { GameImage } from "@/components/GameImage";

type Props = { deal: Deal; userId?: string | null; inWishlist?: boolean; eurRate?: number | null };

const HOUR = 3_600_000;

export function DealCard({ deal, userId, inWishlist = false, eurRate }: Props) {
  const sale = formatPrice(deal.sale_price, deal.currency);
  const normal =
    deal.normal_price && deal.normal_price > deal.sale_price ? formatPrice(deal.normal_price, deal.currency) : null;
  const timeLeft = formatTimeLeft(deal.ends_at);
  const now = Date.now();
  const endingSoon = deal.ends_at !== null && new Date(deal.ends_at).getTime() - now < 24 * HOUR;
  // « Nouveau » : premier jour de suivi (l'historique des prix survit aux allers-retours d'une promo,
  // contrairement à created_at qui est remis à zéro quand une promo réapparaît).
  const isNew =
    deal.source !== "community" && deal.tracked_days <= 1 && now - new Date(deal.created_at).getTime() < 24 * HOUR;
  // Prix en dollars (CheapShark) : équivalent approximatif en euros.
  const approxEur =
    deal.currency === "USD" && eurRate && deal.sale_price > 0 ? formatPrice(deal.sale_price * eurRate, "EUR") : null;
  const lowest =
    deal.tracked_days >= 3 && deal.lowest_price !== null && deal.lowest_price < deal.sale_price
      ? formatPrice(deal.lowest_price, deal.currency)
      : null;
  const isOwner = deal.source === "community" && userId && deal.created_by === userId;

  return (
    <SpotlightCard className="card group transition hover:-translate-y-0.5 hover:border-accent/60">
      <article className="flex h-full flex-col">
        <Link href={`/jeu/${deal.id}`} className="relative block aspect-[460/215] overflow-hidden bg-surface-2">
          <GameImage
            src={deal.image_url}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          {deal.discount > 0 && (
            <span className="absolute top-2 left-2 rounded-md bg-deal px-1.5 py-0.5 text-xs font-black text-black sm:px-2 sm:text-sm">
              -{deal.discount}%
            </span>
          )}
          {isNew && !deal.is_lowest && (
            <span className="absolute bottom-2 left-2 rounded-md bg-sky-400 px-1.5 py-0.5 text-[10px] font-bold text-black sm:px-2 sm:text-xs">
              Nouveau
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
        </Link>

        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium sm:gap-1.5 sm:text-[11px]">
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-slate-300">{PLATFORM_LABELS[deal.platform]}</span>
            <span className="max-w-full truncate rounded bg-surface-2 px-1.5 py-0.5 text-muted">{deal.store}</span>
            {deal.external_id.startsWith("bundle_") && (
              <span className="rounded bg-amber-400/15 px-1.5 py-0.5 font-semibold text-amber-300">Bundle</span>
            )}
            {deal.external_id.startsWith("sub_") && (
              <span className="rounded bg-sky-400/15 px-1.5 py-0.5 font-semibold text-sky-300">Pack</span>
            )}
            {deal.source === "community" && (
              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">Communauté</span>
            )}
          </div>

          <h3 className="line-clamp-2 text-sm leading-snug font-semibold sm:text-base" title={deal.title}>
            <Link href={`/jeu/${deal.id}`} className="hover:text-accent">
              {deal.title}
            </Link>
          </h3>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1 sm:pt-2">
            <div>
              {normal && <div className="text-xs text-muted line-through">{normal}</div>}
              <div className="text-base font-bold text-deal sm:text-lg">{sale}</div>
              {approxEur && <div className="text-[11px] text-muted">≈ {approxEur}</div>}
            </div>
            {timeLeft && (
              <span
                className={`flex items-center gap-1 text-[11px] sm:text-xs ${endingSoon ? "font-semibold text-danger" : "text-amber-400"}`}
              >
                {endingSoon && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger motion-reduce:animate-none"
                  />
                )}
                {endingSoon ? `Dernières heures · ${timeLeft.replace("Encore ", "")}` : timeLeft}
              </span>
            )}
          </div>

          {lowest && (
            <p className="text-[11px] text-muted sm:text-xs" title={`Suivi depuis ${deal.tracked_days} jours`}>
              Plus bas observé : <span className="text-slate-300">{lowest}</span>
            </p>
          )}

          <div className="flex gap-2">
            <a
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title={`Ouvre ${deal.store} dans un nouvel onglet — aucun achat sur Promo Tracker`}
              className="btn-ghost h-9 min-w-0 flex-1 gap-1 px-2 text-xs"
            >
              <span className="min-w-0 truncate">
                <span className="sm:hidden">Voir l&apos;offre</span>
                <span className="hidden sm:inline">Voir sur {deal.store}</span>
              </span>
              <span aria-hidden>↗</span>
            </a>
            <WishlistButton
              title={deal.title}
              platform={deal.platform}
              initial={inWishlist}
              loggedIn={Boolean(userId)}
            />
          </div>

          {isOwner && (
            <form action={deleteDeal} className="border-t border-border pt-2">
              <input type="hidden" name="id" value={deal.id} />
              <button className="py-1 text-xs text-muted hover:text-danger">Supprimer ma promo</button>
            </form>
          )}
        </div>
      </article>
    </SpotlightCard>
  );
}
