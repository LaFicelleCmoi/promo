import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { deleteDealAction, hideDealAction } from "@/app/admin/actions";
import { AdminDealForm } from "@/components/admin/AdminDealForm";
import { ActionButton } from "@/components/admin/AdminForm";
import { PageHeader, Pill, Section, fullDate, timeAgo } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cree?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { cree }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const admin = createAdminClient();
  const { data } = await admin.from("deals").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const deal = data as Deal;

  const [{ count: historyCount }, author] = await Promise.all([
    admin
      .from("price_history")
      .select("price", { count: "exact", head: true })
      .eq("source", deal.source)
      .eq("external_id", deal.external_id),
    deal.created_by ? admin.auth.admin.getUserById(deal.created_by) : Promise.resolve(null),
  ]);
  const auto = deal.source !== "community" || /^(android|ios):/.test(deal.external_id);

  const infos: [string, React.ReactNode][] = [
    ["Source", deal.source === "community" ? (auto ? "Mobile (synchro)" : "Communauté") : deal.source],
    [
      "Identifiant externe",
      <code key="e" className="text-xs">
        {deal.external_id}
      </code>,
    ],
    [
      "Proposée par",
      author?.data.user ? (
        <Link key="a" href={`/admin/utilisateurs/${author.data.user.id}`} className="text-accent hover:underline">
          {author.data.user.email}
        </Link>
      ) : (
        "Synchro automatique"
      ),
    ],
    ["Ajoutée", fullDate(deal.created_at)],
    ["Vue par la synchro", `${fullDate(deal.last_seen_at)} (${timeAgo(deal.last_seen_at)})`],
    ["Plus bas observé", deal.lowest_price !== null ? formatPrice(deal.lowest_price, deal.currency) : "—"],
    ["Jours suivis", `${deal.tracked_days} · ${historyCount ?? 0} relevé(s)`],
  ];

  return (
    <>
      <Link href="/admin/promos" className="text-sm text-muted hover:text-white">
        ← Toutes les promos
      </Link>
      <PageHeader
        title={deal.title}
        actions={
          <>
            <Link href={`/jeu/${deal.id}`} className="btn-ghost py-2">
              Voir sur le site
            </Link>
            <a href={deal.url} target="_blank" rel="noopener noreferrer" className="btn-ghost py-2">
              Boutique ↗
            </a>
          </>
        }
      />

      {cree && (
        <p role="status" className="rounded-lg border border-deal/40 bg-deal/10 px-4 py-2.5 text-sm text-deal">
          Promo ajoutée et visible sur le site.
        </p>
      )}
      {auto && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200">
          Promo importée automatiquement : tes modifications seront remplacées à la prochaine synchro. Pour la retirer
          pour de bon, utilise <strong>Masquer</strong>.
        </p>
      )}

      <AdminDealForm id={deal.id} deal={deal} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Détails" actions={deal.is_lowest ? <Pill tone="good">Plus bas prix</Pill> : undefined}>
          <dl className="-my-2 divide-y divide-border text-sm">
            {infos.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="min-w-0 truncate text-right text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Retirer la promo" danger>
          <div className="space-y-4 text-sm">
            {auto && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-slate-300">Supprimée et ignorée par les prochaines synchros.</p>
                <ActionButton
                  action={hideDealAction}
                  hidden={{ id: deal.id, back: "1" }}
                  confirm="Masquer définitivement cette promo ?"
                  className="py-2"
                >
                  Masquer
                </ActionButton>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-slate-300">
                {auto ? "Supprimée maintenant, peut revenir à la prochaine synchro." : "Suppression définitive."}
              </p>
              <ActionButton
                action={deleteDealAction}
                hidden={{ id: deal.id, back: "1" }}
                confirm="Supprimer cette promo ?"
                variant="danger"
                className="py-2"
              >
                Supprimer
              </ActionButton>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
