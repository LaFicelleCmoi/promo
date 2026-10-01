import Link from "next/link";
import { isAdmin, listAllUsers, pushDevices, requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreshSettings } from "@/lib/settings";
import { isPushConfigured } from "@/lib/push/webpush";
import { parseProfile } from "@/lib/profile";
import { broadcastNotification, resetAlertLog, runTaskAction } from "@/app/admin/actions";
import { Avatar } from "@/components/Avatar";
import { ActionButton, AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { Empty, PageHeader, Pill, Section, Stat, nf } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const [users, settings, alerts] = await Promise.all([
    listAllUsers(),
    getFreshSettings(),
    createAdminClient().from("alert_log").select("deal_id", { count: "exact", head: true }),
  ]);
  const subscribed = users.filter((u) => pushDevices(u) > 0);
  const devices = subscribed.reduce((n, u) => n + pushDevices(u), 0);
  const admins = subscribed.filter((u) => isAdmin(u)).length;
  const configured = isPushConfigured();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Notifications système (Web Push) : alertes de wishlist automatiques et annonces envoyées à la main."
      />

      {!configured && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          Clés VAPID absentes : aucune notification ne peut partir.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Utilisateurs abonnés"
          value={nf.format(subscribed.length)}
          hint={`sur ${nf.format(users.length)} comptes`}
        />
        <Stat label="Appareils" value={nf.format(devices)} />
        <Stat label="Alertes envoyées" value={nf.format(alerts.count ?? 0)} hint="promos déjà signalées" />
        <Stat
          label="Alertes wishlist"
          value={settings.pushAlertsEnabled ? "Actives" : "Coupées"}
          tone={settings.pushAlertsEnabled ? "good" : "warn"}
          href="/admin/reglages#notifications"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Section title="Envoyer une annonce" description="Une notification système sur chaque appareil abonné.">
          <AdminForm
            action={broadcastNotification}
            confirm="Envoyer cette notification maintenant ?"
            resetOnSuccess
            className="space-y-3"
          >
            <div>
              <label htmlFor="b-title" className="label">
                Titre
              </label>
              <input
                id="b-title"
                name="title"
                required
                maxLength={80}
                placeholder="🎮 Soldes d'automne sur Steam"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="b-body" className="label">
                Message
              </label>
              <textarea
                id="b-body"
                name="body"
                required
                maxLength={200}
                rows={3}
                placeholder="Des milliers de jeux à prix cassés jusqu'au 7 octobre."
                className="input"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="b-url" className="label">
                  Lien à l&apos;ouverture
                </label>
                <input id="b-url" name="url" placeholder="/?sort=discount" className="input" />
              </div>
              <div>
                <label htmlFor="b-target" className="label">
                  Destinataires
                </label>
                <select id="b-target" name="target" className="input">
                  <option value="all">Tous les abonnés ({subscribed.length})</option>
                  <option value="admins">Admins seulement — test ({admins})</option>
                </select>
              </div>
            </div>
            <SubmitButton
              variant="primary"
              disabled={!configured || subscribed.length === 0}
              pendingLabel="Envoi…"
              className="py-2.5"
            >
              Envoyer
            </SubmitButton>
          </AdminForm>
        </Section>

        <div className="space-y-6">
          <Section title="Alertes de wishlist">
            <div className="space-y-3 text-sm">
              <ActionButton
                action={runTaskAction}
                hidden={{ task: "notify" }}
                pendingLabel="Envoi…"
                className="w-full py-2"
              >
                Envoyer les alertes en attente
              </ActionButton>
              <ActionButton
                action={resetAlertLog}
                confirm="Effacer l'historique ? Les promos en cours pourront être notifiées une nouvelle fois."
                variant="danger"
                className="w-full py-2"
              >
                Effacer l&apos;historique des alertes
              </ActionButton>
            </div>
          </Section>

          <Section title="Abonnés">
            {subscribed.length ? (
              <ul className="-my-1 space-y-1">
                {subscribed.map((u) => {
                  const p = parseProfile(u.user_metadata, u.email?.split("@")[0]);
                  return (
                    <li key={u.id}>
                      <Link
                        href={`/admin/utilisateurs/${u.id}`}
                        className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2"
                      >
                        <Avatar avatar={p.avatar} name={p.username} size={26} rounded="rounded-md" />
                        <span className="min-w-0 flex-1 truncate text-slate-200">{p.username}</span>
                        <Pill>{pushDevices(u)} app.</Pill>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>Personne n&apos;a encore activé les notifications.</Empty>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
