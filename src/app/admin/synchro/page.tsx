import Link from "next/link";
import { countDealsBySource, requireAdmin } from "@/lib/admin";
import { getLastSync, getFreshSettings } from "@/lib/settings";
import { SYNC_SOURCES, SYNC_SOURCE_LABELS } from "@/lib/sources/catalog";
import { clearSourceDeals, runSyncAction, runTaskAction, toggleSourceAction } from "@/app/admin/actions";
import { ActionButton, AdminForm, SubmitButton, SwitchForm } from "@/components/admin/AdminForm";
import { PageHeader, Pill, Section, fullDate, nf, timeAgo } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
// Les Server Actions de la page (synchro manuelle) héritent de cette durée maximale.
export const maxDuration = 60;

export default async function AdminSyncPage() {
  await requireAdmin();
  const [settings, lastSync, counts] = await Promise.all([getFreshSettings(), getLastSync(), countDealsBySource()]);

  return (
    <>
      <PageHeader
        title="Synchro & sources"
        description="Les promos sont importées chaque jour à 6 h (UTC). Lance une synchro, coupe une source ou vide-la."
        actions={
          <ActionButton
            action={runSyncAction}
            hidden={{ source: "all" }}
            variant="primary"
            pendingLabel="Synchro en cours… (≈ 30 s)"
            className="py-2"
          >
            Tout synchroniser maintenant
          </ActionButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Pill tone={settings.syncEnabled ? "good" : "warn"}>
          {settings.syncEnabled ? "Synchro quotidienne active" : "Synchro quotidienne en pause"}
        </Pill>
        {lastSync && (
          <span className="text-muted">
            Dernière : {fullDate(lastSync.finishedAt)} ({lastSync.trigger === "cron" ? "auto" : "manuelle"})
          </span>
        )}
        <Link href="/admin/reglages#synchro" className="text-xs font-semibold text-accent hover:text-accent-hover">
          Mettre en pause ›
        </Link>
      </div>

      <Section
        title="Sources"
        description="Une source désactivée n'est plus importée par la synchro quotidienne ; ses promos expirent d'elles-mêmes."
      >
        <ul className="-my-2 divide-y divide-border">
          {SYNC_SOURCES.map((s) => {
            const enabled = !settings.disabledSources.includes(s);
            const last = lastSync?.sources[s];
            return (
              <li key={s} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <SwitchForm
                  action={toggleSourceAction}
                  hidden={{ source: s }}
                  on={enabled}
                  label={`Activer ${SYNC_SOURCE_LABELS[s]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${enabled ? "text-white" : "text-muted line-through"}`}>
                    {SYNC_SOURCE_LABELS[s]}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {nf.format(counts[s])} promos en base
                    {last &&
                      (last.ok
                        ? ` · ${nf.format(last.count)} importées ${timeAgo(lastSync!.finishedAt)} en ${(last.ms / 1000).toFixed(1)} s`
                        : "")}
                  </p>
                  {last && (last.error || !last.ok) && (
                    <p className={`truncate text-xs ${last.ok ? "text-amber-300" : "text-danger"}`} title={last.error}>
                      {last.error}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <ActionButton
                    action={runSyncAction}
                    hidden={{ source: s }}
                    pendingLabel="…"
                    className="px-2.5 py-1 text-xs"
                  >
                    Synchroniser
                  </ActionButton>
                  <ActionButton
                    action={clearSourceDeals}
                    hidden={{ source: s }}
                    confirm={`Supprimer les ${counts[s]} promos ${SYNC_SOURCE_LABELS[s]} ?`}
                    variant="danger"
                    disabled={counts[s] === 0}
                    className="px-2.5 py-1 text-xs"
                  >
                    Vider
                  </ActionButton>
                </div>
              </li>
            );
          })}
          <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <span className="w-11" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">Communauté (proposées par les membres)</p>
              <p className="text-xs text-muted">
                {nf.format(counts.community)} promos · gérées depuis l&apos;onglet Promos
              </p>
            </div>
            <ActionButton
              action={clearSourceDeals}
              hidden={{ source: "community" }}
              confirm={`Supprimer les ${counts.community} promos proposées par les membres ? Elles ne reviendront pas.`}
              variant="danger"
              disabled={counts.community === 0}
              className="px-2.5 py-1 text-xs"
            >
              Vider
            </ActionButton>
          </li>
        </ul>
      </Section>

      <Section
        title="Tâches de maintenance"
        description="Exécutées automatiquement après chaque synchro ; lançables ici à la demande."
      >
        <AdminForm action={runTaskAction} className="grid gap-3 sm:grid-cols-3">
          {[
            ["prices", "Relever les prix", "Ajoute le relevé du jour à l'historique et met à jour les plus bas prix."],
            ["purge", "Purger les expirées", "Supprime les promos terminées depuis plus d'un jour."],
            ["notify", "Envoyer les alertes", "Notifie les wishlists des promos pas encore signalées."],
          ].map(([task, title, desc]) => (
            <div
              key={task}
              className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-surface-2/40 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-muted">{desc}</p>
              </div>
              <SubmitButton name="task" value={task} className="py-1.5 text-xs">
                Lancer
              </SubmitButton>
            </div>
          ))}
        </AdminForm>
      </Section>
    </>
  );
}
