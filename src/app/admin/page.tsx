import Link from "next/link";
import { countDealsBySource, isAdmin, isBanned, listAllUsers, pushDevices, requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuditLog, getLastSync, getFreshSettings } from "@/lib/settings";
import { SYNC_SOURCE_LABELS, type SyncSource } from "@/lib/sources/catalog";
import { parseProfile } from "@/lib/profile";
import { PLATFORM_LABELS, isPlatform } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Empty, PageHeader, Pill, Section, Stat, fullDate, nf, timeAgo } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const WEEK = 7 * 86400_000;

export default async function AdminDashboard() {
  await requireAdmin();
  const admin = createAdminClient();

  const [users, bySource, wishlist, stores, alerts, history, settings, lastSync, audit] = await Promise.all([
    listAllUsers(),
    countDealsBySource(),
    admin.from("wishlist").select("title, user_id"),
    admin.from("deal_stores").select("platform, deals"),
    admin.from("alert_log").select("deal_id", { count: "exact", head: true }),
    admin.from("price_history").select("price", { count: "exact", head: true }),
    getFreshSettings(),
    getLastSync(),
    getAuditLog(),
  ]);

  const now = Date.now();
  const newUsers = users.filter((u) => now - new Date(u.created_at).getTime() < WEEK).length;
  const active = users.filter((u) => u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < WEEK).length;
  const devices = users.reduce((n, u) => n + pushDevices(u), 0);
  const withPush = users.filter((u) => pushDevices(u) > 0).length;
  const totalDeals = Object.values(bySource).reduce((a, b) => a + b, 0);

  const wishRows = (wishlist.data ?? []) as { title: string; user_id: string }[];
  const topGames = [
    ...wishRows
      .reduce((m, w) => {
        const key = w.title.trim().toLowerCase();
        const e = m.get(key) ?? { title: w.title.trim(), users: new Set<string>() };
        e.users.add(w.user_id);
        return m.set(key, e);
      }, new Map<string, { title: string; users: Set<string> }>())
      .values(),
  ]
    .sort((a, b) => b.users.size - a.users.size)
    .slice(0, 8);

  const platformCounts: Record<string, number> = {};
  for (const r of (stores.data ?? []) as { platform: string; deals: number }[]) {
    platformCounts[r.platform] = (platformCounts[r.platform] ?? 0) + r.deals;
  }

  const sourceRows = (Object.entries(bySource) as [SyncSource | "community", number][]).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sourceRows.map(([, n]) => n));

  const status: { label: string; good: boolean }[] = [
    {
      label: settings.maintenance.enabled ? "Maintenance active" : "Site en ligne",
      good: !settings.maintenance.enabled,
    },
    { label: settings.signupsOpen ? "Inscriptions ouvertes" : "Inscriptions fermées", good: settings.signupsOpen },
    {
      label: settings.communityDealsOpen ? "Propositions ouvertes" : "Propositions fermées",
      good: settings.communityDealsOpen,
    },
    { label: settings.syncEnabled ? "Synchro auto active" : "Synchro auto en pause", good: settings.syncEnabled },
    {
      label: settings.pushAlertsEnabled ? "Alertes wishlist actives" : "Alertes wishlist coupées",
      good: settings.pushAlertsEnabled,
    },
    { label: settings.announcement.enabled ? "Annonce affichée" : "Aucune annonce", good: true },
  ];

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const syncErrors = lastSync ? Object.values(lastSync.sources).filter((s) => !s.ok).length : 0;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de Promo Tracker : comptes, promos, synchro et état du site."
        actions={
          <>
            <Link href="/admin/synchro" className="btn-primary py-2">
              Lancer une synchro
            </Link>
            <Link href="/admin/reglages" className="btn-ghost py-2">
              Réglages
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Utilisateurs"
          value={nf.format(users.length)}
          hint={`+${newUsers} cette semaine · ${active} actifs`}
          href="/admin/utilisateurs"
        />
        <Stat
          label="Promos en ligne"
          value={nf.format(totalDeals)}
          hint={`${nf.format(history.count ?? 0)} relevés de prix`}
          href="/admin/promos"
        />
        <Stat
          label="Jeux suivis"
          value={nf.format(wishRows.length)}
          hint={`${nf.format(alerts.count ?? 0)} alertes envoyées`}
        />
        <Stat
          label="Appareils notifiés"
          value={nf.format(devices)}
          hint={`${withPush} utilisateur${withPush > 1 ? "s" : ""}`}
          href="/admin/notifications"
        />
      </div>

      <Section
        title="État du site"
        actions={
          <Link href="/admin/reglages" className="text-xs font-semibold text-accent hover:text-accent-hover">
            Modifier ›
          </Link>
        }
      >
        <div className="flex flex-wrap gap-2">
          {status.map((s) => (
            <Pill key={s.label} tone={s.good ? "good" : "warn"}>
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.good ? "bg-deal" : "bg-amber-300"}`} />
              {s.label}
            </Pill>
          ))}
          {settings.disabledSources.length > 0 && (
            <Pill tone="warn">{settings.disabledSources.length} source(s) désactivée(s)</Pill>
          )}
          {settings.blockedDeals.length > 0 && <Pill>{settings.blockedDeals.length} promo(s) masquée(s)</Pill>}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title="Dernière synchronisation"
          description={
            lastSync
              ? `${fullDate(lastSync.finishedAt)} · ${lastSync.trigger === "cron" ? "automatique" : "manuelle"} · ${Math.round(
                  (new Date(lastSync.finishedAt).getTime() - new Date(lastSync.startedAt).getTime()) / 1000,
                )} s`
              : "Aucune synchro enregistrée depuis l'ouverture du panel."
          }
          actions={
            lastSync && (
              <Pill tone={syncErrors ? "bad" : "good"}>{syncErrors ? `${syncErrors} erreur(s)` : "Tout est OK"}</Pill>
            )
          }
        >
          {lastSync ? (
            <ul className="divide-y divide-border text-sm">
              {(
                Object.entries(lastSync.sources) as [SyncSource, NonNullable<(typeof lastSync.sources)[SyncSource]>][]
              ).map(([s, r]) => (
                <li key={s} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-slate-200">{SYNC_SOURCE_LABELS[s]}</span>
                  {r.ok ? (
                    <span className="shrink-0 font-semibold text-deal tabular-nums">{nf.format(r.count)}</span>
                  ) : (
                    <span className="truncate text-xs text-danger" title={r.error}>
                      {r.error}
                    </span>
                  )}
                </li>
              ))}
              <li className="flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-muted">
                <span>Prix relevés : {String(lastSync.priceHistory ?? "—")}</span>
                <span>Purgées : {String(lastSync.purged ?? "—")}</span>
                <span>Notifiés : {String(lastSync.notifications ?? "—")}</span>
              </li>
            </ul>
          ) : (
            <Empty>
              <Link href="/admin/synchro" className="text-accent hover:underline">
                Lancer une synchro maintenant
              </Link>
            </Empty>
          )}
        </Section>

        <Section title="Promos par source" description={`${nf.format(totalDeals)} promos en base`}>
          <ul className="space-y-2.5">
            {sourceRows.map(([s, n]) => (
              <li key={s}>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{s === "community" ? "Communauté" : SYNC_SOURCE_LABELS[s]}</span>
                  <span className="font-semibold text-white tabular-nums">{nf.format(n)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(n / maxSource) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
            {Object.entries(platformCounts)
              .filter(([p]) => isPlatform(p))
              .sort((a, b) => b[1] - a[1])
              .map(([p, n]) => (
                <Link key={p} href={`/admin/promos?platform=${p}`}>
                  <Pill>
                    {PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS]} · {nf.format(n)}
                  </Pill>
                </Link>
              ))}
          </div>
        </Section>

        <Section title="Jeux les plus suivis" description="Titres les plus présents dans les wishlists">
          {topGames.length ? (
            <ol className="space-y-2 text-sm">
              {topGames.map((g, i) => (
                <li key={g.title} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs font-bold text-muted tabular-nums">{i + 1}</span>
                  <Link
                    href={`/admin/promos?q=${encodeURIComponent(g.title)}`}
                    className="flex-1 truncate text-slate-200 hover:text-white"
                  >
                    {g.title}
                  </Link>
                  <Pill tone="accent">
                    {g.users.size} suiveur{g.users.size > 1 ? "s" : ""}
                  </Pill>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>Aucun jeu en wishlist pour l&apos;instant.</Empty>
          )}
        </Section>

        <Section
          title="Derniers inscrits"
          actions={
            <Link href="/admin/utilisateurs" className="text-xs font-semibold text-accent hover:text-accent-hover">
              Tous ›
            </Link>
          }
        >
          <ul className="space-y-1">
            {recentUsers.map((u) => {
              const p = parseProfile(u.user_metadata, u.email?.split("@")[0]);
              return (
                <li key={u.id}>
                  <Link
                    href={`/admin/utilisateurs/${u.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-2"
                  >
                    <Avatar avatar={p.avatar} name={p.username} size={32} rounded="rounded-lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{p.username}</span>
                      <span className="block truncate text-xs text-muted">{u.email}</span>
                    </span>
                    {isAdmin(u) && <Pill tone="warn">Admin</Pill>}
                    {isBanned(u) && <Pill tone="bad">Suspendu</Pill>}
                    <span className="shrink-0 text-xs text-muted">{timeAgo(u.created_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <Section
        title="Activité admin récente"
        actions={
          <Link href="/admin/journal" className="text-xs font-semibold text-accent hover:text-accent-hover">
            Journal complet ›
          </Link>
        }
      >
        {audit.length ? (
          <ul className="divide-y divide-border text-sm">
            {audit.slice(0, 6).map((e, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-2">
                <span className="font-semibold text-white">{e.action}</span>
                {e.target && <span className="truncate text-slate-300">· {e.target}</span>}
                <span className="ml-auto text-xs text-muted">{timeAgo(e.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucune action pour l&apos;instant.</Empty>
        )}
      </Section>
    </>
  );
}
