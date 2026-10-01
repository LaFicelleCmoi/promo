import type { DealInput } from "@/lib/types";
import { computeDiscount } from "@/lib/format";

// Ubisoft Store (jeux PC lancés avec Ubisoft Connect), prix en euros.
// Le store public interroge un index Algolia avec une clé de recherche publique : on lit le même catalogue.
const ALGOLIA =
  "https://XELY3U4LOD-dsn.algolia.net/1/indexes/production__fr_ubisoft__products__fr_FR__best_sellers/query";
const HEADERS = {
  "X-Algolia-Application-Id": "XELY3U4LOD",
  "X-Algolia-API-Key": "5638539fd9edb8f2c6b024b49ec375bd",
  "content-type": "application/json",
  Origin: "https://store.ubisoft.com",
};
const STORE = "https://store.ubisoft.com";
/** Préfixe des identifiants : les promos Ubisoft sont rangées avec la source « cheapshark » (liste de sources figée en base). */
export const UBISOFT_PREFIX = "ubisoft:";

type Hit = {
  id: string;
  title: string;
  url: string;
  linkWeb?: string;
  price?: { EUR?: number | string };
  default_price?: { EUR?: number | string };
  product_type?: string;
  isPrepaidCard?: string;
  Free_offer?: string;
  image_link?: string;
  image_groups?: { images?: { dis_base_link?: string }[] }[];
};

/** Image paysage (16:9) quand elle existe, sinon la jaquette, redimensionnée par le CDN du store. */
function image(hit: Hit) {
  const links = (hit.image_groups ?? []).flatMap((g) => g.images ?? []).map((i) => i.dis_base_link);
  const landscape = links.find((l, i) => l && i > 0 && l !== links[0]);
  const base = landscape ?? links[0];
  if (!base) return hit.image_link ?? null;
  return `${base.replace(`${STORE}/on/demandware.static/`, `${STORE}/dw/image/v2/ABBS_PRD/on/demandware.static/`)}?sw=616&sh=347&sm=fit`;
}

export async function fetchUbisoftDeals(): Promise<DealInput[]> {
  const res = await fetch(ALGOLIA, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query: "", hitsPerPage: 1000, attributesToHighlight: [], attributesToSnippet: [] }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Ubisoft Store → HTTP ${res.status}`);
  const { hits } = (await res.json()) as { hits: Hit[] };

  const deals: DealInput[] = [];
  for (const h of hits) {
    const sale = Number(h.price?.EUR);
    const normal = Number(h.default_price?.EUR);
    // Uniquement les vraies réductions sur des jeux et extensions (pas les abonnements ni les cartes prépayées).
    if (!Number.isFinite(sale) || !Number.isFinite(normal) || normal <= 0 || sale >= normal) continue;
    if (h.isPrepaidCard === "true" || !["Jeux", "DLC"].includes(h.product_type ?? "")) continue;

    deals.push({
      source: "cheapshark",
      external_id: `${UBISOFT_PREFIX}${h.id}`,
      title: h.title.trim(),
      platform: "pc",
      store: "Ubisoft Connect",
      url: h.linkWeb ?? `${STORE}${h.url}`,
      image_url: image(h),
      normal_price: normal,
      sale_price: sale,
      discount: computeDiscount(normal, sale),
      currency: "EUR",
      ends_at: null,
    });
  }
  return deals;
}
