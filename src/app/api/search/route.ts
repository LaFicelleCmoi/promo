import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { steamHeaderImages } from "@/lib/steamAssets";

export type SearchHit = {
  id: string;
  title: string;
  store: string;
  platform: string;
  sale_price: number;
  normal_price: number | null;
  discount: number;
  currency: string;
  image_url: string | null;
  /** « catalog » : jeu du catalogue Steam, pas forcément en promo (utilisé par la wishlist). */
  kind?: "deal" | "catalog";
};

type SteamItem = {
  id: number;
  type: string;
  name: string;
  price?: { currency: string; initial: number; final: number };
};

/** Catalogue Steam complet (jeux hors promo compris), pour l'autocomplétion de la wishlist. */
async function catalogHits(q: string): Promise<SearchHit[]> {
  const params = new URLSearchParams({ term: q, l: "french", cc: "FR" });
  const res = await fetch(`https://store.steampowered.com/api/storesearch/?${params}`, {
    next: { revalidate: 86_400 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  const apps = ((json?.items ?? []) as SteamItem[]).filter((i) => i.type === "app").slice(0, 8);
  const images = await steamHeaderImages(apps.map((i) => i.id)).catch(() => new Map<number, string>());
  return apps.map((i) => ({
    id: `steam-${i.id}`,
    title: i.name,
    store: "Steam",
    platform: "pc",
    sale_price: i.price ? i.price.final / 100 : 0,
    normal_price: i.price ? i.price.initial / 100 : null,
    discount: i.price && i.price.initial > 0 ? Math.round((1 - i.price.final / i.price.initial) * 100) : 0,
    currency: i.price?.currency ?? "EUR",
    image_url: images.get(i.id) ?? null,
    kind: "catalog" as const,
  }));
}

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (c) => `\\${c}`);
}

/** Suggestions de la recherche instantanée : 8 promos, les titres qui commencent par la saisie d'abord. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  const words = q.split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length === 0 || q.length < 2) return NextResponse.json({ hits: [] });

  const supabase = await createClient();
  let query = supabase
    .from("deals")
    .select("id, title, store, platform, sale_price, normal_price, discount, currency, image_url")
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order("discount", { ascending: false })
    .limit(40);
  for (const word of words) query = query.ilike("title", `%${escapeLike(word)}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ hits: [], error: error.message }, { status: 500 });

  const needle = q.toLowerCase();
  const score = (h: SearchHit) => {
    const t = h.title.toLowerCase();
    return (t.startsWith(needle) ? 0 : t.includes(needle) ? 1 : 2) * 1000 + t.length;
  };
  let hits: SearchHit[] = ((data ?? []) as SearchHit[])
    .sort((a, b) => score(a) - score(b))
    .slice(0, 8)
    .map((h) => ({ ...h, kind: "deal" as const }));

  if (request.nextUrl.searchParams.get("catalog") === "1" && hits.length < 8) {
    const known = new Set(hits.map((h) => h.title.toLowerCase()));
    const extra = (await catalogHits(q).catch(() => [])).filter((h) => !known.has(h.title.toLowerCase()));
    hits = [...hits, ...extra].slice(0, 8);
  }

  return NextResponse.json({ hits }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
