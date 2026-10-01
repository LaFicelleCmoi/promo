import type { DealInput } from "@/lib/types";
import { computeDiscount } from "@/lib/format";

// Promos payantes de l'Epic Games Store (le connecteur Epic ne couvre que les jeux gratuits et mis en avant).
// Seules les boutiques officielles sont suivies : CheapShark ne sert plus que pour Epic.
// https://apidocs.cheapshark.com/
const API = "https://www.cheapshark.com/api/1.0";
const USER_AGENT = "PromoTracker/1.0 (+https://github.com/LaFicelleCmoi/promo)";
const EPIC_STORE_ID = "25";
const PAGES = 5;
const PAGE_SIZE = 60;

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
  const pages = await Promise.all(
    Array.from({ length: PAGES }, (_, page) =>
      get<CheapSharkDeal[]>(
        `/deals?storeID=${EPIC_STORE_ID}&onSale=1&sortBy=Deal%20Rating&pageSize=${PAGE_SIZE}&pageNumber=${page}`,
      ),
    ),
  );

  return (
    pages
      .flat()
      // Jeux gratuits : déjà fournis (en euros) par le connecteur Epic.
      .filter((d) => d.storeID === EPIC_STORE_ID && Number(d.salePrice) > 0)
      .map((d) => {
        const sale = Number(d.salePrice);
        const normal = Number(d.normalPrice);
        return {
          source: "cheapshark",
          external_id: d.dealID,
          title: d.title,
          platform: "pc",
          store: "Epic Games Store",
          url: `https://www.cheapshark.com/redirect?dealID=${d.dealID}`,
          image_url: bestImage(d),
          normal_price: normal,
          sale_price: sale,
          discount: computeDiscount(normal, sale),
          currency: "USD",
          ends_at: null,
        };
      })
  );
}
