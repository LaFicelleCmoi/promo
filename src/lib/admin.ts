import "server-only";
import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Rôle stocké dans app_metadata : modifiable uniquement côté serveur, jamais par l'utilisateur lui-même. */
export function isAdmin(user: Pick<User, "app_metadata"> | null | undefined) {
  return user?.app_metadata?.role === "admin";
}

/**
 * Garde des pages et des actions du panel : un non-admin reçoit une 404, le panel n'apparaît jamais.
 * À appeler dans chaque page ET chaque Server Action (un layout ne protège pas les actions).
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !isAdmin(data.user)) notFound();
  return data.user;
}

/** Tous les comptes (pagination de l'API d'administration de Supabase). */
export async function listAllUsers() {
  const admin = createAdminClient();
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

export const pushDevices = (u: Pick<User, "app_metadata">) =>
  Array.isArray(u.app_metadata?.push_subscriptions) ? u.app_metadata.push_subscriptions.length : 0;

export const isBanned = (u: Pick<User, "banned_until">) =>
  Boolean(u.banned_until && new Date(u.banned_until).getTime() > Date.now());

/** Nombre de promos en base pour chaque source affichée dans le panel (mobile et communauté séparés). */
export async function countDealsBySource() {
  const admin = createAdminClient();
  const head = () => admin.from("deals").select("id", { count: "exact", head: true });
  const sources = ["steam", "playstation", "xbox", "nintendo", "epic", "gog", "cheapshark"] as const;
  const [main, mobile, community] = await Promise.all([
    Promise.all(sources.map((s) => head().eq("source", s))),
    head().eq("source", "community").or("external_id.like.android:*,external_id.like.ios:*"),
    head().eq("source", "community").not("external_id", "like", "android:%").not("external_id", "like", "ios:%"),
  ]);
  return {
    ...Object.fromEntries(sources.map((s, i) => [s, main[i].count ?? 0])),
    mobile: mobile.count ?? 0,
    community: community.count ?? 0,
  } as Record<(typeof sources)[number] | "mobile" | "community", number>;
}
