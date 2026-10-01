import { requireAdmin } from "@/lib/admin";
import { getAuditLog } from "@/lib/settings";
import { clearAuditLogAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/AdminForm";
import { Empty, PageHeader, fullDate, timeAgo } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminJournalPage() {
  await requireAdmin();
  const log = await getAuditLog();

  // Regroupement par jour (heure de Paris).
  const days = new Map<string, typeof log>();
  for (const e of log) {
    const day = new Date(e.at).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Paris",
    });
    days.set(day, [...(days.get(day) ?? []), e]);
  }

  return (
    <>
      <PageHeader
        title="Journal"
        description={`Les ${log.length} dernières actions faites depuis le panel (300 conservées).`}
        actions={
          log.length > 0 && (
            <ActionButton action={clearAuditLogAction} confirm="Vider le journal ?" variant="danger" className="py-2">
              Vider le journal
            </ActionButton>
          )
        }
      />

      {log.length === 0 ? (
        <div className="card">
          <Empty>Aucune action enregistrée.</Empty>
        </div>
      ) : (
        [...days].map(([day, entries]) => (
          <section key={day}>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase first-letter:uppercase">
              {day}
            </h2>
            <ol className="card divide-y divide-border">
              {entries.map((e, i) => (
                <li
                  key={`${e.at}-${i}`}
                  className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:gap-3 sm:px-5"
                >
                  <time
                    dateTime={e.at}
                    title={fullDate(e.at)}
                    className="w-24 shrink-0 text-xs text-muted tabular-nums"
                  >
                    {new Date(e.at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Paris",
                    })}
                    <span className="sm:hidden"> · {timeAgo(e.at)}</span>
                  </time>
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold text-white">{e.action}</span>
                    {e.target && <span className="text-slate-300"> · {e.target}</span>}
                    {e.details && <span className="text-muted"> ({e.details})</span>}
                  </p>
                  <span className="truncate text-xs text-muted">{e.admin}</span>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </>
  );
}
