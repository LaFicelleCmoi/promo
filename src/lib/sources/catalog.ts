/** Sources synchronisées automatiquement (sans les fonctions de lecture : utilisable côté client). */
export const SYNC_SOURCES = [
  "steam",
  "playstation",
  "xbox",
  "nintendo",
  "epic",
  "gog",
  "cheapshark",
  "mobile",
] as const;
export type SyncSource = (typeof SYNC_SOURCES)[number];

export const SYNC_SOURCE_LABELS: Record<SyncSource, string> = {
  steam: "Steam",
  playstation: "PlayStation Store",
  xbox: "Xbox Store",
  nintendo: "Nintendo eShop",
  epic: "Epic Games Store",
  gog: "GOG",
  cheapshark: "CheapShark (autres boutiques PC)",
  mobile: "Mobile (Google Play et App Store)",
};

export function isSyncSource(value: unknown): value is SyncSource {
  return typeof value === "string" && (SYNC_SOURCES as readonly string[]).includes(value);
}
