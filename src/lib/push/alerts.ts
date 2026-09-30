import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrice } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { isPushConfigured, sendToUser, type PushPayload } from "./webpush";

type PendingAlert = { wishlist_id: string; user_id: string; wish_title: string; deal: Deal };

function payloadFor(deals: Deal[]): PushPayload {
  if (deals.length === 1) {
    const d = deals[0];
    const price = formatPrice(d.sale_price, d.currency);
    return {
      title: `🎮 ${d.title} est en promo`,
      body: `${price}${d.discount > 0 ? ` (-${d.discount} %)` : ""} sur ${d.store}. Aucun achat sur Promo Tracker : l'offre est sur la boutique officielle.`,
      url: `/jeu/${d.id}`,
      image: d.image_url,
      tag: `deal-${d.id}`,
    };
  }
  const names = deals.slice(0, 3).map((d) => d.title);
  return {
    title: `🎮 ${deals.length} jeux de ta wishlist sont en promo`,
    body: names.join(" · ") + (deals.length > 3 ? ` et ${deals.length - 3} autre${deals.length > 4 ? "s" : ""}` : ""),
    url: "/wishlist",
    image: deals[0].image_url,
    tag: "wishlist",
  };
}

/**
 * Notifications système des promos de la wishlist (remplace les alertes email) :
 * une notification par utilisateur, uniquement pour les promos pas encore signalées.
 */
export async function sendWishlistNotifications(admin: SupabaseClient) {
  if (!isPushConfigured()) return "Clés VAPID manquantes : notifications désactivées";

  const { data, error } = await admin.rpc("pending_wishlist_alerts");
  if (error) throw new Error(error.message);

  const byUser = new Map<string, { deals: Deal[]; logRows: { wishlist_id: string; deal_id: string }[] }>();
  for (const row of (data ?? []) as PendingAlert[]) {
    const entry = byUser.get(row.user_id) ?? { deals: [], logRows: [] };
    if (!entry.deals.some((d) => d.id === row.deal.id)) entry.deals.push(row.deal);
    entry.logRows.push({ wishlist_id: row.wishlist_id, deal_id: row.deal.id });
    byUser.set(row.user_id, entry);
  }

  let notified = 0;
  for (const [userId, { deals, logRows }] of byUser) {
    const { sent, devices } = await sendToUser(admin, userId, payloadFor(deals));
    // Promo marquée « signalée » seulement si une notification est vraiment partie :
    // sans appareil abonné ou si l'envoi a échoué, elle sera retentée à la prochaine synchro.
    if (devices === 0 || sent === 0) continue;
    notified++;
    await admin.from("alert_log").upsert(logRows, { onConflict: "wishlist_id,deal_id", ignoreDuplicates: true });
  }
  return notified;
}
