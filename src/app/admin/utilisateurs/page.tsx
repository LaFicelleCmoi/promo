import Link from "next/link";
import { isAdmin, isBanned, listAllUsers, pushDevices, requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseProfile } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { Empty, PageHeader, Pagination, Pill, fullDate, nf, timeAgo } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const FILTERS = {
  tous: "Tous",
  admins: "Admins",
  suspendus: "Suspendus",
  notifies: "Notifications actives",
  "non-confirmes": "Email non confirmé",
} as const;
type Filter = keyof typeof FILTERS;

const SORTS = { recents: "Inscription récente", actifs: "Dernière connexion", nom: "Pseudo" } as const;
type Sort = keyof typeof SORTS;

const PER_PAGE = 30;

type Params = Promise<{ q?: string; filtre?: string; tri?: string; page?: string; supprime?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: Params }) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const filter: Filter = params.filtre && params.filtre in FILTERS ? (params.filtre as Filter) : "tous";
  const sort: Sort = params.tri && params.tri in SORTS ? (params.tri as Sort) : "recents";

  const admin = createAdminClient();
  const [users, wishlist, deals] = await Promise.all([
    listAllUsers(),
    admin.from("wishlist").select("user_id"),
    admin.from("deals").select("created_by").not("created_by", "is", null),
  ]);
  const wishCount = new Map<string, number>();
  for (const w of wishlist.data ?? []) wishCount.set(w.user_id, (wishCount.get(w.user_id) ?? 0) + 1);
  const dealCount = new Map<string, number>();
  for (const d of deals.data ?? []) dealCount.set(d.created_by, (dealCount.get(d.created_by) ?? 0) + 1);

  const rows = users
    .map((u) => ({ u, p: parseProfile(u.user_metadata, u.email?.split("@")[0]) }))
    .filter(
      ({ u, p }) => !q || u.email?.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || u.id === q,
    )
    .filter(({ u }) => {
      if (filter === "admins") return isAdmin(u);
      if (filter === "suspendus") return isBanned(u);
      if (filter === "notifies") return pushDevices(u) > 0;
      if (filter === "non-confirmes") return !u.email_confirmed_at;
      return true;
    })
    .sort((a, b) => {
      if (sort === "nom") return a.p.username.localeCompare(b.p.username, "fr");
      const key = sort === "actifs" ? "last_sign_in_at" : "created_at";
      return new Date(b.u[key] ?? 0).getTime() - new Date(a.u[key] ?? 0).getTime();
    });

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const link = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(
      Object.entries({ q: params.q, filtre: params.filtre, tri: params.tri, ...patch }).filter(([, v]) => v) as [
        string,
        string,
      ][],
    );
    return `/admin/utilisateurs${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description={`${nf.format(users.length)} comptes · rôles, suspensions, profils, wishlists et notifications.`}
      />

      {params.supprime && (
        <p role="status" className="rounded-lg border border-deal/40 bg-deal/10 px-4 py-2.5 text-sm text-deal">
          Compte supprimé.
        </p>
      )}

      <CreateUserForm />

      <form className="flex flex-col gap-2 sm:flex-row" action="/admin/utilisateurs">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Email, pseudo ou identifiant…"
          aria-label="Rechercher un utilisateur"
          className="input sm:max-w-sm"
        />
        {params.filtre && <input type="hidden" name="filtre" value={params.filtre} />}
        <select name="tri" defaultValue={sort} aria-label="Trier" className="input sm:w-56">
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="btn-primary py-2">Rechercher</button>
      </form>

      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {(Object.entries(FILTERS) as [Filter, string][]).map(([k, v]) => (
          <Link
            key={k}
            href={link({ filtre: k === "tous" ? undefined : k, page: undefined })}
            aria-current={filter === k ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === k ? "border-accent bg-accent/15 text-white" : "border-border text-muted hover:text-white"
            }`}
          >
            {v}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {shown.length === 0 ? (
          <Empty>Aucun utilisateur ne correspond.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map(({ u, p }) => (
              <li key={u.id}>
                <Link
                  href={`/admin/utilisateurs/${u.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2 sm:px-5"
                >
                  <Avatar avatar={p.avatar} name={p.username} size={40} rounded="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-semibold text-white">{p.username}</span>
                      {isAdmin(u) && <Pill tone="warn">Admin</Pill>}
                      {isBanned(u) && <Pill tone="bad">Suspendu</Pill>}
                      {!u.email_confirmed_at && <Pill>Non confirmé</Pill>}
                    </div>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <dl className="hidden shrink-0 grid-cols-3 gap-6 text-right text-xs md:grid">
                    <div>
                      <dt className="text-muted">Wishlist</dt>
                      <dd className="font-semibold text-white tabular-nums">{wishCount.get(u.id) ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Promos</dt>
                      <dd className="font-semibold text-white tabular-nums">{dealCount.get(u.id) ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Appareils</dt>
                      <dd className="font-semibold text-white tabular-nums">{pushDevices(u)}</dd>
                    </div>
                  </dl>
                  <div className="hidden w-36 shrink-0 text-right text-xs sm:block">
                    <p className="text-slate-300" title={fullDate(u.created_at)}>
                      Inscrit {timeAgo(u.created_at)}
                    </p>
                    <p className="text-muted" title={fullDate(u.last_sign_in_at)}>
                      Vu {timeAgo(u.last_sign_in_at)}
                    </p>
                  </div>
                  <span aria-hidden className="text-muted">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination
        page={page}
        pages={pages}
        params={{ q: params.q, filtre: params.filtre, tri: params.tri }}
        basePath="/admin/utilisateurs"
      />
    </>
  );
}
