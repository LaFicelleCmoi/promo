import { requireAdmin } from "@/lib/admin";
import { getFreshSettings } from "@/lib/settings";
import { saveSiteSettings } from "@/app/admin/actions";
import { AdminForm, SubmitButton, Toggle } from "@/components/admin/AdminForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const TONES = {
  info: "Info (violet)",
  success: "Bonne nouvelle (vert)",
  warning: "Attention (orange)",
  danger: "Urgent (rouge)",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const s = await getFreshSettings();

  return (
    <>
      <PageHeader title="Réglages du site" description="Appliqués à tout le site dès l'enregistrement." />

      <AdminForm action={saveSiteSettings} className="space-y-6">
        <fieldset className="card p-4 sm:p-5">
          <legend className="sr-only">Annonce</legend>
          <h2 className="font-bold text-white">Bandeau d&apos;annonce</h2>
          <p className="text-xs text-muted">Affiché en haut de chaque page, refermable par les visiteurs.</p>
          <Toggle name="announcement_enabled" defaultChecked={s.announcement.enabled} label="Afficher l'annonce" />
          <div className="space-y-3">
            <div>
              <label htmlFor="s-msg" className="label">
                Message
              </label>
              <textarea
                id="s-msg"
                name="announcement_message"
                defaultValue={s.announcement.message}
                maxLength={280}
                rows={2}
                placeholder="Les soldes d'été Steam sont là : jusqu'à -90 % !"
                className="input"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="s-tone" className="label">
                  Couleur
                </label>
                <select id="s-tone" name="announcement_tone" defaultValue={s.announcement.tone} className="input">
                  {Object.entries(TONES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="s-link" className="label">
                  Lien (facultatif)
                </label>
                <input
                  id="s-link"
                  name="announcement_link"
                  defaultValue={s.announcement.link ?? ""}
                  placeholder="/?platform=pc"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="s-link-label" className="label">
                  Texte du lien
                </label>
                <input
                  id="s-link-label"
                  name="announcement_link_label"
                  defaultValue={s.announcement.linkLabel}
                  maxLength={40}
                  className="input"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="card p-4 sm:p-5">
          <legend className="sr-only">Accès</legend>
          <h2 className="font-bold text-white">Accès au site</h2>
          <div className="divide-y divide-border">
            <Toggle
              name="maintenance_enabled"
              defaultChecked={s.maintenance.enabled}
              label="Mode maintenance"
              description="Le site affiche une page de maintenance à tout le monde, sauf aux admins (connexion toujours possible)."
            />
            <div className="pb-3">
              <label htmlFor="s-maint" className="label">
                Message de maintenance
              </label>
              <textarea
                id="s-maint"
                name="maintenance_message"
                defaultValue={s.maintenance.message}
                maxLength={400}
                rows={2}
                className="input"
              />
            </div>
            <Toggle
              name="signups_open"
              defaultChecked={s.signupsOpen}
              label="Inscriptions ouvertes"
              description="Fermées : la page d'inscription l'indique et refuse les nouveaux comptes (tu peux toujours en créer depuis le panel)."
            />
            <Toggle
              name="community_open"
              defaultChecked={s.communityDealsOpen}
              label="Propositions de promos ouvertes"
              description="Fermées : seuls les admins peuvent publier une promo."
            />
          </div>
        </fieldset>

        <fieldset className="card p-4 sm:p-5">
          <legend className="sr-only">Automatisation</legend>
          <h2 className="font-bold text-white">Automatisation</h2>
          <div className="divide-y divide-border">
            <div id="synchro" className="scroll-mt-24">
              <Toggle
                name="sync_enabled"
                defaultChecked={s.syncEnabled}
                label="Synchro quotidienne"
                description="En pause : le cron de 6 h n'importe plus rien (la synchro manuelle reste possible)."
              />
            </div>
            <div id="notifications" className="scroll-mt-24">
              <Toggle
                name="push_alerts"
                defaultChecked={s.pushAlertsEnabled}
                label="Alertes de wishlist automatiques"
                description="Notifications système envoyées après chaque synchro quand un jeu suivi passe en promo."
              />
            </div>
          </div>
        </fieldset>

        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex justify-end rounded-xl border border-border bg-surface/90 p-3 backdrop-blur md:bottom-4">
          <SubmitButton variant="primary" pendingLabel="Enregistrement…" className="w-full py-2.5 sm:w-auto">
            Enregistrer les réglages
          </SubmitButton>
        </div>
      </AdminForm>
    </>
  );
}
