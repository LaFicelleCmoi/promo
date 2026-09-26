import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DealCard } from "@/components/DealCard";
import { WishlistForm } from "@/components/WishlistForm";
import { removeFromWishlist, toggleWishlistNotify } from "./actions";
import { PLATFORM_LABELS, type Deal, type WishlistItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Ma wishlist — Promo Tracker" };

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/wishlist");

  const [{ data: items }, { data: matches }] = await Promise.all([
    supabase.from("wishlist").select("*").order("created_at", { ascending: false }),
    supabase.rpc("wishlist_matches"),
  ]);

  const wishlist = (items ?? []) as WishlistItem[];
  const dealsByItem = new Map<string, Deal[]>();
  for (const m of (matches ?? []) as { wishlist_id: string; deal: Deal }[]) {
    dealsByItem.set(m.wishlist_id, [...(dealsByItem.get(m.wishlist_id) ?? []), m.deal]);
  }
  const onSale = wishlist.filter((w) => dealsByItem.has(w.id)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ma wishlist</h1>
        <p className="mt-1 text-sm text-muted">
          Ajoute les jeux que tu attends : dès qu&apos;une promo correspond (et passe sous ton prix cible), elle
          apparaît ici et tu reçois un email.
          {wishlist.length > 0 && (
            <>
              {" "}
              <span className="font-semibold text-deal">
                {onSale} / {wishlist.length}
              </span>{" "}
              en promo en ce moment.
            </>
          )}
        </p>
      </div>

      <WishlistForm />

      {wishlist.length === 0 ? (
        <div className="card p-10 text-center text-muted">Ta wishlist est vide pour l&apos;instant.</div>
      ) : (
        <div className="space-y-6">
          {wishlist.map((item) => {
            const deals = dealsByItem.get(item.id) ?? [];
            return (
              <section key={item.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{item.title}</h2>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                      {item.platform ? PLATFORM_LABELS[item.platform] : "Toutes plateformes"}
                    </span>
                    {item.target_price !== null && (
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                        ≤ {formatPrice(item.target_price, "EUR")}
                      </span>
                    )}
                    {deals.length > 0 ? (
                      <span className="rounded bg-deal/15 px-1.5 py-0.5 text-[11px] font-semibold text-deal">
                        {deals.length} promo{deals.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">Pas de promo pour le moment</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <form action={toggleWishlistNotify}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="notify" value={String(!item.notify)} />
                      <button className={`text-xs ${item.notify ? "text-accent" : "text-muted"} hover:text-white`}>
                        {item.notify ? "🔔 Alerte email active" : "🔕 Alerte email désactivée"}
                      </button>
                    </form>
                    <form action={removeFromWishlist}>
                      <input type="hidden" name="id" value={item.id} />
                      <button className="text-xs text-muted hover:text-danger">Retirer</button>
                    </form>
                  </div>
                </div>

                {deals.length > 0 && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {deals.slice(0, 8).map((deal) => (
                      <DealCard key={deal.id} deal={deal} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
