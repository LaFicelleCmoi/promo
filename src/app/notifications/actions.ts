"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptions, sendToUser, setSubscriptions, type PushSubscriptionData } from "@/lib/push/webpush";

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function isValid(sub: unknown): sub is PushSubscriptionData {
  const s = sub as PushSubscriptionData;
  return (
    typeof s?.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string"
  );
}

/** Enregistre l'appareil courant pour recevoir les notifications. */
export async function savePushSubscription(sub: unknown): Promise<{ ok: boolean; error?: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "login" };
  if (!isValid(sub)) return { ok: false, error: "Abonnement invalide" };

  const admin = createAdminClient();
  const clean = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
  const subs = (await getSubscriptions(admin, userId)).filter((s) => s.endpoint !== clean.endpoint);
  await setSubscriptions(admin, userId, [...subs, clean]);
  return { ok: true };
}

/** Désabonne l'appareil courant. */
export async function removePushSubscription(endpoint: string) {
  const userId = await currentUserId();
  if (!userId) return;
  const admin = createAdminClient();
  const subs = await getSubscriptions(admin, userId);
  await setSubscriptions(
    admin,
    userId,
    subs.filter((s) => s.endpoint !== endpoint),
  );
}

/** Notification de test sur tous les appareils de l'utilisateur. */
export async function sendTestNotification(): Promise<{ ok: boolean; sent: number }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, sent: 0 };
  const { sent } = await sendToUser(createAdminClient(), userId, {
    title: "🔔 Notifications activées",
    body: "Tu seras prévenu ici dès qu'un jeu de ta wishlist passe en promo.",
    url: "/wishlist",
    tag: "test",
  });
  return { ok: sent > 0, sent };
}
