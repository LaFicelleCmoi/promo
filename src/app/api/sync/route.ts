import { NextResponse, type NextRequest } from "next/server";
import { runSync } from "@/lib/sync";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Synchronisation quotidienne (cron Vercel). Les sources, la pause et les notifications se règlent dans le panel admin. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  if (!settings.syncEnabled) {
    return NextResponse.json({ ok: true, skipped: "Synchronisation automatique en pause (panel admin)" });
  }

  const report = await runSync({ trigger: "cron" });
  return NextResponse.json({ ok: true, ...report });
}
