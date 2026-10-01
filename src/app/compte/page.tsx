import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Avatar } from "@/components/Avatar";
import { parseProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Mon profil — Promo Tracker" };

const date = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login?next=/compte");

  const [{ count: wishlistCount }, { count: dealsCount }] = await Promise.all([
    supabase.from("wishlist").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("id", { count: "exact", head: true }).eq("created_by", user.id),
  ]);
  const devices = Array.isArray(user.app_metadata?.push_subscriptions)
    ? user.app_metadata.push_subscriptions.length
    : 0;
  const profile = parseProfile(user.user_metadata, user.email?.split("@")[0]);
  const name = profile.username;

  const infos: [string, React.ReactNode][] = [
    ["Pseudo", name],
    ["Email", user.email],
    ["Membre depuis", date(user.created_at)],
    [
      "Jeux suivis",
      <Link key="w" href="/wishlist" className="text-accent hover:underline">
        {wishlistCount ?? 0}
      </Link>,
    ],
    ["Promos proposées", dealsCount ?? 0],
    ["Appareils notifiés", devices],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar avatar={profile.avatar} name={name} size={56} rounded="rounded-2xl" />
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Mon profil</h1>
          <p className="text-sm text-muted">Avatar, apparence du site, préférences et données du compte.</p>
        </div>
      </div>

      <ProfileEditor initial={profile} />

      <h2 className="pt-4 text-lg font-bold">Compte</h2>

      <dl className="card divide-y divide-border">
        {infos.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="truncate text-sm font-semibold text-slate-200">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="card space-y-3 p-4 sm:p-5" aria-labelledby="export-title">
        <h2 id="export-title" className="font-bold text-white">
          Télécharger mes données
        </h2>
        <p className="text-sm text-muted">
          Un fichier JSON avec ton compte, ta wishlist, tes promos proposées et tes appareils notifiés (droit à la
          portabilité).
        </p>
        <a href="/api/compte/export" download className="btn-ghost inline-flex py-2.5">
          Télécharger (JSON)
        </a>
      </section>

      <section className="card space-y-3 border-danger/40 p-4 sm:p-5" aria-labelledby="delete-title">
        <h2 id="delete-title" className="font-bold text-danger">
          Supprimer mon compte
        </h2>
        <p className="text-sm text-muted">
          Suppression immédiate et définitive : ta wishlist, tes alertes et tes appareils notifiés sont effacés. Les
          promos que tu as proposées restent visibles mais deviennent anonymes.
        </p>
        <DeleteAccountForm />
      </section>

      <p className="text-center text-xs text-muted">
        Voir la{" "}
        <Link href="/confidentialite" className="underline hover:text-white">
          politique de confidentialité
        </Link>{" "}
        et les{" "}
        <Link href="/cgu" className="underline hover:text-white">
          conditions d&apos;utilisation
        </Link>
        .
      </p>
    </div>
  );
}
