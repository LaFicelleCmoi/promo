import type { DealInput } from "@/lib/types";

// Promos du Microsoft Store / Xbox (France), via l'API qui alimente xbox.com.
const API = "https://emerald.xboxservices.com/xboxcomfd/browse?locale=fr-FR";
const CHANNEL = "DynamicChannel.GameDeals";
const MAX_PAGES = 40; // 25 jeux par page

type XboxPrice = {
  listPrice: number;
  msrp: number;
  currency: string;
  endDateUtc?: string;
  eligibilityInfo?: { eligibility: string } | null;
};

type XboxProduct = {
  productId: string;
  title: string;
  images?: Record<string, { url: string } | undefined>;
  specificPrices?: { purchaseable?: XboxPrice[] };
};

type BrowseResponse = {
  channels: Record<string, { encodedCT?: string; products: { productId: string }[] }>;
  productSummaries: XboxProduct[];
};

async function fetchPage(continuation?: string): Promise<BrowseResponse> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json", "x-ms-api-version": "1.1", "ms-cv": "PromoTracker.1" },
    body: JSON.stringify({
      Filters: "e30=",
      ReturnFilters: false,
      ChannelKeyToBeUsedInResponse: `BROWSE_CHANNELID=${CHANNEL.toUpperCase()}_FILTERS=`,
      EncodedFilters: "e30=",
      ChannelId: CHANNEL,
      ...(continuation ? { EncodedCT: continuation } : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Xbox → HTTP ${res.status}`);
  return res.json();
}

function imageOf(p: XboxProduct) {
  const img = p.images?.superHeroArt ?? p.images?.boxArt ?? p.images?.poster;
  return img ? `${img.url}?w=460&h=215&mode=crop` : null;
}

// "10/08/2026 09:59:59" (MM/JJ/AAAA, UTC)
function parseEndDate(value?: string) {
  const m = value?.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, month, day, year, h, min, s] = m;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +h, +min, +s));
  return date.getUTCFullYear() > 2100 ? null : date.toISOString();
}

export async function fetchXboxDeals(): Promise<DealInput[]> {
  const products: XboxProduct[] = [];
  let continuation: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await fetchPage(continuation);
    products.push(...(data.productSummaries ?? []));
    continuation = Object.values(data.channels ?? {})[0]?.encodedCT;
    if (!continuation) break;
  }

  return products.flatMap((p): DealInput[] => {
    // On ignore les réductions réservées aux abonnés (Game Pass, etc.).
    const price = p.specificPrices?.purchaseable?.find(
      (pr) => (pr.eligibilityInfo?.eligibility ?? "None") === "None" && pr.listPrice < pr.msrp,
    );
    if (!price) return [];

    return [
      {
        source: "xbox",
        external_id: p.productId,
        title: p.title,
        platform: "xbox",
        store: "Xbox Store",
        url: `https://www.xbox.com/fr-FR/games/store/p/${p.productId}`,
        image_url: imageOf(p),
        normal_price: price.msrp,
        sale_price: price.listPrice,
        discount: Math.round((1 - price.listPrice / price.msrp) * 100),
        currency: price.currency,
        ends_at: parseEndDate(price.endDateUtc),
      },
    ];
  });
}
