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

  const title = String(formData.get("title") ?? "")
    .trim()
    .slice(0, 120);
  const platform = formData.get("platform");
  const rawTarget = String(formData.get("target_price") ?? "")
    .trim()
    .replace(",", ".");
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

  revalidatePath("/", "layout"); // rafraîchit aussi le compteur wishlist de l'en-tête
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

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (c) => `\\${c}`);
}

export type ToggleResult = { inWishlist: boolean; error?: string };

/** Cœur des cartes et de la fiche jeu : ajoute le jeu à la wishlist, ou l'en retire s'il y est déjà. */
export async function toggleWishlist(title: string, platform: string): Promise<ToggleResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { inWishlist: false, error: "login" };

  const cleanTitle = title.trim().slice(0, 120);
  const cleanPlatform = isPlatform(platform) ? platform : null;

  let existing = supabase.from("wishlist").select("id").ilike("title", escapeLike(cleanTitle)).limit(1);
  existing = cleanPlatform ? existing.eq("platform", cleanPlatform) : existing.is("platform", null);
  const { data: found } = await existing.maybeSingle();

  if (found) {
    const { error } = await supabase.from("wishlist").delete().eq("id", found.id);
    if (error) return { inWishlist: true, error: error.message };
    revalidatePath("/", "layout"); // rafraîchit aussi le compteur wishlist de l'en-tête
    return { inWishlist: false };
  }

  const { error } = await supabase.from("wishlist").insert({
    user_id: auth.user.id,
    title: cleanTitle,
    platform: cleanPlatform,
    notify: true,
  });
  if (error && error.code !== "23505") return { inWishlist: false, error: error.message };
  revalidatePath("/", "layout"); // rafraîchit aussi le compteur wishlist de l'en-tête
  return { inWishlist: true };
}

export async function toggleWishlistNotify(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const notify = formData.get("notify") === "true";
  const supabase = await createClient();
  await supabase.from("wishlist").update({ notify }).eq("id", id);
  revalidatePath("/", "layout"); // rafraîchit aussi le compteur wishlist de l'en-tête
}

export async function removeFromWishlist(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("wishlist").delete().eq("id", id);
  revalidatePath("/", "layout"); // rafraîchit aussi le compteur wishlist de l'en-tête
}

export async function updateTargetPrice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("target_price") ?? "")
    .trim()
    .replace(",", ".");
  const target = raw === "" ? null : Number(raw);
  if (target !== null && (!Number.isFinite(target) || target < 0)) return;
  const supabase = await createClient();
  await supabase.from("wishlist").update({ target_price: target }).eq("id", id);
  revalidatePath("/", "layout"); // rafraîchit aussi le compteur wishlist de l'en-tête
}
