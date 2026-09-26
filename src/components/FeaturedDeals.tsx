import { formatPrice } from "@/lib/format";
import { PLATFORM_LABELS, type Deal } from "@/lib/types";

/** Panneau « À la une » du hero : la meilleure promo de chaque grande boutique. */
export function FeaturedDeals({ deals, total }: { deals: Deal[]; total: number }) {
  if (deals.length === 0) return null;

  return (
    <div className="relative">
      {/* Halo derrière le panneau */}
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent/20 blur-3xl" />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-deal" />
            </span>
            À la une aujourd&apos;hui
          </p>
          <span className="text-xs text-muted">Meilleures réductions</span>
        </div>

        <ul className="divide-y divide-border">
          {deals.map((deal) => (
            <li key={deal.id}>
              <a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-surface-2/70"
              >
                <div className="relative aspect-[460/215] w-28 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {deal.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={deal.image_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white group-hover:text-accent">{deal.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {PLATFORM_LABELS[deal.platform]} · {deal.store}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-md bg-deal px-1.5 py-0.5 text-xs font-black text-black">
                    -{deal.discount}%
                  </span>
                  <p className="mt-1 text-sm font-bold text-deal">{formatPrice(deal.sale_price, deal.currency)}</p>
                  {deal.normal_price && (
                    <p className="text-[11px] text-muted line-through">
                      {formatPrice(deal.normal_price, deal.currency)}
                    </p>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#resultats"
          className="flex items-center justify-between border-t border-border px-5 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-surface-2/70 hover:text-white"
        >
          Voir les {new Intl.NumberFormat("fr-FR").format(total)} promos
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
