import { PLATFORMS, isPlatform, type Platform } from "@/lib/types";

/** Couleurs d'accent du site (≈ 4,4:1 en texte blanc sur fond et en texte sur fond sombre, comme le violet d'origine). */
export const ACCENTS = {
  violet: { label: "Violet", color: "#7c5cff", hover: "#917aff" },
  bleu: { label: "Bleu", color: "#3371ee", hover: "#598cf2" },
  cyan: { label: "Cyan", color: "#0d83a0", hover: "#10a2c6" },
  vert: { label: "Vert", color: "#188a48", hover: "#1eac5a" },
  orange: { label: "Orange", color: "#c7560a", hover: "#ed660c" },
  rose: { label: "Rose", color: "#e02388", hover: "#e5479b" },
  rouge: { label: "Rouge", color: "#e52e34", hover: "#ea5358" },
  or: { label: "Or", color: "#a26d12", hover: "#c78616" },
} as const;
export type AccentKey = keyof typeof ACCENTS;

/** Dégradés des avatars et des bannières. */
export const GRADIENTS = {
  aurore: { label: "Aurore", from: "#7c5cff", to: "#ec4899" },
  ocean: { label: "Océan", from: "#0ea5e9", to: "#6366f1" },
  neon: { label: "Néon", from: "#22d3ee", to: "#a855f7" },
  foret: { label: "Forêt", from: "#22c55e", to: "#0d9488" },
  menthe: { label: "Menthe", from: "#34d399", to: "#3b82f6" },
  soleil: { label: "Soleil", from: "#facc15", to: "#f97316" },
  lave: { label: "Lave", from: "#f97316", to: "#dc2626" },
  nuit: { label: "Nuit", from: "#475569", to: "#0f172a" },
} as const;
export type GradientKey = keyof typeof GRADIENTS;

export const PATTERNS = {
  aucun: "Uni",
  grille: "Grille",
  points: "Points",
  vagues: "Vagues",
  diagonales: "Diagonales",
} as const;
export type PatternKey = keyof typeof PATTERNS;

/** Icônes d'avatar (tracés SVG 24×24). */
export const AVATAR_ICONS = {
  manette:
    "M6 11h4M8 9v4M15 12h.01M18 10h.01M17.32 5H6.68a4 4 0 0 0-3.98 3.59l-.9 7.2a2.5 2.5 0 0 0 4.55 1.67L8 15h8l1.65 2.46a2.5 2.5 0 0 0 4.55-1.67l-.9-7.2A4 4 0 0 0 17.32 5z",
  joystick: "M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 9v7M5 16h14a1 1 0 0 1 1 1v3H4v-3a1 1 0 0 1 1-1z",
  epee: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2",
  fusee:
    "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
  fantome: "M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z",
  couronne: "M2 18h20M3 8l4 6 5-9 5 9 4-6-2 10H5z",
  eclair: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  coeur:
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z",
  etoile: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
  envahisseur: "M5 9h2V7h2v2h6V7h2v2h2v6h-2v2h-2v-2H9v2H7v-2H5zM9 11h1M14 11h1",
  trophee:
    "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z",
  champignon: "M12 3C6.5 3 3 7 3 11h18c0-4-3.5-8-9-8zM8 11v3a4 4 0 0 0 8 0v-3M9 7h.01M15 7h.01",
} as const;
export type AvatarIcon = keyof typeof AVATAR_ICONS;

export const TITLES = [
  "Chasseur de promos",
  "Collectionneur",
  "Joueur du dimanche",
  "Joueur PC",
  "Team PlayStation",
  "Team Xbox",
  "Team Nintendo",
  "Rétro gamer",
  "Speedrunner",
  "Explorateur d'indés",
  "Complétionniste",
] as const;

export type Avatar =
  | { type: "photo"; url: string }
  | { type: "initial"; gradient: GradientKey }
  | { type: "icon"; icon: AvatarIcon; gradient: GradientKey };

export type Profile = {
  username: string;
  title: string | null;
  bio: string;
  avatar: Avatar;
  banner: { gradient: GradientKey; pattern: PatternKey };
  accent: AccentKey;
  density: "comfortable" | "compact";
  reduceMotion: boolean;
  platforms: Platform[];
};

const isKey = <T extends object>(obj: T, key: unknown): key is keyof T => typeof key === "string" && key in obj;

/** Profil lu depuis les métadonnées du compte, avec des valeurs par défaut et tout champ inconnu ignoré. */
export function parseProfile(meta: Record<string, unknown> | undefined | null, fallbackName = "Joueur"): Profile {
  const m = meta ?? {};
  const raw = (m.profile ?? {}) as Record<string, unknown>;
  const rawAvatar = (raw.avatar ?? {}) as Record<string, unknown>;
  const rawBanner = (raw.banner ?? {}) as Record<string, unknown>;

  let avatar: Avatar = { type: "initial", gradient: "aurore" };
  if (rawAvatar.type === "photo" && typeof rawAvatar.url === "string" && /^https:\/\//.test(rawAvatar.url)) {
    avatar = { type: "photo", url: rawAvatar.url };
  } else if (rawAvatar.type === "icon" && isKey(AVATAR_ICONS, rawAvatar.icon)) {
    avatar = {
      type: "icon",
      icon: rawAvatar.icon,
      gradient: isKey(GRADIENTS, rawAvatar.gradient) ? rawAvatar.gradient : "aurore",
    };
  } else if (rawAvatar.type === "initial" && isKey(GRADIENTS, rawAvatar.gradient)) {
    avatar = { type: "initial", gradient: rawAvatar.gradient };
  }

  return {
    username: typeof m.username === "string" && m.username.trim() ? m.username.trim() : fallbackName,
    title: typeof raw.title === "string" && (TITLES as readonly string[]).includes(raw.title) ? raw.title : null,
    bio: typeof raw.bio === "string" ? raw.bio.slice(0, 160) : "",
    avatar,
    banner: {
      gradient: isKey(GRADIENTS, rawBanner.gradient) ? rawBanner.gradient : "aurore",
      pattern: isKey(PATTERNS, rawBanner.pattern) ? rawBanner.pattern : "grille",
    },
    accent: isKey(ACCENTS, raw.accent) ? raw.accent : "violet",
    density: raw.density === "compact" ? "compact" : "comfortable",
    reduceMotion: raw.reduceMotion === true,
    platforms: Array.isArray(raw.platforms) ? [...new Set(raw.platforms.filter(isPlatform))] : [],
  };
}

/** Fond CSS d'une bannière (dégradé + motif). */
export function bannerBackground(gradient: GradientKey, pattern: PatternKey) {
  const g = GRADIENTS[gradient];
  const base = `linear-gradient(135deg, ${g.from}, ${g.to})`;
  const overlay = {
    aucun: null,
    grille:
      "linear-gradient(rgb(255 255 255 / .12) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .12) 1px, transparent 1px)",
    points: "radial-gradient(rgb(255 255 255 / .22) 1.2px, transparent 1.4px)",
    vagues: "repeating-radial-gradient(circle at 0 100%, transparent 0 14px, rgb(255 255 255 / .1) 14px 16px)",
    diagonales: "repeating-linear-gradient(45deg, rgb(255 255 255 / .1) 0 2px, transparent 2px 12px)",
  }[pattern];
  const size = { aucun: "", grille: "22px 22px, 22px 22px, ", points: "14px 14px, ", vagues: "", diagonales: "" }[
    pattern
  ];
  return {
    backgroundImage: overlay ? `${overlay}, ${base}` : base,
    backgroundSize: size ? `${size}100% 100%` : undefined,
  };
}

export const ALL_PLATFORMS = PLATFORMS;

export const AVATAR_ICON_LABELS: Record<AvatarIcon, string> = {
  manette: "Manette",
  joystick: "Joystick",
  epee: "Épée",
  fusee: "Fusée",
  fantome: "Fantôme",
  couronne: "Couronne",
  eclair: "Éclair",
  coeur: "Cœur",
  etoile: "Étoile",
  envahisseur: "Envahisseur",
  trophee: "Trophée",
  champignon: "Champignon",
};
