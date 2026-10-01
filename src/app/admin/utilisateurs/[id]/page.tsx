import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, isBanned, pushDevices, requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACCENTS, bannerBackground, parseProfile } from "@/lib/profile";
import { formatPrice } from "@/lib/format";
import { PLATFORM_LABELS, type Deal, type WishlistItem } from "@/lib/types";
import {
  banUser,
  clearUserDevices,
  clearUserWishlist,
  confirmUserEmail,
  deleteUserAction,
  deleteWishlistItem,
  resetUserProfile,
  sendUserNotification,
  setUserRole,
  updateUserAccount,
} from "@/app/admin/actions";
import { Avatar } from "@/components/Avatar";
import { StoreBadge } from "@/components/StoreBadge";
import { ActionButton, AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { Empty, Pill, Section, fullDate, timeAgo } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const admin = createAdminClient();
  const [{ data: auth }, wishlist, deals] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("wishlist").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    admin.from("deals").select("*").eq("created_by", id).order("created_at", { ascending: false }).limit(50),
  ]);
  const user = auth.user;
  if (!user) notFound();

  const p = parseProfile(user.user_metadata, user.email?.split("@")[0]);
  const self = user.id === me.id;
  const banned = isBanned(user);
  const wish = (wishlist.data ?? []) as WishlistItem[];
  const proposed = (deals.data ?? []) as Deal[];
  const devices = (
    Array.isArray(user.app_metadata?.push_subscriptions) ? user.app_metadata.push_subscriptions : []
  ) as {
    endpoint: string;
  }[];

  const infos: [string, React.ReactNode][] = [
    [
      "Identifiant",
      <code key="id" className="text-xs">
        {user.id}
      </code>,
    ],
    ["Email", user.email],
    ["Email confirmé", user.email_confirmed_at ? fullDate(user.email_confirmed_at) : "Non"],
    ["Inscription", fullDate(user.created_at)],
    ["Dernière connexion", `${fullDate(user.last_sign_in_at)} (${timeAgo(user.last_sign_in_at)})`],
    ["Rôle", isAdmin(user) ? "Administrateur" : "Membre"],
    ["Suspension", banned ? `jusqu'au ${fullDate(user.banned_until)}` : "Aucune"],
    ["Plateformes favorites", p.platforms.map((x) => PLATFORM_LABELS[x]).join(", ") || "—"],
    [
      "Apparence",
      `${ACCENTS[p.accent].label} · ${p.density === "compact" ? "compacte" : "confortable"}${p.reduceMotion ? " · sans animations" : ""}`,
    ],
  ];

  return (
    <>
      <Link href="/admin/utilisateurs" className="text-sm text-muted hover:text-white">
        ← Tous les utilisateurs
      </Link>

      <div className="card overflow-hidden">
        <div className="h-24 sm:h-28" style={bannerBackground(p.banner.gradient, p.banner.pattern)} />
        <div className="flex flex-col gap-3 px-4 pb-5 sm:flex-row sm:items-end sm:px-6">
          <Avatar
            avatar={p.avatar}
            name={p.username}
            size={84}
            rounded="rounded-2xl"
            className="-mt-10 ring-4 ring-surface"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold">{p.username}</h1>
              {isAdmin(user) && <Pill tone="warn">Admin</Pill>}
              {banned && <Pill tone="bad">Suspendu</Pill>}
              {self && <Pill tone="accent">C&apos;est toi</Pill>}
            </div>
            <p className="text-sm text-muted">
              {user.email}
              {p.title && <> · {p.title}</>}
            </p>
            {p.bio && <p className="mt-1 text-sm text-slate-300">{p.bio}</p>}
          </div>
          <div className="flex gap-4 text-center text-xs">
            {[
              ["Wishlist", wish.length],
              ["Promos", proposed.length],
              ["Appareils", pushDevices(user)],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xl font-black text-white tabular-nums">{v}</p>
                <p className="text-muted">{k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Informations">
          <dl className="-my-2 divide-y divide-border text-sm">
            {infos.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="min-w-0 truncate text-right text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section
          title="Rôle et accès"
          description={self ? "Tu ne peux pas retirer tes propres droits ni te suspendre." : undefined}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-300">
                {isAdmin(user) ? "Accès complet au panel admin." : "Membre : aucun accès au panel."}
              </p>
              <ActionButton
                action={setUserRole}
                hidden={{ id: user.id, role: isAdmin(user) ? "user" : "admin" }}
                disabled={self}
                confirm={isAdmin(user) ? "Retirer le rôle admin ?" : `Donner TOUS les droits admin à ${user.email} ?`}
                variant={isAdmin(user) ? "ghost" : "primary"}
                className="py-2"
              >
                {isAdmin(user) ? "Retirer le rôle admin" : "Promouvoir admin"}
              </ActionButton>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-sm font-semibold text-white">
                {banned ? "Compte suspendu" : "Suspendre le compte"}
              </p>
              {banned ? (
                <ActionButton
                  action={banUser}
                  hidden={{ id: user.id, duration: "none" }}
                  variant="primary"
                  className="py-2"
                >
                  Lever la suspension
                </ActionButton>
              ) : (
                <AdminForm
                  action={banUser}
                  hidden={{ id: user.id }}
                  confirm="Suspendre ce compte ? Il ne pourra plus se connecter."
                  className="flex flex-wrap gap-2"
                >
                  {[
                    ["24h", "24 h"],
                    ["168h", "7 jours"],
                    ["720h", "30 jours"],
                    ["876000h", "Définitivement"],
                  ].map(([v, l]) => (
                    <SubmitButton
                      key={v}
                      name="duration"
                      value={v}
                      variant="danger"
                      disabled={self}
                      className="py-1.5 text-xs"
                    >
                      {l}
                    </SubmitButton>
                  ))}
                </AdminForm>
              )}
            </div>

            {!user.email_confirmed_at && (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-slate-300">Email pas encore confirmé.</p>
                <ActionButton action={confirmUserEmail} hidden={{ id: user.id }} className="py-2">
                  Confirmer l&apos;email
                </ActionButton>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Modifier le compte"
          description="Le nouvel email est confirmé d'office. Laisse le mot de passe vide pour le garder."
        >
          <AdminForm action={updateUserAccount} hidden={{ id: user.id }} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ua-username" className="label">
                  Pseudo
                </label>
                <input
                  id="ua-username"
                  name="username"
                  defaultValue={p.username}
                  minLength={3}
                  maxLength={30}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="ua-email" className="label">
                  Email
                </label>
                <input id="ua-email" name="email" type="email" defaultValue={user.email} className="input" />
              </div>
            </div>
            <div>
              <label htmlFor="ua-password" className="label">
                Nouveau mot de passe
              </label>
              <input
                id="ua-password"
                name="password"
                type="text"
                minLength={8}
                autoComplete="off"
                placeholder="Inchangé"
                className="input"
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <SubmitButton variant="primary" pendingLabel="Enregistrement…" className="py-2">
                Enregistrer
              </SubmitButton>
            </div>
          </AdminForm>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-slate-300">Avatar, bannière, bio, titre et apparence par défaut.</p>
            <ActionButton
              action={resetUserProfile}
              hidden={{ id: user.id }}
              confirm="Réinitialiser le profil (la photo d'avatar sera supprimée) ?"
              className="py-2"
            >
              Réinitialiser le profil
            </ActionButton>
          </div>
        </Section>

        <Section
          title="Notifications"
          description={
            devices.length
              ? `${devices.length} appareil(s) : ${[...new Set(devices.map((d) => new URL(d.endpoint).hostname))].join(", ")}`
              : "Aucun appareil abonné."
          }
          actions={
            devices.length > 0 && (
              <ActionButton
                action={clearUserDevices}
                hidden={{ id: user.id }}
                confirm="Désabonner tous les appareils de ce compte ?"
                className="px-2.5 py-1 text-xs"
              >
                Retirer les appareils
              </ActionButton>
            )
          }
        >
          <AdminForm action={sendUserNotification} hidden={{ id: user.id }} resetOnSuccess className="space-y-3">
            <input name="title" required maxLength={80} placeholder="Titre" aria-label="Titre" className="input" />
            <textarea
              name="body"
              required
              maxLength={200}
              rows={2}
              placeholder="Message"
              aria-label="Message"
              className="input"
            />
            <input name="url" placeholder="Lien à l'ouverture (ex. /wishlist)" aria-label="Lien" className="input" />
            <SubmitButton disabled={devices.length === 0} pendingLabel="Envoi…" className="py-2">
              Envoyer une notification
            </SubmitButton>
          </AdminForm>
        </Section>
      </div>

      <Section
        title={`Wishlist (${wish.length})`}
        actions={
          wish.length > 0 && (
            <ActionButton
              action={clearUserWishlist}
              hidden={{ id: user.id }}
              confirm={`Vider la wishlist (${wish.length} jeux) ?`}
              variant="danger"
              className="px-2.5 py-1 text-xs"
            >
              Tout vider
            </ActionButton>
          )
        }
      >
        {wish.length ? (
          <ul className="-my-2 divide-y divide-border">
            {wish.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-slate-200">{w.title}</span>
                <span className="hidden text-xs text-muted sm:inline">
                  {w.platform ? PLATFORM_LABELS[w.platform] : "Toutes plateformes"}
                  {w.target_price !== null && ` · ≤ ${formatPrice(w.target_price, "EUR")}`}
                  {!w.notify && " · alertes coupées"}
                </span>
                <ActionButton
                  action={deleteWishlistItem}
                  hidden={{ id: w.id }}
                  aria-label={`Retirer ${w.title}`}
                  className="px-2 py-1 text-xs"
                >
                  Retirer
                </ActionButton>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Wishlist vide.</Empty>
        )}
      </Section>

      <Section title={`Promos proposées (${proposed.length})`}>
        {proposed.length ? (
          <ul className="-my-2 divide-y divide-border">
            {proposed.map((d) => (
              <li key={d.id}>
                <Link href={`/admin/promos/${d.id}`} className="flex items-center gap-3 py-2 text-sm hover:text-white">
                  <span className="min-w-0 flex-1 truncate text-slate-200">{d.title}</span>
                  <StoreBadge store={d.store} />
                  <span className="font-semibold text-deal">{formatPrice(d.sale_price, d.currency)}</span>
                  <span className="hidden text-xs text-muted sm:inline">{timeAgo(d.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucune promo proposée.</Empty>
        )}
      </Section>

      <details className="card overflow-hidden">
        <summary className="cursor-pointer px-4 py-3.5 text-sm font-semibold text-white sm:px-5">
          Données brutes du compte
        </summary>
        <pre className="max-h-96 overflow-auto border-t border-border bg-bg/60 p-4 text-xs leading-relaxed text-slate-300">
          {JSON.stringify(
            {
              user_metadata: user.user_metadata,
              app_metadata: {
                ...user.app_metadata,
                push_subscriptions: devices.map((d) => `${new URL(d.endpoint).hostname}/…`),
              },
              identities: user.identities?.map((i) => ({ provider: i.provider, created_at: i.created_at })),
            },
            null,
            2,
          )}
        </pre>
      </details>

      {!self && (
        <Section
          title="Supprimer le compte"
          danger
          description="Définitif : wishlist, alertes et avatar effacés ; ses promos proposées deviennent anonymes."
        >
          <ActionButton
            action={deleteUserAction}
            hidden={{ id: user.id }}
            confirm={`Supprimer définitivement le compte ${user.email} ? Cette action est irréversible.`}
            variant="danger"
            pendingLabel="Suppression…"
            className="py-2.5"
          >
            Supprimer définitivement ce compte
          </ActionButton>
        </Section>
      )}
    </>
  );
}
