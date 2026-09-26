"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isPlatform } from "@/lib/types";

export type WishlistFormState = { error?: string; ok?: boolean } | undefined;

async function insertItem(formData: FormData): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/wishlist");

  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const platform = formData.get("platform");
  const rawTarget = String(formData.get("target_price") ?? "").trim().replace(",", ".");
  const target = rawTarget === "" ? null : Number(rawTarget);

  if (title.length < 2) return "Le titre doit faire au moins 2 caractères.";
  if (target !== null && (!Number.isFinite(target) || target < 0)) return "Prix cible invalide.";

  const { error } = await supabase.from("wishlist").insert({
    user_id: auth.user.id,
    title,
    platform: isPlatform(platform) ? platform : null,
    target_price: target,
    notify: formData.get("notify") !== null,
  });

  if (error?.code === "23505") return "Ce jeu est déjà dans ta wishlist.";
  if (error) return error.message;

  revalidatePath("/wishlist");
  return null;
}

/** Formulaire de la page wishlist. */
export async function createWishlistItem(_prev: WishlistFormState, formData: FormData): Promise<WishlistFormState> {
  const error = await insertItem(formData);
  return error ? { error } : { ok: true };
}

/** Bouton « Ajouter à ma wishlist » sur une carte promo. */
export async function addToWishlist(formData: FormData) {
  await insertItem(formData);
}

export async function toggleWishlistNotify(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const notify = formData.get("notify") === "true";
  const supabase = await createClient();
  await supabase.from("wishlist").update({ notify }).eq("id", id);
  revalidatePath("/wishlist");
}

export async function removeFromWishlist(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("wishlist").delete().eq("id", id);
  revalidatePath("/wishlist");
}
