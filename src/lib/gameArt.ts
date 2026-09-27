import "server-only";
import { titleKeywords, titleSimilarity } from "@/lib/titles";
import { steamHeaderImages } from "@/lib/steamAssets";

export type GameArt = {
  title: string;
  image: string;
  store: string;
  url: string;
  price: number | null;
  currency: string;
};

const DAY = 86_400;
const MIN_SIMILARITY = 0.5;

type SteamItem = { id: number; type: string; name: string; price?: { currency: string; final: number } };

async function searchSteam(term: string): Promise<SteamItem[]> {
  const params = new URLSearchParams({ term, l: "french", cc: "FR" });
  const res = await fetch(`https://store.steampowered.com/api/storesearch/?${params}`, { next: { revalidate: DAY } });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items ?? []) as SteamItem[];
}

type NintendoDoc = {
  title: string;
  url: string;
  price_regular_f?: number;
  wishlist_email_banner460w_image_url_s?: string;
};

async function searchNintendo(term: string): Promise<NintendoDoc[]> {
  const params = new URLSearchParams({
    q: term,
    fq: "type:GAME",
    rows: "5",
    wt: "json",
    fl: "title,url,price_regular_f,wishlist_email_banner460w_image_url_s",
  });
  const res = await fetch(`https://searching.nintendo-europe.com/fr/select?${params}`, { next: { revalidate: DAY } });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.response?.docs ?? []) as NintendoDoc[];
}

async function steamImage(appId: number) {
  const images = await steamHeaderImages([appId]).catch(() => new Map<number, string>());
  return images.get(appId) ?? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
}

function best<T>(items: T[], title: string, nameOf: (item: T) => string) {
  let top: { item: T; score: number } | null = null;
  for (const item of items) {
    const score = titleSimilarity(title, nameOf(item));
    if (score >= MIN_SIMILARITY && (!top || score > top.score)) top = { item, score };
  }
  return top?.item ?? null;
}

/**
 * Image (et prix actuel) d'un jeu à partir de son titre, même hors promo :
 * store Steam d'abord, eShop Nintendo ensuite. Résultats mis en cache une journée.
 */
export async function findGameArt(title: string, platform?: string | null): Promise<GameArt | null> {
  const keywords = titleKeywords(title, 6);
  const clean = title.replace(/[™®©]/g, "").trim();
  const terms = [...new Set([clean, keywords.slice(0, 3).join(" "), keywords.slice(0, 2).join(" ")])].filter(
    (t) => t.length >= 2,
  );

  try {
    if (platform !== "switch" && platform !== "playstation" && platform !== "xbox") {
      for (const term of terms) {
        const hit = best(
          (await searchSteam(term)).filter((i) => i.type === "app"),
          title,
          (i) => i.name,
        );
        if (hit) {
          return {
            title: hit.name,
            image: await steamImage(hit.id),
            store: "Steam",
            url: `https://store.steampowered.com/app/${hit.id}/`,
            price: hit.price ? hit.price.final / 100 : null,
            currency: hit.price?.currency ?? "EUR",
          };
        }
      }
    }

    for (const term of terms) {
      const hit = best(await searchNintendo(term), title, (d) => d.title);
      if (hit?.wishlist_email_banner460w_image_url_s) {
        return {
          title: hit.title,
          image: hit.wishlist_email_banner460w_image_url_s,
          store: "Nintendo eShop",
          url: `https://www.nintendo.com${hit.url}`,
          price: hit.price_regular_f && hit.price_regular_f > 0 ? hit.price_regular_f : null,
          currency: "EUR",
        };
      }
    }

    // Jeu console absent de l'eShop : on tente quand même Steam pour l'image.
    if (platform === "playstation" || platform === "xbox") {
      for (const term of terms) {
        const hit = best(
          (await searchSteam(term)).filter((i) => i.type === "app"),
          title,
          (i) => i.name,
        );
        if (hit) {
          return {
            title: hit.name,
            image: await steamImage(hit.id),
            store: "Steam",
            url: `https://store.steampowered.com/app/${hit.id}/`,
            price: null, // prix PC : pas pertinent pour une wishlist console
            currency: "EUR",
          };
        }
      }
    }
  } catch {
    // Boutique injoignable : la carte s'affichera sans image.
  }
  return null;
}
