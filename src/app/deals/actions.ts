"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeDiscount } from "@/lib/format";
import { isPlatform } from "@/lib/types";
import { getFreshSettings } from "@/lib/settings";
import { isAdmin } from "@/lib/admin";
import { officialStoreFromUrl } from "@/lib/stores";

export type DealFormState = { error?: string } | undefined;

function parsePrice(value: FormDataEntryValue | null) {
  const raw = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createDeal(_prev: DealFormState, formData: FormData): Promise<DealFormState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/deals/new");
  if (!(await getFreshSettings()).communityDealsOpen && !isAdmin(auth.user)) {
    return { error: "Les propositions de promos sont temporairement fermées." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const platform = formData.get("platform");
  const url = String(formData.get("url") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const salePrice = parsePrice(formData.get("sale_price"));
  const normalPrice = parsePrice(formData.get("normal_price"));
  const endsAt = String(formData.get("ends_at") ?? "").trim();

  if (!title || title.length > 200) return { error: "Titre requis (200 caractères max)." };
  if (!isPlatform(platform)) return { error: "Plateforme invalide." };
  if (!isHttpUrl(url)) return { error: "Lien de la promo invalide." };
  // La boutique vient du lien : seules les boutiques officielles suivies par le site sont acceptées.
  const store = officialStoreFromUrl(url)?.store;
  if (!store)
    return {
      error:
        "Seules les promos des boutiques officielles sont acceptées (Steam, PlayStation, Xbox, Nintendo, Epic, GOG, Ubisoft, Google Play, App Store).",
    };
  if (imageUrl && !isHttpUrl(imageUrl)) return { error: "Lien de l'image invalide." };
  if (salePrice === null || Number.isNaN(salePrice)) return { error: "Prix promo invalide." };
  if (Number.isNaN(normalPrice)) return { error: "Prix normal invalide." };
  if (normalPrice !== null && salePrice > normalPrice) return { error: "Le prix promo dépasse le prix normal." };

  const { error } = await supabase.from("deals").insert({
    source: "community",
    title,
    platform,
    store,
    url,
    image_url: imageUrl || null,
    normal_price: normalPrice,
    sale_price: salePrice,
    discount: computeDiscount(normalPrice, salePrice),
    currency: "EUR",
    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    created_by: auth.user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/?sort=recent");
}

export async function deleteDeal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  // RLS garantit qu'on ne supprime que ses propres promos communautaires.
  await supabase.from("deals").delete().eq("id", id);
  revalidatePath("/");
}
