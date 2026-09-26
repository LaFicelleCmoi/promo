import type { DealInput } from "@/lib/types";

// Promos Steam (prix en euros, France), via la recherche du magasin.
const API = "https://store.steampowered.com/search/results/";
const PAGES = 5;
const PAGE_SIZE = 100;
const USER_AGENT = "Mozilla/5.0 (compatible; PromoTracker/1.0; +https://github.com/LaFicelleCmoi/promo)";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };

function decode(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z#0-9]+);/gi, (m, name) => ENTITIES[name] ?? m)
    .trim();
}

function parseEuro(value: string | undefined) {
  if (!value) return null;
  const n = Number(value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function fetchPage(start: number): Promise<string> {
  const params = new URLSearchParams({
    query: "",
    start: String(start),
    count: String(PAGE_SIZE),
    specials: "1",
    infinite: "1",
    cc: "fr",
    l: "french",
  });
  const res = await fetch(`${API}?${params}`, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
  if (!res.ok) throw new Error(`Steam → HTTP ${res.status}`);
  const json = await res.json();
  return String(json?.results_html ?? "");
}

export function parseSteamResults(html: string): DealInput[] {
  const rows = html.split(/<a\s+href="/).slice(1);

  return rows.flatMap((row): DealInput[] => {
    const url = row.slice(0, row.indexOf('"')).split("?")[0];
    const appId = row.match(/data-ds-appid="(\d+)"/)?.[1];
    const packageId = row.match(/data-ds-packageid="(\d+)"/)?.[1];
    const bundleId = row.match(/data-ds-bundleid="(\d+)"/)?.[1];
    const title = row.match(/<span class="title">([^<]+)<\/span>/)?.[1];
    const finalCents = row.match(/data-price-final="(\d+)"/)?.[1];
    const discount = Number(row.match(/data-discount="(\d+)"/)?.[1] ?? 0);
    const original = parseEuro(row.match(/discount_original_price">([^<]+)</)?.[1]);
    const capsule = row.match(/<div class="search_capsule"><img src="([^"]+)"/)?.[1];

    const id = appId ? `app_${appId}` : packageId ? `sub_${packageId}` : bundleId ? `bundle_${bundleId}` : null;
    if (!id || !title || !finalCents || discount <= 0 || !url.startsWith("https://")) return [];

    return [
      {
        source: "steam",
        external_id: id,
        title: decode(title),
        platform: "pc",
        store: "Steam",
        url,
        image_url: appId
          ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`
          : (capsule ?? null),
        normal_price: original,
        sale_price: Number(finalCents) / 100,
        discount,
        currency: "EUR",
        ends_at: null,
      },
    ];
  });
}

export async function fetchSteamDeals(): Promise<DealInput[]> {
  const pages = await Promise.all(Array.from({ length: PAGES }, (_, i) => fetchPage(i * PAGE_SIZE)));
  return pages.flatMap(parseSteamResults);
}
