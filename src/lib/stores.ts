/**
 * Gamme de couleurs par boutique.
 *
 * - `color` : repère visuel (pastille, liseré de carte). Teintes inspirées des marques, ajustées pour rester
 *   distinctes entre elles sur fond sombre (vision normale ΔE ≥ 18 entre les 6 boutiques principales ;
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
    key: "humble",
    label: "Humble Store",
    match: /humble/i,
    color: "#ff8a65",
    button: "#cc2929",
    buttonText: "#ffffff",
  },
  {
    key: "fanatical",
    label: "Fanatical",
    match: /fanatical/i,
    color: "#ffb347",
    button: "#ffb347",
    buttonText: "#1a1000",
  },
  {
    key: "gmg",
    label: "GreenManGaming",
    match: /green\s?man/i,
    color: "#34d399",
    button: "#34d399",
    buttonText: "#03271a",
  },
  {
    key: "ubisoft",
    label: "Ubisoft Store",
    match: /ubisoft|uplay/i,
    color: "#6b8dff",
    button: "#2563eb",
    buttonText: "#ffffff",
  },
  {
    key: "instant",
    label: "Instant Gaming",
    match: /instant.?gaming/i,
    color: "#ff8c42",
    button: "#ff8c42",
    buttonText: "#1a0a00",
  },
  {
    key: "indiegala",
    label: "IndieGala",
    match: /indiegala/i,
    color: "#f87171",
    button: "#dc2626",
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

/** Les 6 boutiques officielles suivies automatiquement, dans l'ordre d'affichage. */
export const MAIN_STORES = ["steam", "playstation", "xbox", "nintendo", "epic", "gog"].map((key) =>
  THEMES.find((t) => t.key === key)!,
);
