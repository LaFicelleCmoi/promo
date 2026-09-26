import type { DealInput } from "@/lib/types";

// Jeux gratuits / en promo mis en avant par l'Epic Games Store.
const API = "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=fr&country=FR&allowCountries=FR";

type PromoWindow = {
  startDate: string;
  endDate: string;
  discountSetting: { discountType: string; discountPercentage: number };
};

type EpicElement = {
  id: string;
  title: string;
  productSlug: string | null;
  urlSlug: string | null;
  offerType: string;
  keyImages: { type: string; url: string }[];
  catalogNs?: { mappings: { pageSlug: string; pageType: string }[] | null };
  offerMappings?: { pageSlug: string; pageType: string }[] | null;
  price: {
    totalPrice: {
      discountPrice: number;
      originalPrice: number;
      currencyCode: string;
      currencyInfo: { decimals: number };
    };
  };
  promotions: { promotionalOffers: { promotionalOffers: PromoWindow[] }[] } | null;
};

function slugOf(e: EpicElement) {
  return (
    e.catalogNs?.mappings?.find((m) => m.pageType === "productHome")?.pageSlug ??
    e.offerMappings?.find((m) => m.pageType === "productHome")?.pageSlug ??
    e.productSlug?.replace(/\/home$/, "") ??
    e.urlSlug
  );
}

function imageOf(e: EpicElement) {
  const order = ["OfferImageWide", "DieselStoreFrontWide", "featuredMedia", "Thumbnail", "OfferImageTall"];
  for (const type of order) {
    const img = e.keyImages.find((k) => k.type === type);
    if (img) return img.url;
  }
  return e.keyImages[0]?.url ?? null;
}

export async function fetchEpicDeals(): Promise<DealInput[]> {
  const res = await fetch(API, { cache: "no-store" });
  if (!res.ok) throw new Error(`Epic → HTTP ${res.status}`);
  const json = await res.json();
  const elements: EpicElement[] = json?.data?.Catalog?.searchStore?.elements ?? [];
  const now = Date.now();

  return elements.flatMap((e): DealInput[] => {
    const active = e.promotions?.promotionalOffers
      .flatMap((p) => p.promotionalOffers)
      .find((w) => new Date(w.startDate).getTime() <= now && new Date(w.endDate).getTime() > now);
    if (!active) return [];

    const { discountPrice, originalPrice, currencyCode, currencyInfo } = e.price.totalPrice;
    const divisor = 10 ** currencyInfo.decimals;
    const sale = discountPrice / divisor;
    const normal = originalPrice / divisor;
    const slug = slugOf(e);

    return [
      {
        source: "epic",
        external_id: e.id,
        title: e.title,
        platform: "pc",
        store: "Epic Games Store",
        url: slug ? `https://store.epicgames.com/fr/p/${slug}` : "https://store.epicgames.com/fr/free-games",
        image_url: imageOf(e),
        normal_price: normal,
        sale_price: sale,
        discount: normal > 0 ? Math.round((1 - sale / normal) * 100) : 0,
        currency: currencyCode,
        ends_at: active.endDate,
      },
    ];
  });
}
