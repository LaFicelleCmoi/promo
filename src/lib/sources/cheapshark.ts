import type { DealInput } from "@/lib/types";
import { computeDiscount } from "@/lib/format";

// Promos PC multi-boutiques (Steam, GOG, Humble, Fanatical, GMG, Epic, Ubisoft...).
// https://apidocs.cheapshark.com/
const API = "https://www.cheapshark.com/api/1.0";
const USER_AGENT = "PromoTracker/1.0 (+https://github.com/LaFicelleCmoi/promo)";
const PAGES = 5;
const PAGE_SIZE = 60;

type Store = { storeID: string; storeName: string; isActive: number };
type CheapSharkDeal = {
  dealID: string;
  title: string;
  storeID: string;
  salePrice: string;
  normalPrice: string;
  steamAppID: string | null;
  thumb: string;
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CheapShark ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function bestImage(deal: CheapSharkDeal) {
  if (deal.steamAppID) {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${deal.steamAppID}/header.jpg`;
  }
  return deal.thumb || null;
}

export async function fetchCheapSharkDeals(): Promise<DealInput[]> {
  const stores = await get<Store[]>("/stores");
  const storeNames = new Map(stores.map((s) => [s.storeID, s.storeName]));

  const pages = await Promise.all(
    Array.from({ length: PAGES }, (_, page) =>
      get<CheapSharkDeal[]>(`/deals?onSale=1&sortBy=Deal%20Rating&pageSize=${PAGE_SIZE}&pageNumber=${page}`),
    ),
  );

  return pages.flat().map((d) => {
    const sale = Number(d.salePrice);
    const normal = Number(d.normalPrice);
    return {
      source: "cheapshark",
      external_id: d.dealID,
      title: d.title,
      platform: "pc",
      store: storeNames.get(d.storeID) ?? "PC",
      url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
      image_url: bestImage(d),
      normal_price: normal,
      sale_price: sale,
      discount: computeDiscount(normal, sale),
      currency: "USD",
      ends_at: null,
    };
  });
}
