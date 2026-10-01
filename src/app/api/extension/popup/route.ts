import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseProfile } from "@/lib/profile";
import { storeTheme } from "@/lib/stores";
import { NO_STORE } from "@/lib/extension";
import type { Deal } from "@/lib/types";

export const dynamic = "force-dynamic";

const pick = (d: Deal, site: string) => ({
  id: d.id,
  title: d.title,
  store: d.store,
  color: storeTheme(d.store).color,
  price: Number(d.sale_price),
  normal: d.normal_price === null ? null : Number(d.normal_price),
  discount: d.discount,
  currency: d.currency,
  image: d.image_url,
  url: `${site}/jeu/${d.id}`,
});

/** Extension Chrome : contenu du menu de l'extension (compte, wishlist en promo, promos du moment). */
export async function GET(request: NextRequest) {
  const site = request.nextUrl.origin;
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: auth }, { data: topRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("deals")
      .select("*")
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .gt("sale_price", 0)
      .gte("normal_price", 20)
      .not("image_url", "is", null)
      .order("discount", { ascending: false })
      .limit(60),
  ]);

  // Promos du moment : les plus grosses réductions, au plus 2 par boutique pour varier.
  const perStore = new Map<string, number>();
  const top = ((topRows ?? []) as Deal[])
    .filter((d) => {
      const key = storeTheme(d.store).key;
      const n = perStore.get(key) ?? 0;
      perStore.set(key, n + 1);
      return n < 2;
    })
    .slice(0, 8)
    .map((d) => pick(d, site));

  const user = auth.user;
  let account = null;
  if (user) {
    const [{ count }, { data: matches }] = await Promise.all([
      supabase.from("wishlist").select("id", { count: "exact", head: true }),
      supabase.rpc("wishlist_matches"),
    ]);
    const seen = new Set<string>();
    const wishlistDeals = ((matches ?? []) as { deal: Deal }[])
      .map((m) => m.deal)
      .filter((d) => !seen.has(d.id) && seen.add(d.id))
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 5)
      .map((d) => pick(d, site));
    account = {
      name: parseProfile(user.user_metadata, user.email?.split("@")[0]).username,
      wishlistCount: count ?? 0,
      wishlistDeals,
    };
  }

  return NextResponse.json({ site, account, top }, { headers: NO_STORE });
}
