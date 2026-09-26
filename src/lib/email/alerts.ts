import "server-only";
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Deal } from "@/lib/types";
import { dealAlertEmail, type AlertItem } from "./templates";

const MAX_DEALS_PER_EMAIL = 20;
const BATCH_SIZE = 100; // limite de l'API batch de Resend

type PendingAlert = {
  wishlist_id: string;
  user_id: string;
  email: string;
  username: string;
  wish_title: string;
  deal: Deal;
};

type Recipient = { email: string; username: string; items: AlertItem[]; logRows: { wishlist_id: string; deal_id: string }[] };

/** Envoie un email par utilisateur listant les nouvelles promos de sa wishlist (clé Resend « Promo Tracker »). */
export async function sendWishlistAlerts(supabase: SupabaseClient): Promise<number | string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "RESEND_API_KEY manquante : alertes désactivées";

  const { data, error } = await supabase.rpc("pending_wishlist_alerts");
  if (error) throw new Error(error.message);

  const recipients = new Map<string, Recipient>();
  for (const row of (data ?? []) as PendingAlert[]) {
    const r = recipients.get(row.user_id) ?? { email: row.email, username: row.username, items: [], logRows: [] };
    // Une même promo peut correspondre à plusieurs entrées de la wishlist : on ne l'affiche qu'une fois.
    if (!r.items.some((i) => i.deal.id === row.deal.id) && r.items.length < MAX_DEALS_PER_EMAIL) {
      r.items.push({ wishTitle: row.wish_title, deal: row.deal });
    }
    r.logRows.push({ wishlist_id: row.wishlist_id, deal_id: row.deal.id });
    recipients.set(row.user_id, r);
  }
  if (recipients.size === 0) return 0;

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "Promo Tracker <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const all = [...recipients.values()];
  let sent = 0;

  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const chunk = all.slice(i, i + BATCH_SIZE);
    const { error: sendError } = await resend.batch.send(
      chunk.map((r) => ({ from, to: r.email, ...dealAlertEmail(r.username, r.items, siteUrl) })),
    );
    if (sendError) throw new Error(`Resend : ${sendError.message}`);

    const { error: logError } = await supabase
      .from("alert_log")
      .upsert(chunk.flatMap((r) => r.logRows), { onConflict: "wishlist_id,deal_id", ignoreDuplicates: true });
    if (logError) throw new Error(logError.message);

    sent += chunk.length;
  }

  return sent;
}
