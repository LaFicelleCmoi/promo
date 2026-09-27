import type { DealInput } from "@/lib/types";

// Promos de l'eShop Nintendo (Europe / France).
const API = "https://searching.nintendo-europe.com/fr/select";
const MAX_ROWS = 500;

type NintendoDoc = {
  fs_id: string;
  title: string;
  url: string;
  image_url?: string;
  image_url_h2x1_s?: string;
  image_url_sq_s?: string;
  wishlist_email_banner460w_image_url_s?: string;
  price_regular_f?: number;
  price_discounted_f?: number;
  price_discount_percentage_f?: number;
};

export async function fetchNintendoDeals(): Promise<DealInput[]> {
  const params = new URLSearchParams({
    q: "*",
    fq: "type:GAME AND price_has_discount_b:true",
    sort: "popularity asc",
    rows: String(MAX_ROWS),
    wt: "json",
    fl: "fs_id,title,url,image_url,image_url_h2x1_s,image_url_sq_s,wishlist_email_banner460w_image_url_s,price_regular_f,price_discounted_f,price_discount_percentage_f",
  });

  const res = await fetch(`${API}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Nintendo → HTTP ${res.status}`);
  const json = await res.json();
  const docs: NintendoDoc[] = json?.response?.docs ?? [];

  return docs
    .filter((d) => typeof d.price_discounted_f === "number")
    .map((d) => ({
      source: "nintendo",
      external_id: d.fs_id,
      title: d.title,
      platform: "switch",
      store: "Nintendo eShop",
      url: `https://www.nintendo.com${d.url}`,
      // Bannière 460 px au format 2:1 (celui des cartes), disponible pour tous les jeux.
      image_url: d.wishlist_email_banner460w_image_url_s ?? d.image_url_h2x1_s ?? d.image_url ?? d.image_url_sq_s ?? null,
      normal_price: d.price_regular_f ?? null,
      sale_price: d.price_discounted_f!,
      discount: Math.round(d.price_discount_percentage_f ?? 0),
      currency: "EUR",
      ends_at: null,
    }));
}
