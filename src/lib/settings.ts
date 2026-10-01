import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSyncSource, type SyncSource } from "@/lib/sources/catalog";

/**
 * Réglages du site modifiables depuis le panel admin.
 * Rangés en JSON dans le bucket privé « config » de Supabase Storage (lisible uniquement avec la clé secrète).
 */
export type AnnouncementTone = "info" | "success" | "warning" | "danger";

export type SiteSettings = {
  announcement: { enabled: boolean; message: string; tone: AnnouncementTone; link: string | null; linkLabel: string };
  maintenance: { enabled: boolean; message: string };
  signupsOpen: boolean;
  communityDealsOpen: boolean;
  syncEnabled: boolean;
  disabledSources: SyncSource[];
  pushAlertsEnabled: boolean;
  /** Promos masquées : jamais réimportées par la synchro. Clé « source:external_id ». */
  blockedDeals: { key: string; title: string; at: string }[];
};

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: { enabled: false, message: "", tone: "info", link: null, linkLabel: "En savoir plus" },
  maintenance: {
    enabled: false,
    message: "Promo Tracker fait une petite pause pour maintenance. Reviens dans quelques minutes !",
  },
  signupsOpen: true,
  communityDealsOpen: true,
  syncEnabled: true,
  disabledSources: [],
  pushAlertsEnabled: true,
  blockedDeals: [],
};

const BUCKET = "config";
const SETTINGS_FILE = "settings.json";
const AUDIT_FILE = "audit.json";
const LAST_SYNC_FILE = "last-sync.json";
const AUDIT_MAX = 300;

const TONES: AnnouncementTone[] = ["info", "success", "warning", "danger"];
const str = (v: unknown, max: number, fallback = "") => (typeof v === "string" ? v.trim().slice(0, max) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

/** Réglages lus depuis le JSON : chaque champ est validé, tout champ inconnu ou invalide reprend sa valeur par défaut. */
export function parseSettings(raw: unknown): SiteSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  const a = (r.announcement ?? {}) as Record<string, unknown>;
  const m = (r.maintenance ?? {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  const link = str(a.link, 300);
  return {
    announcement: {
      enabled: bool(a.enabled, false),
      message: str(a.message, 280),
      tone: TONES.includes(a.tone as AnnouncementTone) ? (a.tone as AnnouncementTone) : "info",
      link: /^(https:\/\/|\/(?!\/))/.test(link) ? link : null,
      linkLabel: str(a.linkLabel, 40) || d.announcement.linkLabel,
    },
    maintenance: { enabled: bool(m.enabled, false), message: str(m.message, 400) || d.maintenance.message },
    signupsOpen: bool(r.signupsOpen, true),
    communityDealsOpen: bool(r.communityDealsOpen, true),
    syncEnabled: bool(r.syncEnabled, true),
    disabledSources: Array.isArray(r.disabledSources) ? [...new Set(r.disabledSources.filter(isSyncSource))] : [],
    pushAlertsEnabled: bool(r.pushAlertsEnabled, true),
    blockedDeals: Array.isArray(r.blockedDeals)
      ? (r.blockedDeals as Record<string, unknown>[])
          .filter((b) => typeof b?.key === "string")
          .map((b) => ({ key: String(b.key), title: str(b.title, 200), at: str(b.at, 40) }))
      : [],
  };
}

const storageUrl = (file: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${file}`;
const authHeaders = () => ({
  apikey: process.env.SUPABASE_SECRET_KEY!,
  Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
});

/** Copie en mémoire des réglages, par instance serveur : au plus une lecture Storage toutes les 15 s. */
const TTL = 15_000;
let memo: { at: number; value: SiteSettings } | null = null;

/**
 * Réglages courants (lus à chaque page publique). Un changement fait dans le panel s'applique tout de suite
 * sur l'instance qui l'a enregistré, et en 15 s au plus sur les autres.
 */
export async function getSettings(): Promise<SiteSettings> {
  if (memo && Date.now() - memo.at < TTL) return memo.value;
  try {
    const res = await fetch(storageUrl(SETTINGS_FILE), { headers: authHeaders(), cache: "no-store" });
    let value = DEFAULT_SETTINGS; // fichier absent (jamais enregistré) : réglages par défaut
    if (res.ok) value = parseSettings(await res.json());
    else if (res.status !== 400 && res.status !== 404) throw new Error(String(res.status));
    memo = { at: Date.now(), value };
    return value;
  } catch {
    // Storage indisponible : dernière valeur connue plutôt que de tout réinitialiser.
    return memo?.value ?? DEFAULT_SETTINGS;
  }
}

async function readJson(file: string): Promise<unknown> {
  const res = await fetch(storageUrl(file), { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function writeJson(file: string, data: unknown) {
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .upload(file, JSON.stringify(data, null, 2), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(error.message);
}

/** Lecture sans cache, pour modifier les réglages à partir de la toute dernière version. */
export async function getFreshSettings() {
  return parseSettings(await readJson(SETTINGS_FILE));
}

/** Enregistre les réglages et met à jour la copie en mémoire. */
export async function saveSettings(settings: SiteSettings) {
  const value = parseSettings(settings);
  await writeJson(SETTINGS_FILE, value);
  memo = { at: Date.now(), value };
}

// ---------------------------------------------------------------------------
// Journal des actions admin
// ---------------------------------------------------------------------------
export type AuditEntry = { at: string; admin: string; action: string; target?: string; details?: string };

export async function getAuditLog(): Promise<AuditEntry[]> {
  const data = await readJson(AUDIT_FILE);
  return Array.isArray(data) ? (data as AuditEntry[]) : [];
}

/** Ajoute une entrée au journal. Ne bloque jamais l'action elle-même si l'écriture échoue. */
export async function logAdminAction(entry: Omit<AuditEntry, "at">) {
  try {
    const log = await getAuditLog();
    await writeJson(AUDIT_FILE, [{ at: new Date().toISOString(), ...entry }, ...log].slice(0, AUDIT_MAX));
  } catch {
    // journal indisponible : l'action a quand même eu lieu
  }
}

export async function clearAuditLog() {
  await writeJson(AUDIT_FILE, []);
}

// ---------------------------------------------------------------------------
// Dernière synchronisation
// ---------------------------------------------------------------------------
export type SyncReport = {
  startedAt: string;
  finishedAt: string;
  trigger: "cron" | "admin";
  sources: Partial<Record<SyncSource, { ok: boolean; count: number; error?: string; ms: number }>>;
  priceHistory?: number | string;
  purged?: number | string;
  notifications?: number | string;
  blocked?: number;
};

export async function getLastSync(): Promise<SyncReport | null> {
  const data = await readJson(LAST_SYNC_FILE);
  return data && typeof data === "object" ? (data as SyncReport) : null;
}

export async function saveLastSync(report: SyncReport) {
  try {
    await writeJson(LAST_SYNC_FILE, report);
  } catch {
    // simple rapport : sans conséquence si l'écriture échoue
  }
}
