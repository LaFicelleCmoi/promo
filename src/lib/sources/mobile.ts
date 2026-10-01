import type { DealInput } from "@/lib/types";

// Promos de jeux mobiles. Google Play et l'App Store n'ont pas d'API de promotions : on lit les flux RSS
// des communautés spécialisées (r/googleplaydeals pour Android, r/AppHookup pour iOS), puis on vérifie
// chaque offre sur la boutique officielle (prix en euros, image, catégorie jeu).
//
// Enregistrées comme promos « communauté » (source autorisée par la base) avec des identifiants
// android:<package> / ios:<id> ; la synchro retire celles qui ne sont plus vues.

const UA = "Mozilla/5.0 (compatible; PromoTracker/1.0; +https://promo-rouge.vercel.app)";
const MAX_AGE_DAYS = 7;
const CONCURRENCY = 6;

export type FeedEntry = { title: string; storeUrl: string | null; published: string };

/** Jeton de l'API officielle de Reddit (application « script », identifiants REDDIT_CLIENT_ID / SECRET). */
let token: { value: string; expires: number } | null = null;
async function redditToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Reddit OAuth → HTTP ${res.status}`);
  const json = await res.json();
  token = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return token.value;
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

/** Flux RSS public (secours si l'API officielle n'est pas configurée). */
export function parseFeed(xml: string): FeedEntry[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const content = decode(e.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "");
    return {
      title: decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim(),
      storeUrl: content.match(/href="(https:\/\/(?:play\.google\.com|apps\.apple\.com)[^"]+)"/)?.[1] ?? null,
      published: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
    };
  });
}

type RedditPost = {
  title: string;
  url: string;
  created_utc: number;
  link_flair_text: string | null;
  removed_by_category?: string | null;
};

async function readFeed(subreddit: string): Promise<FeedEntry[]> {
  const oauth = await redditToken();
  if (oauth) {
    const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/new?limit=100&raw_json=1`, {
      headers: { Authorization: `Bearer ${oauth}`, "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`r/${subreddit} (API) → HTTP ${res.status}`);
    const json = await res.json();
    return (
      ((json?.data?.children ?? []) as { data: RedditPost }[])
        .map((c) => c.data)
        // Promos marquées terminées par les modérateurs, ou posts supprimés : ignorés.
        .filter((p) => !/expired|dead|ended/i.test(p.link_flair_text ?? "") && !p.removed_by_category)
        .map((p) => ({
          title: p.title,
          storeUrl: /^https:\/\/(play\.google\.com|apps\.apple\.com)/.test(p.url) ? p.url : null,
          published: new Date(p.created_utc * 1000).toISOString(),
        }))
    );
  }

  const res = await fetch(`https://www.reddit.com/r/${subreddit}/new/.rss?limit=100`, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(
      `r/${subreddit} → HTTP ${res.status}${res.status === 429 || res.status === 403 ? " (configure REDDIT_CLIENT_ID)" : ""}`,
    );
  return parseFeed(await res.text());
}

const NUM = String.raw`(?:\d+(?:[.,]\d{1,2})?|[.,]\d{1,2})`;
const PRICE_SWAP = new RegExp(
  String.raw`([$€£])?\s?(${NUM})\s?[$€£]?\s*(?:->|→|=>|>|\bto\b)\s*(?:([$€£])?\s?(${NUM})\s?[$€£]?|(free|gratuit))`,
  "i",
);

/** « ($7.99->$5.03) », « (80% off; €5,99 > 1,20) », « [$2.99 -> Free] » → prix avant / après. */
export function parsePriceSwap(title: string) {
  const m = title.match(PRICE_SWAP);
  if (!m) return null;
  const num = (v: string) => Number(v.replace(",", ".").replace(/^\./, "0."));
  const from = num(m[2]);
  const to = m[5] ? 0 : num(m[4]);
  const symbol = m[1] ?? m[3] ?? "$";
  if (!(from > 0) || !(to >= 0) || to >= from) return null;
  return { from, to, currency: symbol === "€" ? "EUR" : symbol === "£" ? "GBP" : "USD" };
}

/** Prix normal estimé à partir de la réduction annoncée, arrondi au « ,99 » le plus proche s'il est tout près. */
function estimateNormal(sale: number, discount: number) {
  const raw = sale / (1 - discount / 100);
  const snapped = Math.ceil(raw) - 0.01;
  return Math.round((Math.abs(snapped - raw) <= 0.05 ? snapped : raw) * 100) / 100;
}

const fresh = (published: string) => Date.now() - new Date(published).getTime() < MAX_AGE_DAYS * 86_400_000;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/** Une offre n'est gardée que si la boutique affiche encore un prix réduit cohérent avec l'annonce. */
function stillOnSale(eurPrice: number, swap: { from: number; to: number }) {
  if (swap.to === 0) return eurPrice === 0;
  // Les prix régionaux diffèrent un peu ($ / €) ; au-delà de +60 % la promo est sans doute terminée.
  return eurPrice > 0 && eurPrice <= swap.to * 1.6 && eurPrice < swap.from;
}

const WEEKLY = /weekly|hebdo|roundup|megathread/i;

export async function androidDeals(entries: FeedEntry[]): Promise<DealInput[]> {
  const deals = await mapLimit(entries, CONCURRENCY, async (e): Promise<DealInput | null> => {
    const swap = parsePriceSwap(e.title);
    const pkg = new URL(e.storeUrl!).searchParams.get("id");
    if (!swap || !pkg) return null;
    try {
      const res = await fetch(`https://play.google.com/store/apps/details?id=${encodeURIComponent(pkg)}&hl=fr&gl=FR`, {
        headers: { "User-Agent": UA, "Accept-Language": "fr-FR" },
        next: { revalidate: 6 * 3600 },
      });
      if (!res.ok) return null;
      const page = await res.text();
      const priceText = page.match(/itemprop="price" content="([^"]*)"/)?.[1] ?? "";
      const eur = /^\s*0\s*$|gratuit/i.test(priceText)
        ? 0
        : Number(priceText.replace(/[^\d,.]/g, "").replace(",", "."));
      if (!Number.isFinite(eur) || !stillOnSale(eur, swap)) return null;
      // Jeu uniquement (catégorie GAME_* sur Google Play).
      if (!/\/store\/apps\/category\/GAME/.test(page)) return null;

      const discount = Math.round((1 - swap.to / swap.from) * 100);
      const normal = eur > 0 ? estimateNormal(eur, discount) : null;
      const icon = page.match(/<meta property="og:image" content="([^"]+)"/)?.[1]?.replace(/=s\d+.*$/, "=s512");
      const tags = [...e.title.matchAll(/\[([^\]]+)\]/g)].map((t) => t[1].trim());
      const name =
        tags.length >= 3 && /android/i.test(tags[0])
          ? tags[1]
          : e.title
              .replace(/^\s*\[[^\]]*\]\s*/, "")
              .replace(/\s*[([][^)\]]*(?:->|→|>)[^)\]]*[)\]].*$/, "")
              .trim();

      return {
        source: "community",
        external_id: `android:${pkg}`,
        title: name.slice(0, 200),
        platform: "mobile",
        store: "Google Play",
        url: `https://play.google.com/store/apps/details?id=${pkg}`,
        image_url: icon ?? null,
        normal_price: normal,
        sale_price: eur,
        discount: eur === 0 ? 100 : discount,
        currency: "EUR",
        ends_at: null,
      };
    } catch {
      return null;
    }
  });
  return deals.filter((d): d is DealInput => d !== null);
}

type ItunesApp = {
  trackId: number;
  trackName: string;
  price: number;
  currency: string;
  artworkUrl512?: string;
  trackViewUrl: string;
  genreIds?: string[];
};

export async function iosDeals(entries: FeedEntry[]): Promise<DealInput[]> {
  const ids = [...new Set(entries.map((e) => e.storeUrl!.match(/id(\d{5,})/)?.[1]).filter(Boolean))] as string[];
  if (ids.length === 0) return [];

  // API officielle d'Apple : prix en euros, icône, catégorie (6014 = Jeux). Jusqu'à 200 identifiants par appel.
  const res = await fetch(`https://itunes.apple.com/lookup?id=${ids.join(",")}&country=fr`, {
    next: { revalidate: 6 * 3600 },
  });
  if (!res.ok) throw new Error(`iTunes → HTTP ${res.status}`);
  const apps = new Map(((await res.json()).results as ItunesApp[]).map((a) => [String(a.trackId), a]));

  return entries.flatMap((e): DealInput[] => {
    const id = e.storeUrl!.match(/id(\d{5,})/)?.[1];
    const app = id ? apps.get(id) : undefined;
    const swap = parsePriceSwap(e.title);
    if (!app || !swap || !app.genreIds?.includes("6014") || !stillOnSale(app.price, swap)) return [];
    const discount = app.price === 0 ? 100 : Math.round((1 - swap.to / swap.from) * 100);
    return [
      {
        source: "community",
        external_id: `ios:${app.trackId}`,
        title: app.trackName.slice(0, 200),
        platform: "mobile",
        store: "App Store",
        url: app.trackViewUrl.split("?")[0],
        image_url: app.artworkUrl512 ?? null,
        normal_price: app.price > 0 ? estimateNormal(app.price, discount) : null,
        sale_price: app.price,
        discount,
        currency: app.currency || "EUR",
        ends_at: null,
      },
    ];
  });
}

/** Promos de jeux mobiles (Android + iOS). Une source qui échoue n'empêche pas l'autre. */
export async function fetchMobileDeals(): Promise<{ deals: DealInput[]; errors: string[] }> {
  const [gpd, hookup] = await Promise.allSettled([readFeed("googleplaydeals"), readFeed("AppHookup")]);
  const errors: string[] = [];
  const androidEntries: FeedEntry[] = [];
  const iosEntries: FeedEntry[] = [];

  if (gpd.status === "fulfilled") {
    androidEntries.push(
      ...gpd.value.filter(
        (e) => /^\s*\[\s*games?\s*\]/i.test(e.title) && e.storeUrl?.includes("details?id=") && fresh(e.published),
      ),
    );
  } else errors.push(`Android : ${gpd.reason instanceof Error ? gpd.reason.message : gpd.reason}`);

  if (hookup.status === "fulfilled") {
    for (const e of hookup.value) {
      if (!fresh(e.published) || WEEKLY.test(e.title) || !e.storeUrl) continue;
      const platformTag = e.title.match(/^\s*\[([^\]]+)\]/)?.[1] ?? "";
      if (/\bi(?:os|pad)/i.test(platformTag) && /apps\.apple\.com\/(?!redeem)/.test(e.storeUrl)) iosEntries.push(e);
      else if (/android/i.test(platformTag) && e.storeUrl.includes("details?id=")) androidEntries.push(e);
    }
  } else errors.push(`iOS : ${hookup.reason instanceof Error ? hookup.reason.message : hookup.reason}`);

  const [android, ios] = await Promise.allSettled([androidDeals(androidEntries), iosDeals(iosEntries)]);
  const deals = [
    ...(android.status === "fulfilled" ? android.value : []),
    ...(ios.status === "fulfilled" ? ios.value : []),
  ];
  if (ios.status === "rejected") errors.push(`iOS : ${ios.reason instanceof Error ? ios.reason.message : ios.reason}`);
  return { deals: [...new Map(deals.map((d) => [d.external_id, d])).values()], errors };
}
