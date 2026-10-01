import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFreshSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { PLATFORMS, PLATFORM_LABELS, isPlatform, type Deal } from "@/lib/types";
import { SYNC_SOURCE_LABELS, isSyncSource } from "@/lib/sources/catalog";
import { deleteDealAction, hideDealAction, unhideDealAction } from "@/app/admin/actions";
import { StoreBadge } from "@/components/StoreBadge";
import { ActionButton } from "@/components/admin/AdminForm";
import { Empty, PageHeader, Pagination, Pill, Section, nf, timeAgo } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const PER_PAGE = 40;
const SOURCES = { ...SYNC_SOURCE_LABELS, community: "Communauté (membres)" };
const SORTS = {
  recentes: "Ajout récent",
  reduction: "Plus grosse réduction",
  prix: "Prix croissant",
  vues: "Vue récemment par la synchro",
  titre: "Titre (A → Z)",
} as const;

type Params = Promise<{ q?: string; source?: string; platform?: string; tri?: string; page?: string; fait?: string }>;

export default async function AdminDealsPage({ searchParams }: { searchParams: Params }) {
  await requireAdmin();
  const params = await searchParams;
  const sort = params.tri && params.tri in SORTS ? (params.tri as keyof typeof SORTS) : "recentes";
  const page = Math.max(1, Number(params.page) || 1);

  const admin = createAdminClient();
  let query = admin.from("deals").select("*", { count: "exact" });
  const q = (params.q ?? "").trim();
  if (q)
    query = /^[0-9a-f-]{36}$/i.test(q) ? query.eq("id", q) : query.ilike("title", `%${q.replace(/[%_]/g, "\\$&")}%`);
  if (params.source === "mobile") {
    query = query.eq("source", "community").or("external_id.like.android:*,external_id.like.ios:*");
  } else if (params.source === "community") {
    query = query.eq("source", "community").not("external_id", "like", "android:%").not("external_id", "like", "ios:%");
  } else if (isSyncSource(params.source)) {
    query = query.eq("source", params.source);
  }
  if (isPlatform(params.platform)) query = query.eq("platform", params.platform);
  query =
    sort === "reduction"
      ? query.order("discount", { ascending: false })
      : sort === "prix"
        ? query.order("sale_price", { ascending: true })
        : sort === "vues"
          ? query.order("last_seen_at", { ascending: false })
          : sort === "titre"
            ? query.order("title", { ascending: true })
            : query.order("created_at", { ascending: false });

  const [{ data, count }, settings] = await Promise.all([
    query.order("id").range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
    getFreshSettings(),
  ]);
  const deals = (data ?? []) as Deal[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtered = Boolean(q || params.source || params.platform);

  return (
    <>
      <PageHeader
        title="Promos"
        description="Modifier, masquer ou supprimer n'importe quelle promo, ou en ajouter une à la main."
        actions={
          <Link href="/admin/promos/nouvelle" className="btn-primary py-2">
            + Ajouter une promo
          </Link>
        }
      />

      <form
        action="/admin/promos"
        className="card grid gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[1fr_auto_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Titre ou identifiant…"
          aria-label="Rechercher une promo"
          className="input sm:col-span-2 lg:col-span-1"
        />
        <select name="source" defaultValue={params.source ?? ""} aria-label="Source" className="input">
          <option value="">Toutes les sources</option>
          {Object.entries(SOURCES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="platform" defaultValue={params.platform ?? ""} aria-label="Plateforme" className="input">
          <option value="">Toutes les plateformes</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
        <select name="tri" defaultValue={sort} aria-label="Trier" className="input">
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-2">Filtrer</button>
          {filtered && (
            <Link href="/admin/promos" className="btn-ghost py-2">
              ✕
            </Link>
          )}
        </div>
      </form>

      <p className="text-sm text-muted">
        {nf.format(total)} promo{total > 1 ? "s" : ""}
        {filtered && " correspondante(s)"}
      </p>

      <div className="card overflow-hidden">
        {deals.length === 0 ? (
          <Empty>Aucune promo ne correspond.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {deals.map((d) => {
              const auto = d.source !== "community" || /^(android|ios):/.test(d.external_id);
              return (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <div className="relative hidden aspect-[460/215] w-24 shrink-0 overflow-hidden rounded-md bg-surface-2 sm:block">
                    {d.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/promos/${d.id}`}
                      className="block truncate font-semibold text-white hover:text-accent"
                    >
                      {d.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <StoreBadge store={d.store} />
                      <span>{PLATFORM_LABELS[d.platform]}</span>
                      {!auto && <Pill tone="accent">Membre</Pill>}
                      <span className="hidden md:inline">· vue {timeAgo(d.last_seen_at)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-deal">{formatPrice(d.sale_price, d.currency)}</p>
                    <p className="text-xs text-muted">
                      {d.discount > 0 && `-${d.discount} %`}
                      {d.normal_price !== null && d.discount > 0 && " · "}
                      {d.normal_price !== null && <s>{formatPrice(d.normal_price, d.currency)}</s>}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <Link href={`/admin/promos/${d.id}`} className="btn-ghost px-2.5 py-1 text-xs">
                      Modifier
                    </Link>
                    {auto && (
                      <ActionButton
                        action={hideDealAction}
                        hidden={{ id: d.id }}
                        confirm={`Masquer « ${d.title} » ? Elle sera supprimée et ne reviendra plus avec la synchro.`}
                        className="px-2.5 py-1 text-xs"
                      >
                        Masquer
                      </ActionButton>
                    )}
                    <ActionButton
                      action={deleteDealAction}
                      hidden={{ id: d.id }}
                      confirm={`Supprimer « ${d.title} » ?${auto ? " Elle peut revenir à la prochaine synchro." : ""}`}
                      variant="danger"
                      className="px-2.5 py-1 text-xs"
                    >
                      Supprimer
                    </ActionButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Pagination
        page={Math.min(page, pages)}
        pages={pages}
        params={{ q: params.q, source: params.source, platform: params.platform, tri: params.tri }}
        basePath="/admin/promos"
      />

      <Section
        title={`Promos masquées (${settings.blockedDeals.length})`}
        description="Ignorées par la synchro. « Réafficher » les laisse revenir à la prochaine synchro."
      >
        {settings.blockedDeals.length ? (
          <ul className="-my-2 divide-y divide-border">
            {settings.blockedDeals.map((b) => (
              <li key={b.key} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-slate-200">{b.title}</span>
                <code className="hidden max-w-48 truncate text-xs text-muted md:inline">{b.key}</code>
                <span className="hidden text-xs text-muted sm:inline">{timeAgo(b.at)}</span>
                <ActionButton action={unhideDealAction} hidden={{ key: b.key }} className="px-2.5 py-1 text-xs">
                  Réafficher
                </ActionButton>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucune promo masquée.</Empty>
        )}
      </Section>
    </>
  );
}
