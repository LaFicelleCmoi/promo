import type { DealInput } from "@/lib/types";

// Promos GOG (prix en euros, France).
const API = "https://catalog.gog.com/v1/catalog";
const PAGES = 5;
const PAGE_SIZE = 100;

type GogProduct = {
  id: string;
  title: string;
  storeLink: string;
  coverHorizontal: string | null;
  price: {
    finalMoney: { amount: string; currency: string };
    baseMoney: { amount: string; currency: string };
  } | null;
};

async function fetchPage(page: number): Promise<GogProduct[]> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    order: "desc:trending",
    discounted: "eq:true",
    productType: "in:game,pack",
    page: String(page),
    countryCode: "FR",
    locale: "fr-FR",
    currencyCode: "EUR",
  });
  const res = await fetch(`${API}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GOG → HTTP ${res.status}`);
  const json = await res.json();
  return json?.products ?? [];
}

export async function fetchGogDeals(): Promise<DealInput[]> {
  const pages = await Promise.all(Array.from({ length: PAGES }, (_, i) => fetchPage(i + 1)));

  return pages.flat().flatMap((p): DealInput[] => {
    if (!p.price) return [];
    const sale = Number(p.price.finalMoney.amount);
    const normal = Number(p.price.baseMoney.amount);
    if (!Number.isFinite(sale) || !Number.isFinite(normal) || sale >= normal) return [];

    return [
      {
        source: "gog",
        external_id: p.id,
        title: p.title,
        platform: "pc",
        store: "GOG",
        url: p.storeLink,
        image_url: p.coverHorizontal,
        normal_price: normal,
        sale_price: sale,
        discount: Math.round((1 - sale / normal) * 100),
        currency: p.price.finalMoney.currency,
        ends_at: null,
      },
    ];
  });
}
