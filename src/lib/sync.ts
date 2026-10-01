import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCheapSharkDeals } from "@/lib/sources/cheapshark";
import { fetchEpicDeals } from "@/lib/sources/epic";
import { fetchNintendoDeals } from "@/lib/sources/nintendo";
import { fetchSteamDeals } from "@/lib/sources/steam";
import { fetchGogDeals } from "@/lib/sources/gog";
import { fetchPlayStationDeals } from "@/lib/sources/playstation";
import { fetchXboxDeals } from "@/lib/sources/xbox";
import { fetchMobileDeals } from "@/lib/sources/mobile";
import { UBISOFT_PREFIX, fetchUbisoftDeals } from "@/lib/sources/ubisoft";
import { SYNC_SOURCES, type SyncSource } from "@/lib/sources/catalog";
import { sendWishlistNotifications } from "@/lib/push/alerts";
import { getFreshSettings, getLastSync, saveLastSync, type SyncReport } from "@/lib/settings";
import type { DealInput } from "@/lib/types";

const FETCHERS: Record<Exclude<SyncSource, "mobile">, () => Promise<DealInput[]>> = {
  ubisoft: fetchUbisoftDeals,
  steam: fetchSteamDeals,
  playstation: fetchPlayStationDeals,
  xbox: fetchXboxDeals,
  nintendo: fetchNintendoDeals,
  epic: fetchEpicDeals,
  gog: fetchGogDeals,
  cheapshark: fetchCheapSharkDeals,
};

const CHUNK = 500;

type Options = {
  /** Sources à synchroniser. Par défaut : toutes celles activées dans les réglages. */
  only?: SyncSource[];
  /** Relevé des prix, purge et notifications après l'import (par défaut : oui). */
  followUp?: boolean;
  trigger?: SyncReport["trigger"];
};

/** Synchronisation des promos : appelée par le cron quotidien (/api/sync) et par le panel admin. */
export async function runSync({ only, followUp = true, trigger = "cron" }: Options = {}): Promise<SyncReport> {
  const supabase = createAdminClient();
  const settings = await getFreshSettings();
  const startedAt = new Date().toISOString();
  const sources = only ?? SYNC_SOURCES.filter((s) => !settings.disabledSources.includes(s));
  const blocked = new Set(settings.blockedDeals.map((b) => b.key));
  const report: SyncReport = { startedAt, finishedAt: startedAt, trigger, sources: {}, blocked: 0 };
  const synced: string[] = [];

  const keep = (d: DealInput) => {
    if (!blocked.has(`${d.source}:${d.external_id}`)) return true;
    report.blocked = (report.blocked ?? 0) + 1;
    return false;
  };

  await Promise.all(
    sources.map(async (name) => {
      const t0 = Date.now();
      try {
        const { count, warning } =
          name === "mobile"
            ? await syncMobile(supabase, startedAt, keep)
            : { count: await upsertAll(supabase, dedupe(await FETCHERS[name]()).filter(keep), startedAt) };
        report.sources[name] = { ok: true, count, error: warning, ms: Date.now() - t0 };
        if (name === "ubisoft" || name === "cheapshark") {
          // Ubisoft partage la source « cheapshark » en base : chaque connecteur ne retire que ses propres promos.
          await removeStale(supabase, "cheapshark", startedAt, name === "ubisoft" ? "only" : "except", UBISOFT_PREFIX);
        } else if (name !== "mobile") {
          synced.push(name);
        }
      } catch (err) {
        report.sources[name] = {
          ok: false,
          count: 0,
          error: err instanceof Error ? err.message : String(err),
          ms: Date.now() - t0,
        };
      }
    }),
  );

  if (followUp) Object.assign(report, await runFollowUp(supabase, synced, startedAt, settings.pushAlertsEnabled));

  report.finishedAt = new Date().toISOString();
  // Synchro partielle (une seule source) : on complète le dernier rapport au lieu de l'écraser.
  const previous = only ? await getLastSync() : null;
  await saveLastSync(
    previous ? { ...previous, ...report, sources: { ...previous.sources, ...report.sources } } : report,
  );
  return report;
}

/** Après l'import : relevé quotidien des prix, purge des promos expirées et notifications de la wishlist. */
export async function runFollowUp(
  supabase: SupabaseClient,
  syncedSources: string[],
  olderThan: string,
  notify: boolean,
) {
  const { data: priceRecords, error: historyError } = await supabase.rpc("record_price_history");
  // On ne purge que les sources synchronisées avec succès.
  const { data: purged, error: purgeError } = await supabase.rpc("purge_stale_deals", {
    synced_sources: syncedSources,
    older_than: olderThan,
  });

  let notifications: number | string = "désactivées dans les réglages";
  if (notify) {
    try {
      notifications = await sendWishlistNotifications(supabase);
    } catch (err) {
      notifications = `erreur : ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return {
    priceHistory: historyError ? historyError.message : (priceRecords as number),
    purged: purgeError ? purgeError.message : (purged as number),
    notifications,
  };
}

async function upsertAll(supabase: SupabaseClient, deals: DealInput[], startedAt: string) {
  const rows = deals.map((d) => ({ ...d, last_seen_at: startedAt }));
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from("deals")
      .upsert(rows.slice(i, i + CHUNK), { onConflict: "source,external_id" });
    if (error) throw new Error(error.message);
  }
  return rows.length;
}

/** Jeux mobiles (Google Play / App Store), vérifiés sur les boutiques officielles. */
async function syncMobile(supabase: SupabaseClient, startedAt: string, keep: (d: DealInput) => boolean) {
  const { deals, errors } = await fetchMobileDeals();
  const count = await upsertAll(supabase, deals.filter(keep), startedAt);

  // Retire les promos mobiles plus annoncées ou terminées, uniquement pour les plateformes lues avec succès.
  const okPrefixes = [
    !errors.some((e) => e.startsWith("Android")) && "android:",
    !errors.some((e) => e.startsWith("iOS")) && "ios:",
  ].filter(Boolean) as string[];
  for (const prefix of okPrefixes) {
    await supabase
      .from("deals")
      .delete()
      .eq("source", "community")
      .like("external_id", `${prefix}%`)
      .lt("last_seen_at", startedAt);
  }
  if (errors.length && okPrefixes.length === 0) throw new Error(errors.join(" ; "));
  return { count, warning: errors.length ? errors.join(" ; ") : undefined };
}

/** Retire les promos d'une source plus vues lors de cette synchro, avec ou sans un préfixe d'identifiant. */
async function removeStale(
  supabase: SupabaseClient,
  source: string,
  startedAt: string,
  mode: "only" | "except",
  prefix: string,
) {
  const query = supabase.from("deals").delete().eq("source", source).lt("last_seen_at", startedAt);
  const { error } = await (mode === "only"
    ? query.like("external_id", `${prefix}%`)
    : query.not("external_id", "like", `${prefix}%`));
  if (error) throw new Error(error.message);
}

function dedupe(deals: DealInput[]) {
  return [...new Map(deals.map((d) => [d.external_id, d])).values()];
}
