// Mots trop génériques pour identifier un jeu (éditions, articles, types de lots).
const NOISE = new Set([
  "the",
  "of",
  "and",
  "a",
  "an",
  "for",
  "de",
  "du",
  "la",
  "le",
  "les",
  "des",
  "et",
  "pour",
  "en",
  "edition",
  "édition",
  "deluxe",
  "ultimate",
  "standard",
  "complete",
  "definitive",
  "gold",
  "premium",
  "bundle",
  "pack",
  "collection",
  "goty",
  "game",
  "year",
  "remastered",
  "digital",
  "numérique",
  "ps4",
  "ps5",
]);

/** Mots-clés significatifs d'un titre, pour retrouver le même jeu sur d'autres boutiques. */
export function titleKeywords(title: string, max = 4) {
  return (
    title
      .toLowerCase()
      .replace(/[™®©]/g, " ")
      .replace(/\bps[345]\b/g, " ")
      // « fc26 » → « fc 26 » : sinon « FC26 » ne ressemble pas à « EA SPORTS FC™ 26 ».
      .replace(/(\p{L})(\p{N})/gu, "$1 $2")
      .replace(/(\p{N})(\p{L})/gu, "$1 $2")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(" ")
      .filter((w) => (w.length >= 2 || /^\d$/.test(w)) && !NOISE.has(w))
      .slice(0, max)
  );
}

/** Ressemblance entre deux titres (indice de Jaccard sur les mots-clés), de 0 à 1. */
export function titleSimilarity(a: string, b: string) {
  const ka = new Set(titleKeywords(a, 12));
  const kb = new Set(titleKeywords(b, 12));
  if (!ka.size || !kb.size) return 0;
  const common = [...ka].filter((w) => kb.has(w)).length;
  return common / (ka.size + kb.size - common);
}
