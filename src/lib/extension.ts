import "server-only";
import type { Platform } from "@/lib/types";

/** Boutiques reconnues par l'extension Chrome (clé envoyée par le script de contenu) et plateforme associée. */
export const EXTENSION_STORES: Record<string, Platform> = {
  steam: "pc",
  epic: "pc",
  gog: "pc",
  ubisoft: "pc",
  playstation: "playstation",
  xbox: "xbox",
  nintendo: "switch",
  googleplay: "mobile",
  appstore: "mobile",
};

/** Réponses lues par l'extension (d'autres origines) : jamais mises en cache, propres à chaque compte. */
export const NO_STORE = { "Cache-Control": "private, no-store" };

/** Titre tel qu'affiché par une boutique, nettoyé (marques, suffixes, espaces). */
export function cleanTitle(raw: string) {
  return raw.replace(/[™®©]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (c) => `\\${c}`);
}
