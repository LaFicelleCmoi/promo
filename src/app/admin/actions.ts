"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { listAllUsers, requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendToUser } from "@/lib/push/webpush";
import {
  clearAuditLog,
  getFreshSettings,
  logAdminAction,
  saveSettings,
  type AnnouncementTone,
  type SiteSettings,
} from "@/lib/settings";
import { runFollowUp, runSync } from "@/lib/sync";
import { SYNC_SOURCES, SYNC_SOURCE_LABELS, isSyncSource, type SyncSource } from "@/lib/sources/catalog";
import { computeDiscount } from "@/lib/format";
import { isPlatform } from "@/lib/types";

type Result = { ok: boolean; message: string };
export type AdminResult = Result | undefined;

const ok = (message: string): Result => ({ ok: true, message });
const fail = (message: string): Result => ({ ok: false, message });
const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const checked = (formData: FormData, name: string) => formData.get(name) === "on";

/** Vérifie le rôle, exécute l'action, l'inscrit au journal et rafraîchit le panel. */
async function adminAction(
  action: string,
  run: (admin: User) => Promise<Result & { target?: string; details?: string }>,
): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const result = await run(admin);
    if (result.ok) {
      await logAdminAction({ admin: admin.email ?? admin.id, action, target: result.target, details: result.details });
      revalidatePath("/admin", "layout");
    }
    return { ok: result.ok, message: result.message };
  } catch (err) {
    // redirect() et notFound() passent par des exceptions qu'il ne faut pas intercepter.
    if (err && typeof err === "object" && "digest" in err) throw err;
    return fail(err instanceof Error ? err.message : "Action impossible.");
  }
}

async function getTargetUser(id: string) {
  const { data, error } = await createAdminClient().auth.admin.getUserById(id);
  if (error || !data.user) throw new Error("Utilisateur introuvable.");
  return data.user;
}

const label = (u: User) => u.email ?? u.id;

// ---------------------------------------------------------------------------
// Utilisateurs
// ---------------------------------------------------------------------------
export async function createUserAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Création d'un compte", async () => {
    const email = field(formData, "email");
    const password = field(formData, "password");
    const username = field(formData, "username") || email.split("@")[0];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Adresse email invalide.");
    if (password.length < 8) return fail("Le mot de passe doit faire au moins 8 caractères.");
    const { error } = await createAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: username.slice(0, 30) },
      app_metadata: checked(formData, "admin") ? { role: "admin" } : {},
    });
    if (error) return fail(error.code === "email_exists" ? "Un compte existe déjà avec cet email." : error.message);
    return { ...ok(`Compte ${email} créé.`), target: email, details: checked(formData, "admin") ? "admin" : undefined };
  });
}

export async function setUserRole(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Changement de rôle", async (me) => {
    const id = field(formData, "id");
    const role = field(formData, "role") === "admin" ? "admin" : null;
    if (id === me.id && role !== "admin") return fail("Tu ne peux pas retirer ton propre rôle d'admin.");
    const user = await getTargetUser(id);
    const { error } = await createAdminClient().auth.admin.updateUserById(id, { app_metadata: { role } });
    if (error) return fail(error.message);
    return {
      ...ok(role ? `${label(user)} est maintenant admin.` : `${label(user)} n'est plus admin.`),
      target: label(user),
      details: role ? "→ admin" : "→ membre",
    };
  });
}

const BAN_LABELS: Record<string, string> = {
  "24h": "24 heures",
  "168h": "7 jours",
  "720h": "30 jours",
  "876000h": "définitivement",
};

export async function banUser(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Suspension", async (me) => {
    const id = field(formData, "id");
    const duration = field(formData, "duration");
    if (id === me.id) return fail("Tu ne peux pas suspendre ton propre compte.");
    if (duration !== "none" && !BAN_LABELS[duration]) return fail("Durée invalide.");
    const user = await getTargetUser(id);
    const { error } = await createAdminClient().auth.admin.updateUserById(id, { ban_duration: duration });
    if (error) return fail(error.message);
    return duration === "none"
      ? { ...ok(`${label(user)} est réactivé.`), target: label(user), details: "levée de la suspension" }
      : {
          ...ok(`${label(user)} est suspendu ${BAN_LABELS[duration]}.`),
          target: label(user),
          details: BAN_LABELS[duration],
        };
  });
}

export async function confirmUserEmail(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Confirmation d'email", async () => {
    const user = await getTargetUser(field(formData, "id"));
    const { error } = await createAdminClient().auth.admin.updateUserById(user.id, { email_confirm: true });
    if (error) return fail(error.message);
    return { ...ok("Adresse email confirmée."), target: label(user) };
  });
}

export async function updateUserAccount(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Modification d'un compte", async () => {
    const user = await getTargetUser(field(formData, "id"));
    const username = field(formData, "username");
    const email = field(formData, "email");
    const password = field(formData, "password");
    if (username.length < 3 || username.length > 30) return fail("Le pseudo doit faire entre 3 et 30 caractères.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Adresse email invalide.");
    if (password && password.length < 8) return fail("Le mot de passe doit faire au moins 8 caractères.");

    const changes: string[] = [];
    if (username !== user.user_metadata?.username) changes.push("pseudo");
    if (email !== user.email) changes.push("email");
    if (password) changes.push("mot de passe");
    if (changes.length === 0) return fail("Aucune modification.");

    const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
      user_metadata: { username },
      ...(email !== user.email ? { email, email_confirm: true } : {}),
      ...(password ? { password } : {}),
    });
    if (error) return fail(error.code === "email_exists" ? "Cet email est déjà utilisé." : error.message);
    revalidatePath("/", "layout");
    return { ...ok("Compte mis à jour."), target: label(user), details: changes.join(", ") };
  });
}

async function removeAvatarFiles(userId: string) {
  const admin = createAdminClient();
  const { data: files } = await admin.storage.from("avatars").list(userId);
  if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
}

export async function resetUserProfile(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Réinitialisation du profil", async () => {
    const user = await getTargetUser(field(formData, "id"));
    await removeAvatarFiles(user.id);
    const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
      user_metadata: { profile: null },
    });
    if (error) return fail(error.message);
    revalidatePath("/", "layout");
    return { ...ok("Profil réinitialisé (avatar, bio, apparence)."), target: label(user) };
  });
}

export async function sendUserNotification(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Notification individuelle", async () => {
    const user = await getTargetUser(field(formData, "id"));
    const title = field(formData, "title").slice(0, 80);
    const body = field(formData, "body").slice(0, 200);
    if (!title || !body) return fail("Titre et message requis.");
    const { sent, devices } = await sendToUser(createAdminClient(), user.id, {
      title,
      body,
      url: safeUrl(field(formData, "url")) ?? "/",
      tag: `admin-${Date.now()}`,
    });
    if (devices === 0) return fail("Cet utilisateur n'a activé les notifications sur aucun appareil.");
    if (sent === 0) return fail("L'envoi a échoué sur tous ses appareils.");
    return {
      ...ok(`Notification envoyée sur ${sent} appareil${sent > 1 ? "s" : ""}.`),
      target: label(user),
      details: title,
    };
  });
}

export async function clearUserDevices(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Suppression des appareils notifiés", async () => {
    const user = await getTargetUser(field(formData, "id"));
    const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
      app_metadata: { push_subscriptions: [] },
    });
    if (error) return fail(error.message);
    return { ...ok("Appareils retirés : plus aucune notification pour ce compte."), target: label(user) };
  });
}

export async function deleteWishlistItem(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Suppression d'un jeu de wishlist", async () => {
    const { data, error } = await createAdminClient()
      .from("wishlist")
      .delete()
      .eq("id", field(formData, "id"))
      .select("title")
      .maybeSingle();
    if (error || !data) return fail("Jeu introuvable.");
    return { ...ok(`« ${data.title} » retiré de la wishlist.`), target: data.title };
  });
}

export async function clearUserWishlist(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Wishlist vidée", async () => {
    const user = await getTargetUser(field(formData, "id"));
    const { error, count } = await createAdminClient()
      .from("wishlist")
      .delete({ count: "exact" })
      .eq("user_id", user.id);
    if (error) return fail(error.message);
    return { ...ok(`${count ?? 0} jeu(x) retiré(s).`), target: label(user) };
  });
}

export async function deleteUserAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const result = await adminAction("Suppression d'un compte", async (me) => {
    const id = field(formData, "id");
    if (id === me.id) return fail("Supprime ton propre compte depuis « Mon profil ».");
    const user = await getTargetUser(id);
    await removeAvatarFiles(user.id);
    const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
    if (error) return fail(error.message);
    return { ...ok(`Compte ${label(user)} supprimé.`), target: label(user) };
  });
  if (result?.ok) redirect("/admin/utilisateurs?supprime=1");
  return result;
}

// ---------------------------------------------------------------------------
// Promos
// ---------------------------------------------------------------------------
function parsePrice(value: string) {
  if (value === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

function safeUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function saveDealAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const created = { id: "" };
  const result = await adminAction(
    formData.get("id") ? "Modification d'une promo" : "Ajout d'une promo",
    async (me) => {
      const id = field(formData, "id");
      const title = field(formData, "title");
      const platform = field(formData, "platform");
      const store = field(formData, "store");
      const url = field(formData, "url");
      const imageUrl = field(formData, "image_url");
      const sale = parsePrice(field(formData, "sale_price"));
      const normal = parsePrice(field(formData, "normal_price"));
      const discountRaw = field(formData, "discount");
      const currency = field(formData, "currency").toUpperCase() || "EUR";
      const endsAt = field(formData, "ends_at");

      if (!title || title.length > 200) return fail("Titre requis (200 caractères max).");
      if (!isPlatform(platform)) return fail("Plateforme invalide.");
      if (!store || store.length > 80) return fail("Boutique requise (80 caractères max).");
      if (!/^https?:\/\//i.test(url) || !safeUrl(url)) return fail("Lien de la promo invalide.");
      if (imageUrl && (!/^https?:\/\//i.test(imageUrl) || !safeUrl(imageUrl))) return fail("Lien de l'image invalide.");
      if (sale === null || Number.isNaN(sale)) return fail("Prix promo invalide.");
      if (Number.isNaN(normal)) return fail("Prix normal invalide.");
      if (!/^[A-Z]{3}$/.test(currency)) return fail("Devise invalide (3 lettres, ex. EUR).");
      const discount = discountRaw === "" ? computeDiscount(normal, sale) : Number(discountRaw);
      if (!Number.isInteger(discount) || discount < 0 || discount > 100) return fail("Réduction invalide (0 à 100).");
      if (endsAt && Number.isNaN(Date.parse(endsAt))) return fail("Date de fin invalide.");

      const row = {
        title,
        platform,
        store,
        url,
        image_url: imageUrl || null,
        normal_price: normal,
        sale_price: sale,
        discount,
        currency,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      };
      const admin = createAdminClient();

      if (id) {
        const { error } = await admin.from("deals").update(row).eq("id", id);
        if (error) return fail(error.message);
        revalidatePath("/");
        revalidatePath(`/jeu/${id}`);
        return { ...ok("Promo enregistrée."), target: title };
      }

      const { data, error } = await admin
        .from("deals")
        .insert({ ...row, source: "community", created_by: me.id })
        .select("id")
        .single();
      if (error) return fail(error.message);
      created.id = data.id;
      revalidatePath("/");
      return { ...ok("Promo ajoutée."), target: title };
    },
  );
  if (created.id) redirect(`/admin/promos/${created.id}?cree=1`);
  return result;
}

export async function deleteDealAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const result = await adminAction("Suppression d'une promo", async () => {
    const { data, error } = await createAdminClient()
      .from("deals")
      .delete()
      .eq("id", field(formData, "id"))
      .select("title")
      .maybeSingle();
    if (error || !data) return fail("Promo introuvable.");
    revalidatePath("/");
    return { ...ok(`« ${data.title} » supprimée.`), target: data.title };
  });
  if (result?.ok && formData.get("back")) redirect("/admin/promos?fait=supprimee");
  return result;
}

/** Masquer = supprimer la promo ET empêcher la synchro de la réimporter. */
export async function hideDealAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  const result = await adminAction("Promo masquée", async () => {
    const admin = createAdminClient();
    const { data: deal } = await admin
      .from("deals")
      .select("id, source, external_id, title")
      .eq("id", field(formData, "id"))
      .maybeSingle();
    if (!deal) return fail("Promo introuvable.");
    await updateSettings((s) => ({
      ...s,
      blockedDeals: [
        { key: `${deal.source}:${deal.external_id}`, title: deal.title, at: new Date().toISOString() },
        ...s.blockedDeals.filter((b) => b.key !== `${deal.source}:${deal.external_id}`),
      ],
    }));
    await admin.from("deals").delete().eq("id", deal.id);
    revalidatePath("/");
    return { ...ok(`« ${deal.title} » masquée : elle ne reviendra plus.`), target: deal.title };
  });
  if (result?.ok && formData.get("back")) redirect("/admin/promos?fait=masquee");
  return result;
}

export async function unhideDealAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Promo réaffichée", async () => {
    const key = field(formData, "key");
    let title = key;
    await updateSettings((s) => {
      title = s.blockedDeals.find((b) => b.key === key)?.title ?? key;
      return { ...s, blockedDeals: s.blockedDeals.filter((b) => b.key !== key) };
    });
    return { ...ok(`« ${title} » reviendra à la prochaine synchro.`), target: title };
  });
}

/** Vide toutes les promos d'une source (elles reviennent à la prochaine synchro si la source est active). */
export async function clearSourceDeals(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Source vidée", async () => {
    const source = field(formData, "source");
    const admin = createAdminClient();
    let query = admin.from("deals").delete({ count: "exact" });
    if (source === "mobile") {
      query = query.eq("source", "community").or("external_id.like.android:*,external_id.like.ios:*");
    } else if (source === "community") {
      query = query
        .eq("source", "community")
        .not("external_id", "like", "android:%")
        .not("external_id", "like", "ios:%");
    } else if (source === "ubisoft") {
      query = query.eq("source", "cheapshark").like("external_id", "ubisoft:%");
    } else if (source === "cheapshark") {
      query = query.eq("source", "cheapshark").not("external_id", "like", "ubisoft:%");
    } else if (isSyncSource(source)) {
      query = query.eq("source", source);
    } else {
      return fail("Source inconnue.");
    }
    const { error, count } = await query;
    if (error) return fail(error.message);
    revalidatePath("/");
    const name = source === "community" ? "Communauté" : SYNC_SOURCE_LABELS[source as SyncSource];
    return { ...ok(`${count ?? 0} promo(s) ${name} supprimée(s).`), target: name };
  });
}

// ---------------------------------------------------------------------------
// Synchronisation
// ---------------------------------------------------------------------------
export async function runSyncAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Synchronisation manuelle", async () => {
    const source = field(formData, "source");
    const only = source === "all" ? undefined : isSyncSource(source) ? [source] : null;
    if (only === null) return fail("Source inconnue.");
    const report = await runSync({ only, trigger: "admin" });
    revalidatePath("/");
    const entries = Object.entries(report.sources);
    const failed = entries.filter(([, r]) => !r.ok).map(([s]) => SYNC_SOURCE_LABELS[s as SyncSource]);
    const total = entries.reduce((n, [, r]) => n + r.count, 0);
    const what = source === "all" ? "Toutes les sources" : SYNC_SOURCE_LABELS[source as SyncSource];
    return {
      ok: failed.length < entries.length || entries.length === 0,
      message: `${what} : ${total} promo(s) importée(s)${failed.length ? `, échec : ${failed.join(", ")}` : ""}.`,
      target: what,
      details: `${total} promos`,
    };
  });
}

export async function runTaskAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Tâche de maintenance", async () => {
    const task = field(formData, "task");
    const admin = createAdminClient();
    if (task === "prices") {
      const { data, error } = await admin.rpc("record_price_history");
      if (error) return fail(error.message);
      return { ...ok(`${data} relevé(s) de prix enregistrés.`), target: "Relevé des prix" };
    }
    if (task === "purge") {
      // Seules les promos expirées depuis plus d'un jour : aucune source n'est considérée comme resynchronisée.
      const { data, error } = await admin.rpc("purge_stale_deals", {
        synced_sources: [],
        older_than: new Date().toISOString(),
      });
      if (error) return fail(error.message);
      revalidatePath("/");
      return { ...ok(`${data} promo(s) expirée(s) supprimée(s).`), target: "Purge" };
    }
    if (task === "notify") {
      const { notifications } = await runFollowUp(admin, [], new Date(0).toISOString(), true);
      return typeof notifications === "number"
        ? { ...ok(`${notifications} utilisateur(s) notifié(s).`), target: "Alertes wishlist" }
        : fail(String(notifications));
    }
    return fail("Tâche inconnue.");
  });
}

export async function toggleSourceAction(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Source activée / désactivée", async () => {
    const source = field(formData, "source");
    if (!isSyncSource(source)) return fail("Source inconnue.");
    const enable = field(formData, "enabled") === "true";
    await updateSettings((s) => ({
      ...s,
      disabledSources: enable
        ? s.disabledSources.filter((x) => x !== source)
        : [...new Set([...s.disabledSources, source])].filter((x) => SYNC_SOURCES.includes(x)),
    }));
    return {
      ...ok(`${SYNC_SOURCE_LABELS[source]} ${enable ? "activée" : "désactivée"}.`),
      target: SYNC_SOURCE_LABELS[source],
      details: enable ? "activée" : "désactivée",
    };
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function broadcastNotification(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Notification groupée", async () => {
    const title = field(formData, "title").slice(0, 80);
    const body = field(formData, "body").slice(0, 200);
    const target = field(formData, "target");
    if (!title || !body) return fail("Titre et message requis.");

    const users = (await listAllUsers()).filter(
      (u) =>
        Array.isArray(u.app_metadata?.push_subscriptions) &&
        u.app_metadata.push_subscriptions.length > 0 &&
        (target !== "admins" || u.app_metadata?.role === "admin"),
    );
    if (users.length === 0) return fail("Aucun utilisateur n'a activé les notifications.");

    const admin = createAdminClient();
    const payload = { title, body, url: safeUrl(field(formData, "url")) ?? "/", tag: `annonce-${Date.now()}` };
    let reached = 0;
    let devices = 0;
    for (const u of users) {
      try {
        const r = await sendToUser(admin, u.id, payload);
        devices += r.sent;
        if (r.sent > 0) reached++;
      } catch {
        // un appareil en erreur n'arrête pas l'envoi aux autres
      }
    }
    return {
      ...ok(`Envoyée à ${reached}/${users.length} utilisateur(s), ${devices} appareil(s).`),
      target: target === "admins" ? "Admins" : "Tous les utilisateurs",
      details: title,
    };
  });
}

export async function resetAlertLog(_prev: AdminResult, _formData: FormData): Promise<AdminResult> {
  return adminAction("Historique des alertes effacé", async () => {
    const { error, count } = await createAdminClient()
      .from("alert_log")
      .delete({ count: "exact" })
      .gte("sent_at", "1970-01-01");
    if (error) return fail(error.message);
    return ok(`${count ?? 0} alerte(s) effacée(s) : les promos en cours pourront être renotifiées.`);
  });
}

// ---------------------------------------------------------------------------
// Réglages du site
// ---------------------------------------------------------------------------
async function updateSettings(mutate: (s: SiteSettings) => SiteSettings) {
  const next = mutate(await getFreshSettings());
  await saveSettings(next);
  return next;
}

export async function saveSiteSettings(_prev: AdminResult, formData: FormData): Promise<AdminResult> {
  return adminAction("Réglages du site", async () => {
    const link = field(formData, "announcement_link");
    if (link && !safeUrl(link)) return fail("Lien de l'annonce invalide.");
    if (checked(formData, "announcement_enabled") && !field(formData, "announcement_message")) {
      return fail("Écris le message de l'annonce avant de l'activer.");
    }
    const before = await getFreshSettings();
    const next = await updateSettings((s) => ({
      ...s,
      announcement: {
        enabled: checked(formData, "announcement_enabled"),
        message: field(formData, "announcement_message"),
        tone: (field(formData, "announcement_tone") || "info") as AnnouncementTone,
        link: link ? safeUrl(link) : null,
        linkLabel: field(formData, "announcement_link_label"),
      },
      maintenance: {
        enabled: checked(formData, "maintenance_enabled"),
        message: field(formData, "maintenance_message"),
      },
      signupsOpen: checked(formData, "signups_open"),
      communityDealsOpen: checked(formData, "community_open"),
      syncEnabled: checked(formData, "sync_enabled"),
      pushAlertsEnabled: checked(formData, "push_alerts"),
    }));
    revalidatePath("/", "layout");

    const changes = [
      before.announcement.enabled !== next.announcement.enabled &&
        `annonce ${next.announcement.enabled ? "activée" : "désactivée"}`,
      before.maintenance.enabled !== next.maintenance.enabled &&
        `maintenance ${next.maintenance.enabled ? "activée" : "désactivée"}`,
      before.signupsOpen !== next.signupsOpen && `inscriptions ${next.signupsOpen ? "ouvertes" : "fermées"}`,
      before.communityDealsOpen !== next.communityDealsOpen &&
        `propositions ${next.communityDealsOpen ? "ouvertes" : "fermées"}`,
      before.syncEnabled !== next.syncEnabled && `synchro auto ${next.syncEnabled ? "activée" : "en pause"}`,
      before.pushAlertsEnabled !== next.pushAlertsEnabled &&
        `alertes ${next.pushAlertsEnabled ? "activées" : "désactivées"}`,
    ].filter(Boolean);
    return { ...ok("Réglages enregistrés et appliqués au site."), details: changes.join(", ") || "textes" };
  });
}

export async function clearAuditLogAction(_prev: AdminResult, _formData: FormData): Promise<AdminResult> {
  const admin = await requireAdmin();
  await clearAuditLog();
  await logAdminAction({ admin: admin.email ?? admin.id, action: "Journal vidé" });
  revalidatePath("/admin", "layout");
  return ok("Journal vidé.");
}
