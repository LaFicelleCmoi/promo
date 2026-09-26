import type { DealInput } from "@/lib/types";

// Promos du PlayStation Store (France), via l'API GraphQL publique du store.
const API = "https://web.np.playstation.com/api/graphql/v1/op";
const DEALS_CATEGORY = "3f772501-f6f8-49b7-abac-874a88ca4897"; // « Toutes les promotions »
const QUERY_HASH = "4ce7d410a4db2c8b635a48c1dcec375906ff63b19dadd87e073f8fd0c0481d35"; // categoryGridRetrieve
const PAGES = 5;
const PAGE_SIZE = 100;

type PsProduct = {
  id: string;
  name: string;
  platforms: string[];
  media: { role: string; type: string; url: string }[];
  price: {
    basePrice: string;
    discountedPrice: string;
    discountText: string | null;
    isFree: boolean;
    isTiedToSubscription: boolean;
  } | null;
};

function parseEuro(value: string) {
  if (/gratuit|free/i.test(value)) return 0;
  const n = Number(value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function imageOf(p: PsProduct) {
  for (const role of ["GAMEHUB_COVER_ART", "FOUR_BY_THREE_BANNER", "MASTER"]) {
    const img = p.media.find((m) => m.role === role && m.type === "IMAGE");
    if (img) return `${img.url}?w=460`;
  }
  return null;
}

async function fetchPage(offset: number): Promise<PsProduct[]> {
  const variables = {
    id: DEALS_CATEGORY,
    pageArgs: { size: PAGE_SIZE, offset },
    sortBy: null,
    filterBy: ["storeDisplayClassification:FULL_GAME"],
    facetOptions: [],
  };
  const extensions = { persistedQuery: { version: 1, sha256Hash: QUERY_HASH } };
  const params = new URLSearchParams({
    operationName: "categoryGridRetrieve",
    variables: JSON.stringify(variables),
    extensions: JSON.stringify(extensions),
  });

  const res = await fetch(`${API}?${params}`, {
    headers: { "content-type": "application/json", "x-psn-store-locale-override": "fr-FR" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PlayStation → HTTP ${res.status}`);
  const json = await res.json();
  if (json?.errors?.length) throw new Error(`PlayStation → ${json.errors[0].message}`);
  return json?.data?.categoryGridRetrieve?.products ?? [];
}

export async function fetchPlayStationDeals(): Promise<DealInput[]> {
  const pages = await Promise.all(Array.from({ length: PAGES }, (_, i) => fetchPage(i * PAGE_SIZE)));

  return pages.flat().flatMap((p): DealInput[] => {
    // Les prix réservés aux abonnés PS Plus ne sont pas des promos ouvertes à tous.
    if (!p.price?.discountText || p.price.isTiedToSubscription) return [];
    const sale = parseEuro(p.price.discountedPrice);
    const normal = parseEuro(p.price.basePrice);
    if (sale === null || normal === null || sale >= normal) return [];

    return [
      {
        source: "playstation",
        external_id: p.id,
        title: p.name,
        platform: "playstation",
        store: p.platforms.includes("PS5") ? "PlayStation Store (PS5)" : "PlayStation Store (PS4)",
        url: `https://store.playstation.com/fr-fr/product/${p.id}`,
        image_url: imageOf(p),
        normal_price: normal,
        sale_price: sale,
        discount: Math.round((1 - sale / normal) * 100),
        currency: "EUR",
        ends_at: null,
      },
    ];
  });
}
