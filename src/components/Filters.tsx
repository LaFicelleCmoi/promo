import Link from "next/link";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/types";

export type FilterValues = {
  q?: string;
  platform?: string;
  store?: string;
  min?: string;
  max?: string;
  free?: string;
  sort?: string;
  page?: string;
};

type Props = { values: FilterValues; stores: string[]; platformCounts: Record<string, number> };

const SORTS = [
  { value: "discount", label: "Plus grosse réduction" },
  { value: "price", label: "Prix croissant" },
  { value: "recent", label: "Plus récentes" },
  { value: "ending", label: "Se terminent bientôt" },
];

export function hrefWith(values: FilterValues, patch: Partial<FilterValues>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...values, ...patch })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function Filters({ values, stores, platformCounts }: Props) {
  const total = Object.values(platformCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        <PlatformTab href={hrefWith(values, { platform: undefined, store: undefined, page: undefined })} active={!values.platform}>
          Toutes <Count n={total} />
        </PlatformTab>
        {PLATFORMS.filter((p) => p !== "other" || platformCounts[p]).map((p) => (
          <PlatformTab key={p} href={hrefWith(values, { platform: p, store: undefined, page: undefined })} active={values.platform === p}>
            {PLATFORM_LABELS[p]} <Count n={platformCounts[p] ?? 0} />
          </PlatformTab>
        ))}
      </nav>

      <form method="get" action="/" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        {values.platform && <input type="hidden" name="platform" value={values.platform} />}

        <div className="lg:col-span-2">
          <label htmlFor="q" className="label">
            Rechercher un jeu
          </label>
          <input id="q" name="q" defaultValue={values.q} placeholder="Elden Ring, Zelda…" className="input" />
        </div>

        <div>
          <label htmlFor="store" className="label">
            Boutique
          </label>
          <select id="store" name="store" defaultValue={values.store ?? ""} className="input">
            <option value="">Toutes</option>
            {stores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="min" className="label">
            Réduction min.
          </label>
          <select id="min" name="min" defaultValue={values.min ?? ""} className="input">
            <option value="">Peu importe</option>
            {[25, 50, 75, 90].map((n) => (
              <option key={n} value={n}>
                -{n}% et plus
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="max" className="label">
            Prix max.
          </label>
          <input id="max" name="max" type="number" min={0} step="0.01" defaultValue={values.max} placeholder="20" className="input" />
        </div>

        <div>
          <label htmlFor="sort" className="label">
            Trier par
          </label>
          <select id="sort" name="sort" defaultValue={values.sort ?? "discount"} className="input">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-6">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="free" value="1" defaultChecked={values.free === "1"} className="accent-accent" />
            Uniquement les jeux gratuits
          </label>
          <div className="flex gap-2">
            <Link href={values.platform ? `/?platform=${values.platform}` : "/"} className="btn-ghost">
              Réinitialiser
            </Link>
            <button type="submit" className="btn-primary">
              Filtrer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function PlatformTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active ? "border-accent bg-accent text-white" : "border-border bg-surface text-slate-300 hover:border-accent"
      }`}
    >
      {children}
    </Link>
  );
}

function Count({ n }: { n: number }) {
  return <span className="ml-1 text-xs opacity-70">{n}</span>;
}
