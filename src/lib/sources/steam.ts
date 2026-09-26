import type { DealInput } from "@/lib/types";

// Promos Steam (prix en euros, France) :
// 1. la recherche du magasin donne les jeux et packs en promo ;
// 2. l'API IStoreBrowseService/GetItems complète avec les bundles qui les contiennent et les dates de fin de promo.
const API = "https://store.steampowered.com/search/results/";
const STORE_API = "https://api.steampowered.com/IStoreBrowseService/GetItems/v1/";
const STORE_BATCH = 100;
// Beaucoup de bundles sont « en promo » juste parce qu'un jeu inclus l'est : on garde les vraies bonnes affaires.
const BUNDLE_MIN_DISCOUNT = 50;
const MAX_BUNDLES = 400;
const CDN = "https://shared.akamai.steamstatic.com/store_item_assets/";
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
  const n = Number(
    value
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );
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

type PurchaseOption = {
  packageid?: number;
  bundleid?: number;
  purchase_option_name: string;
  final_price_in_cents: string;
  original_price_in_cents?: string;
  discount_pct?: number;
  active_discounts?: { discount_end_date?: number }[];
};

type StoreItem = {
  appid?: number;
  id?: number;
  name?: string;
  store_url_path?: string;
  purchase_options?: PurchaseOption[];
  assets?: { asset_url_format?: string; package_header?: string; header?: string; main_capsule?: string };
};

async function getItems(ids: Record<string, number>[], dataRequest: Record<string, boolean>): Promise<StoreItem[]> {
  const results = await Promise.all(
    Array.from({ length: Math.ceil(ids.length / STORE_BATCH) }, async (_, i) => {
      const input = {
        ids: ids.slice(i * STORE_BATCH, (i + 1) * STORE_BATCH),
        context: { language: "french", country_code: "FR", steam_realm: 1 },
        data_request: dataRequest,
      };
      const res = await fetch(`${STORE_API}?input_json=${encodeURIComponent(JSON.stringify(input))}`, {
        headers: { "User-Agent": USER_AGENT },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Steam GetItems → HTTP ${res.status}`);
      const json = await res.json();
      return (json?.response?.store_items ?? []) as StoreItem[];
    }),
  );
  return results.flat();
}

function endDateOf(option: PurchaseOption) {
  const ends = (option.active_discounts ?? []).map((d) => d.discount_end_date ?? 0).filter((t) => t > 0);
  return ends.length ? new Date(Math.min(...ends) * 1000).toISOString() : null;
}

/** Ajoute les dates de fin aux jeux et récupère les bundles en promo qui les contiennent. */
async function enrichWithStore(deals: DealInput[]): Promise<DealInput[]> {
  const appIds = deals.flatMap((d) => (d.external_id.startsWith("app_") ? [Number(d.external_id.slice(4))] : []));
  const items = await getItems(
    appIds.map((appid) => ({ appid })),
    { include_all_purchase_options: true },
  );

  const endDates = new Map<string, string>();
  const bundles = new Map<number, PurchaseOption>();

  for (const item of items) {
    const options = item.purchase_options ?? [];
    const deal = deals.find((d) => d.external_id === `app_${item.appid}`);
    const main = deal && options.find((o) => o.packageid && Number(o.final_price_in_cents) / 100 === deal.sale_price);
    const end = main ? endDateOf(main) : null;
    if (deal && end) endDates.set(deal.external_id, end);

    for (const option of options) {
      if (option.bundleid && (option.discount_pct ?? 0) >= BUNDLE_MIN_DISCOUNT) bundles.set(option.bundleid, option);
    }
  }

  const bundleItems = await getItems(
    [...bundles.keys()].map((bundleid) => ({ bundleid })),
    { include_assets: true },
  );
  const bundleInfo = new Map(bundleItems.map((b) => [b.id, b]));

  const bestBundles = [...bundles.entries()]
    .sort(([, a], [, b]) => (b.discount_pct ?? 0) - (a.discount_pct ?? 0))
    .slice(0, MAX_BUNDLES);

  const bundleDeals = bestBundles.flatMap(([id, option]): DealInput[] => {
    const info = bundleInfo.get(id);
    const sale = Number(option.final_price_in_cents) / 100;
    const normal = option.original_price_in_cents ? Number(option.original_price_in_cents) / 100 : null;
    const format = info?.assets?.asset_url_format;
    const file = info?.assets?.package_header ?? info?.assets?.header ?? info?.assets?.main_capsule;
    if (!format || !file) return [];

    return [
      {
        source: "steam",
        external_id: `bundle_${id}`,
        title: decode(info?.name ?? option.purchase_option_name),
        platform: "pc",
        store: "Steam",
        url: `https://store.steampowered.com/${info?.store_url_path ?? `bundle/${id}`}/`,
        image_url: CDN + format.replace("${FILENAME}", file),
        normal_price: normal,
        sale_price: sale,
        discount: option.discount_pct ?? 0,
        currency: "EUR",
        ends_at: endDateOf(option),
      },
    ];
  });

  return [...deals.map((d) => ({ ...d, ends_at: endDates.get(d.external_id) ?? d.ends_at })), ...bundleDeals];
}

export async function fetchSteamDeals(): Promise<DealInput[]> {
  const pages = await Promise.all(Array.from({ length: PAGES }, (_, i) => fetchPage(i * PAGE_SIZE)));
  const deals = pages.flatMap(parseSteamResults);

  try {
    return await enrichWithStore(deals);
  } catch (err) {
    // Les promos de base restent utilisables même si l'API du store ne répond pas.
    console.error("Steam : enrichissement bundles/dates impossible", err);
    return deals;
  }
}
