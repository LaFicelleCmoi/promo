import type { Platform } from "@/lib/types";

/**
 * Gamme de couleurs par boutique.
 *
 * - `color` : repère visuel (pastille, liseré de carte). Teintes inspirées des marques, ajustées pour rester
 *   distinctes entre elles sur fond sombre (vision normale ΔE ≥ 18 entre les 7 boutiques principales ;
 *   en daltonisme ΔE ≥ 6, toléré car le nom de la boutique est toujours écrit à côté).
 * - `button` / `buttonText` : bouton « Voir sur … » aux couleurs officielles, contraste texte ≥ 4,5:1.
 * Le texte des badges reste en couleur de texte neutre : la couleur ne porte jamais seule l'identité.
 */
export type StoreTheme = {
  key: string;
  label: string;
  color: string;
  button: string;
  buttonText: string;
};

const THEMES: (StoreTheme & { match: RegExp })[] = [
  { key: "steam", label: "Steam", match: /steam/i, color: "#22c3c3", button: "#22c3c3", buttonText: "#062a2a" },
  {
    key: "playstation",
    label: "PlayStation Store",
    match: /playstation|psn/i,
    color: "#4f78ff",
    button: "#0070d1",
    buttonText: "#ffffff",
  },
  {
    key: "xbox",
    label: "Xbox Store",
    match: /xbox|microsoft/i,
    color: "#8bd12c",
    button: "#107c10",
    buttonText: "#ffffff",
  },
  {
    key: "nintendo",
    label: "Nintendo eShop",
    match: /nintendo|eshop/i,
    color: "#ff6060",
    button: "#e60012",
    buttonText: "#ffffff",
  },
  {
    key: "epic",
    label: "Epic Games Store",
    match: /epic/i,
    color: "#f4f4f5",
    button: "#f4f4f5",
    buttonText: "#111111",
  },
  { key: "gog", label: "GOG", match: /\bgog\b/i, color: "#e864e0", button: "#86328a", buttonText: "#ffffff" },
  {
    key: "ubisoft",
    label: "Ubisoft Connect",
    match: /ubisoft|uplay/i,
    color: "#fde047",
    button: "#2563eb",
    buttonText: "#ffffff",
  },
  {
    key: "googleplay",
    label: "Google Play",
    match: /google\s?play/i,
    color: "#3ddc84",
    button: "#01875f",
    buttonText: "#ffffff",
  },
  {
    key: "appstore",
    label: "App Store",
    match: /app\s?store|apple/i,
    color: "#2f9bff",
    button: "#0a66d9",
    buttonText: "#ffffff",
  },
];

const DEFAULT: StoreTheme = {
  key: "other",
  label: "Boutique",
  color: "#94a3b8",
  button: "#7c5cff",
  buttonText: "#ffffff",
};

/** Thème de couleur d'une boutique à partir de son nom (« PlayStation Store (PS5) », « Steam »…). */
export function storeTheme(store: string): StoreTheme {
  return THEMES.find((t) => t.match.test(store)) ?? { ...DEFAULT, label: store };
}

/** Les 7 boutiques officielles suivies automatiquement, dans l'ordre d'affichage. */
export const MAIN_STORES = ["steam", "playstation", "xbox", "nintendo", "epic", "gog", "ubisoft"].map((key) =>
  THEMES.find((t) => t.key === key)!,
);

/** Seules boutiques acceptées sur le site : les 7 principales + Google Play et App Store (jeux mobiles). */
export const OFFICIAL_STORES = [...MAIN_STORES.map((t) => t.label), "Google Play", "App Store"];

/** Vrai si le nom correspond à une boutique officielle (ex. « PlayStation Store (PS5) »). */
export function isOfficialStore(store: string) {
  const key = storeTheme(store).key;
  return [...MAIN_STORES.map((t) => t.key), "googleplay", "appstore"].includes(key);
}

const STORE_HOSTS: { match: RegExp; store: string; platform?: Platform }[] = [
  { match: /(^|\.)steampowered\.com$/, store: "Steam", platform: "pc" },
  { match: /(^|\.)playstation\.com$/, store: "PlayStation Store", platform: "playstation" },
  { match: /(^|\.)(xbox|microsoft)\.com$/, store: "Xbox Store", platform: "xbox" },
  { match: /(^|\.)nintendo\.(com|fr|co\.uk|de|es|it|be|ch)$/, store: "Nintendo eShop", platform: "switch" },
  { match: /(^|\.)epicgames\.com$/, store: "Epic Games Store", platform: "pc" },
  { match: /(^|\.)gog\.com$/, store: "GOG", platform: "pc" },
  { match: /(^|\.)ubisoft\.com$/, store: "Ubisoft Connect", platform: "pc" },
  { match: /^play\.google\.com$/, store: "Google Play", platform: "mobile" },
  { match: /^apps\.apple\.com$/, store: "App Store", platform: "mobile" },
];

/** Boutique officielle reconnue à partir du lien d'une promo, ou null si le site n'en fait pas partie. */
export function officialStoreFromUrl(url: string) {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return null;
    return STORE_HOSTS.find((s) => s.match.test(hostname.replace(/^www\./, ""))) ?? null;
  } catch {
    return null;
  }
}
