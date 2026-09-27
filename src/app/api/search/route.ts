import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
};

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
  const hits = ((data ?? []) as SearchHit[]).sort((a, b) => score(a) - score(b)).slice(0, 8);

  return NextResponse.json({ hits }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
