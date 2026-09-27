import type { SupabaseClient } from "@supabase/supabase-js";

export const wishlistKey = (title: string, platform: string | null) =>
  `${title.trim().toLowerCase()}|${platform ?? ""}`;

/** Clés (titre + plateforme) des jeux suivis par l'utilisateur connecté, pour allumer les cœurs. */
export async function getWishlistKeys(supabase: SupabaseClient, userId?: string | null) {
  if (!userId) return new Set<string>();
  const { data } = await supabase.from("wishlist").select("title, platform").eq("user_id", userId);
  return new Set((data ?? []).map((w) => wishlistKey(w.title, w.platform)));
}
