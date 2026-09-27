import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { titleKeywords, titleSimilarity } from "@/lib/titles";
import { getWishlistKeys, wishlistKey } from "@/lib/wishlist";
import { PLATFORM_LABELS, type Deal } from "@/lib/types";
import { PriceHistoryChart, type PricePoint } from "@/components/PriceHistoryChart";
import { WishlistButton } from "@/components/WishlistButton";
import { ShareButton } from "@/components/ShareButton";
import { GameImage } from "@/components/GameImage";
import { getUsdToEur } from "@/lib/fx";
import { NoTransactionNotice } from "@/components/NoTransactionNotice";

type Params = Promise<{ id: string }>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getDeal(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
  return data as Deal | null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const deal = await getDeal((await params).id);
  if (!deal) return { title: "Promo introuvable — Promo Tracker" };
  const price = formatPrice(deal.sale_price, deal.currency);
  const title = `${deal.title} à ${price}${deal.discount > 0 ? ` (-${deal.discount} %)` : ""} — Promo Tracker`;
  return {
    title,
    description: `${deal.title} en promo sur ${deal.store} : ${price}. Historique des prix et comparaison des boutiques.`,
    openGraph: { title, images: deal.image_url ? [deal.image_url] : undefined },
  };
}

function formatEnd(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (date.getTime() < Date.now()) return null;
  return date.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DealPage({ params }: { params: Params }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const supabase = await createClient();
  const keywords = titleKeywords(deal.title);

  let similarQuery = supabase
    .from("deals")
    .select("*")
    .neq("id", deal.id)
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order("sale_price", { ascending: true })
    .limit(40);
  for (const word of keywords) similarQuery = similarQuery.ilike("title", `%${word.replace(/[%_\\]/g, "\\$&")}%`);

  const [{ data: auth }, { data: history }, { data: similar }] = await Promise.all([
    supabase.auth.getUser(),
    deal.source === "community"
      ? Promise.resolve({ data: [] })
      : supabase
          .from("price_history")
          .select("recorded_on, price")
          .eq("source", deal.source)
          .eq("external_id", deal.external_id)
          .order("recorded_on", { ascending: true })
          .limit(365),
    keywords.length ? similarQuery : Promise.resolve({ data: [] }),
  ]);

  const user = auth.user;
  const wishlistKeys = await getWishlistKeys(supabase, user?.id);
  const points: PricePoint[] = ((history ?? []) as { recorded_on: string; price: number }[]).map((h) => ({
    date: h.recorded_on,
    price: Number(h.price),
  }));

  // Même jeu ou édition proche seulement (évite « Jedi Knight » pour « Jedi Bundle »).
  const others = ((similar ?? []) as Deal[]).filter((o) => titleSimilarity(deal.title, o.title) >= 0.6).slice(0, 10);
  const offers = [deal, ...others].sort((a, b) => a.sale_price - b.sale_price);
  // « Meilleur prix » seulement parmi les offres du même jeu (forte ressemblance), en euros.
  const cheapestEur = offers.find(
    (o) => o.currency === "EUR" && (o.id === deal.id || titleSimilarity(deal.title, o.title) >= 0.75),
  );

  const sale = formatPrice(deal.sale_price, deal.currency);
  const eurRate = deal.currency === "USD" ? await getUsdToEur() : null;
  const approxEur = eurRate && deal.sale_price > 0 ? formatPrice(deal.sale_price * eurRate, "EUR") : null;
  const normal =
    deal.normal_price && deal.normal_price > deal.sale_price ? formatPrice(deal.normal_price, deal.currency) : null;
  const saving = deal.normal_price && deal.normal_price > deal.sale_price ? deal.normal_price - deal.sale_price : 0;
  const endsAt = formatEnd(deal.ends_at);
  const lowest = points.length ? Math.min(...points.map((p) => p.price)) : null;
  const stable = points.length >= 2 && points.every((p) => p.price === points[0].price);
  const kind = deal.external_id.startsWith("bundle_") ? "Bundle" : deal.external_id.startsWith("sub_") ? "Pack" : null;

  return (
    <div className="space-y-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-white">
          Promos
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/?platform=${deal.platform}`} className="hover:text-white">
          {PLATFORM_LABELS[deal.platform]}
        </Link>
        <span aria-hidden>›</span>
        <span className="max-w-[60vw] truncate text-slate-300">{deal.title}</span>
      </nav>

      {/* Mobile : image → prix → historique → comparateur. Ordinateur : 2 colonnes, prix collant à droite. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-8">
        <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="card relative aspect-[460/215] overflow-hidden">
            <GameImage src={deal.image_url} loading="eager" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="order-3 min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
          <section className="card p-4 sm:p-6" aria-labelledby="history-title">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="history-title" className="text-lg font-bold">
                Historique du prix
              </h2>
              {points.length > 0 && (
                <p className="text-xs text-muted">
                  {stable
                    ? `Prix stable sur ${points.length} relevés`
                    : `${points.length} relevé${points.length > 1 ? "s" : ""}`}{" "}
                  · plus bas observé{" "}
                  <span className="font-semibold text-slate-200">{formatPrice(lowest, deal.currency)}</span>
                </p>
              )}
            </div>
            <div className="mt-4">
              {points.length >= 2 ? (
                <PriceHistoryChart points={points} currency={deal.currency} />
              ) : (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
                  {deal.source === "community"
                    ? "Promo proposée par la communauté : pas de suivi automatique du prix."
                    : "Le suivi vient de commencer : le graphique apparaîtra dès le prochain relevé quotidien."}
                </p>
              )}
            </div>
          </section>

          {others.length > 0 && (
            <section className="card overflow-hidden" aria-labelledby="compare-title">
              <div className="border-b border-border p-4 sm:px-6">
                <h2 id="compare-title" className="text-lg font-bold">
                  Où l&apos;acheter moins cher
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Le même jeu, ses éditions et les jeux proches, sur toutes les boutiques suivies.
                </p>
              </div>
              <ul className="divide-y divide-border">
                {offers.map((o) => {
                  const isCurrent = o.id === deal.id;
                  const isBest = o.id === cheapestEur?.id;
                  return (
                    <li key={o.id} className={isCurrent ? "bg-accent/5" : ""}>
                      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/jeu/${o.id}`}
                            className={`block truncate text-sm font-semibold hover:text-accent ${isCurrent ? "text-accent" : "text-white"}`}
                          >
                            {o.title}
                          </Link>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                            {PLATFORM_LABELS[o.platform]} · {o.store}
                            {isCurrent && (
                              <span className="rounded bg-accent/15 px-1.5 text-[10px] font-semibold text-accent">
                                Cette offre
                              </span>
                            )}
                            {isBest && (
                              <span className="rounded bg-deal/15 px-1.5 text-[10px] font-semibold text-deal">
                                Meilleur prix
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-white tabular-nums">
                            {formatPrice(o.sale_price, o.currency)}
                          </p>
                          {o.discount > 0 && <p className="text-[11px] text-deal">-{o.discount}%</p>}
                        </div>
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          aria-label={`Voir ${o.title} sur ${o.store}`}
                          className="btn-ghost h-9 shrink-0 px-3 text-xs"
                        >
                          <span className="hidden sm:inline">Voir</span> ↗
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="order-2 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="card space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-slate-300">
                {PLATFORM_LABELS[deal.platform]}
              </span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-muted">{deal.store}</span>
              {kind && (
                <span
                  className={`rounded px-1.5 py-0.5 font-semibold ${kind === "Bundle" ? "bg-amber-400/15 text-amber-300" : "bg-sky-400/15 text-sky-300"}`}
                >
                  {kind}
                </span>
              )}
              {deal.is_lowest && deal.sale_price > 0 && (
                <span className="rounded bg-amber-400 px-1.5 py-0.5 font-bold text-black">Plus bas prix</span>
              )}
            </div>

            <h1 className="text-2xl leading-tight font-black tracking-tight text-balance sm:text-3xl">{deal.title}</h1>

            <div>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-deal tabular-nums">{sale}</p>
                {deal.discount > 0 && (
                  <span className="mb-1.5 rounded-md bg-deal px-2 py-0.5 text-sm font-black text-black">
                    -{deal.discount}%
                  </span>
                )}
              </div>
              {approxEur && (
                <p className="mt-1 text-sm text-muted">
                  Soit environ <span className="font-semibold text-slate-200">{approxEur}</span> (taux BCE du jour)
                </p>
              )}
              {normal && (
                <p className="mt-1 text-sm text-muted">
                  Au lieu de <span className="line-through">{normal}</span>
                  {saving > 0 && (
                    <>
                      {" "}
                      · tu économises{" "}
                      <span className="font-semibold text-slate-200">{formatPrice(saving, deal.currency)}</span>
                    </>
                  )}
                </p>
              )}
              {endsAt && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  <span className="first-letter:uppercase">Jusqu&apos;au {endsAt}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-primary w-full py-3 text-base"
              >
                Voir sur {deal.store} ↗
              </a>
              <WishlistButton
                title={deal.title}
                platform={deal.platform}
                initial={wishlistKeys.has(wishlistKey(deal.title, deal.platform))}
                loggedIn={Boolean(user)}
                variant="full"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <NoTransactionNotice compact />
            </div>
            <ShareButton title={deal.title} />
          </div>
        </aside>
      </div>
    </div>
  );
}
