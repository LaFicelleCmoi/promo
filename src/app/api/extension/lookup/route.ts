import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsdToEur } from "@/lib/fx";
import { storeTheme } from "@/lib/stores";
import { titleKeywords, titleSimilarity } from "@/lib/titles";
import { parseProfile } from "@/lib/profile";
import { EXTENSION_STORES, NO_STORE, cleanTitle, escapeLike } from "@/lib/extension";
import type { Deal } from "@/lib/types";

export const dynamic = "force-dynamic";

export type ExtensionOffer = {
  id: string;
  title: string;
  store: string;
  storeKey: string;
  color: string;
  platform: string;
  price: number;
  normal: number | null;
  discount: number;
  currency: string;
  /** Prix converti en euros (comparaison entre boutiques), null si la devise est inconnue. */
  eur: number | null;
  lowestEur: number | null;
  isLowest: boolean;
  endsAt: string | null;
  url: string;
  current: boolean;
  samePlatform: boolean;
};

/**
 * Extension Chrome : promos suivies pour le jeu affiché sur une boutique.
 * GET /api/extension/lookup?title=ELDEN%20RING&store=steam
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = cleanTitle(params.get("title") ?? "");
  const storeKey = params.get("store") ?? "";
  const platform = EXTENSION_STORES[storeKey] ?? null;
  if (title.length < 2) return NextResponse.json({ error: "Titre manquant" }, { status: 400, headers: NO_STORE });

  const supabase = await createClient();
  const keywords = titleKeywords(title, 4);
  const words = keywords.length ? keywords : [title.toLowerCase()];

  let query = supabase
    .from("deals")
    .select("*")
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order("sale_price", { ascending: true })
    .limit(80);
  for (const w of words) query = query.ilike("title", `%${escapeLike(w)}%`);

  const [{ data, error }, { data: auth }, usdRate] = await Promise.all([query, supabase.auth.getUser(), getUsdToEur()]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE });

  const toEur = (value: number | null, currency: string) =>
    value === null ? null : currency === "EUR" ? value : currency === "USD" && usdRate ? value * usdRate : null;
  const site = request.nextUrl.origin;

  // Même jeu ou édition très proche (évite « Jedi Knight » pour « Jedi Survivor »).
  const offers: (ExtensionOffer & { similarity: number })[] = ((data ?? []) as Deal[])
    .map((d) => ({ d, similarity: titleSimilarity(title, d.title) }))
    .filter(({ similarity }) => similarity >= 0.6)
    .map(({ d, similarity }) => {
      const theme = storeTheme(d.store);
      return {
        id: d.id,
        title: d.title,
        store: d.store,
        storeKey: theme.key,
        color: theme.color,
        platform: d.platform,
        price: Number(d.sale_price),
        normal: d.normal_price === null ? null : Number(d.normal_price),
        discount: d.discount,
        currency: d.currency,
        eur: toEur(Number(d.sale_price), d.currency),
        lowestEur: toEur(d.lowest_price === null ? null : Number(d.lowest_price), d.currency),
        isLowest: d.is_lowest,
        endsAt: d.ends_at,
        url: `${site}/jeu/${d.id}`,
        current: theme.key === storeKey,
        samePlatform: !platform || d.platform === platform,
        similarity,
      };
    })
    // Même plateforme d'abord, puis le titre le plus proche, puis le prix.
    .sort(
      (a, b) =>
        Number(b.samePlatform) - Number(a.samePlatform) ||
        Number(b.similarity >= 0.75) - Number(a.similarity >= 0.75) ||
        (a.eur ?? Infinity) - (b.eur ?? Infinity),
    )
    .slice(0, 6);

  const comparable = offers.filter((o) => o.samePlatform && o.similarity >= 0.75 && o.eur !== null);
  const best = comparable.reduce<(typeof offers)[number] | null>((m, o) => (!m || o.eur! < m.eur! ? o : m), null);
  const lowestValues = comparable.map((o) => o.lowestEur).filter((v): v is number => v !== null);

  // Le jeu est-il déjà suivi ? (même titre, même plateforme ou toutes plateformes)
  let tracked: boolean | null = null;
  const user = auth.user;
  if (user) {
    const { data: found } = await supabase
      .from("wishlist")
      .select("id, platform")
      .ilike("title", escapeLike(title))
      .limit(5);
    tracked = (found ?? []).some((w) => w.platform === null || w.platform === platform);
  }

  return NextResponse.json(
    {
      query: title,
      platform,
      offers: offers.map(({ similarity: _s, ...o }) => o),
      best: best ? { ...best, similarity: undefined } : null,
      lowestEur: lowestValues.length ? Math.min(...lowestValues) : null,
      tracked,
      user: user ? { name: parseProfile(user.user_metadata, user.email?.split("@")[0]).username } : null,
      searchUrl: `${site}/?q=${encodeURIComponent(title)}#resultats`,
      loginUrl: `${site}/login`,
    },
    { headers: NO_STORE },
  );
}
