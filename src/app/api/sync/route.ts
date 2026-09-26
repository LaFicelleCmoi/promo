import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCheapSharkDeals } from "@/lib/sources/cheapshark";
import { fetchEpicDeals } from "@/lib/sources/epic";
import { fetchNintendoDeals } from "@/lib/sources/nintendo";
import type { DealInput, DealSource } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOURCES: Record<Exclude<DealSource, "community">, () => Promise<DealInput[]>> = {
  cheapshark: fetchCheapSharkDeals,
  epic: fetchEpicDeals,
  nintendo: fetchNintendoDeals,
};

const CHUNK = 500;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();
  const report: Record<string, number | string> = {};
  const synced: string[] = [];

  await Promise.all(
    Object.entries(SOURCES).map(async ([name, fetchDeals]) => {
      try {
        const deals = dedupe(await fetchDeals()).map((d) => ({ ...d, last_seen_at: startedAt }));
        for (let i = 0; i < deals.length; i += CHUNK) {
          const { error } = await supabase
            .from("deals")
            .upsert(deals.slice(i, i + CHUNK), { onConflict: "source,external_id" });
          if (error) throw new Error(error.message);
        }
        report[name] = deals.length;
        synced.push(name);
      } catch (err) {
        report[name] = `erreur : ${err instanceof Error ? err.message : String(err)}`;
      }
    }),
  );

  // On ne purge que les sources synchronisées avec succès.
  const { data: purged, error } = await supabase.rpc("purge_stale_deals", {
    synced_sources: synced,
    older_than: startedAt,
  });

  return NextResponse.json({ ok: true, report, purged: error ? error.message : purged });
}

function dedupe(deals: DealInput[]) {
  return [...new Map(deals.map((d) => [d.external_id, d])).values()];
}
