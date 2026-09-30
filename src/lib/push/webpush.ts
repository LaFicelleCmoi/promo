import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PushSubscriptionData = { endpoint: string; keys: { p256dh: string; auth: string } };
export type PushPayload = { title: string; body: string; url?: string; image?: string | null; tag?: string };

const MAX_DEVICES = 10;

let configured = false;
function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "https://promo-rouge.vercel.app", publicKey, privateKey);
    configured = true;
  }
  return true;
}

export function isPushConfigured() {
  return configure();
}

/** Abonnements (un par appareil) rangés dans les métadonnées du compte, modifiables uniquement côté serveur. */
export async function getSubscriptions(admin: SupabaseClient, userId: string): Promise<PushSubscriptionData[]> {
  const { data } = await admin.auth.admin.getUserById(userId);
  const subs = data.user?.app_metadata?.push_subscriptions;
  return Array.isArray(subs) ? (subs as PushSubscriptionData[]) : [];
}

export async function setSubscriptions(admin: SupabaseClient, userId: string, subs: PushSubscriptionData[]) {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { push_subscriptions: subs.slice(-MAX_DEVICES) },
  });
  if (error) throw new Error(error.message);
}

/**
 * Envoie une notification à tous les appareils d'un utilisateur.
 * Les abonnements expirés (appareil désinstallé, permission retirée) sont supprimés au passage.
 */
export async function sendToUser(admin: SupabaseClient, userId: string, payload: PushPayload) {
  if (!configure()) throw new Error("Clés VAPID manquantes");
  const subs = await getSubscriptions(admin, userId);
  if (subs.length === 0) return { sent: 0, devices: 0 };

  const alive: PushSubscriptionData[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
        sent++;
        alive.push(sub);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status !== 404 && status !== 410) alive.push(sub); // erreur passagère : on garde l'abonnement
      }
    }),
  );
  if (alive.length !== subs.length) await setSubscriptions(admin, userId, alive);
  return { sent, devices: subs.length };
}
