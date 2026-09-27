import Link from "next/link";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/types";
import { FiltersToggle } from "@/components/FiltersToggle";
import { FilterForm } from "@/components/FilterForm";
import { LinkPending } from "@/components/LinkPending";
import { TabsScroller } from "@/components/TabsScroller";

export type FilterValues = {
  q?: string;
  platform?: string;
  store?: string;
  min?: string;
  max?: string;
  free?: string;
  low?: string;
  sort?: string;
  page?: string;
};

type Props = { values: FilterValues; stores: string[]; platformCounts: Record<string, number> };

export const SORTS = [
  { value: "discount", label: "Réduction" },
  { value: "price", label: "Prix croissant" },
  { value: "ending", label: "Fin proche" },
  { value: "recent", label: "Nouveautés" },
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
  const chips = activeChips(values);
  const activeCount = chips.length;

  return (
    <div className="space-y-4">
      <TabsScroller className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto scroll-smooth px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <PlatformTab
          href={hrefWith(values, { platform: undefined, store: undefined, page: undefined })}
          active={!values.platform}
        >
          Toutes <Count n={total} />
        </PlatformTab>
        {PLATFORMS.filter((p) => p !== "other" || platformCounts[p]).map((p) => (
          <PlatformTab
            key={p}
            href={hrefWith(values, { platform: p, store: undefined, page: undefined })}
            active={values.platform === p}
          >
            {PLATFORM_LABELS[p]} <Count n={platformCounts[p] ?? 0} />
          </PlatformTab>
        ))}
      </TabsScroller>

      <FiltersToggle activeCount={activeCount}>
        <FilterForm key={JSON.stringify(values)} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          {values.platform && <input type="hidden" name="platform" value={values.platform} />}
          {values.sort && <input type="hidden" name="sort" value={values.sort} />}

          <div className="sm:col-span-2 lg:col-span-3">
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
            <input
              id="max"
              name="max"
              type="number"
              min={0}
              step="0.01"
              defaultValue={values.max}
              placeholder="20"
              className="input"
            />
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-5">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="free"
                  value="1"
                  defaultChecked={values.free === "1"}
                  className="accent-accent"
                />
                Uniquement les jeux gratuits
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="low"
                  value="1"
                  defaultChecked={values.low === "1"}
                  className="accent-accent"
                />
                Uniquement au plus bas prix
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Link href={values.platform ? `/?platform=${values.platform}` : "/"} scroll={false} className="btn-ghost">
                Réinitialiser
              </Link>
              <button type="submit" className="btn-primary">
                <span className="group-data-[pending]:hidden">Filtrer</span>
                <span className="hidden group-data-[pending]:inline">Filtrage…</span>
              </button>
            </div>
          </div>
        </FilterForm>
      </FiltersToggle>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtres actifs">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={hrefWith(values, { [c.key]: undefined, page: undefined })}
              scroll={false}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 py-1 pr-2 pl-3 text-xs font-medium text-slate-200 transition hover:border-danger/60 hover:text-white"
              aria-label={`Retirer le filtre ${c.label}`}
            >
              {c.label}
              <span aria-hidden className="text-muted">
                ✕
              </span>
            </Link>
          ))}
          <Link
            href={values.platform ? `/?platform=${values.platform}` : "/"}
            scroll={false}
            className="text-xs text-muted underline-offset-2 hover:text-white hover:underline"
          >
            Tout effacer
          </Link>
        </div>
      )}
    </div>
  );
}

function PlatformTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition sm:py-1.5 ${
        active ? "border-accent bg-accent text-white" : "border-border bg-surface text-slate-300 hover:border-accent"
      }`}
    >
      {children}
      <LinkPending />
    </Link>
  );
}

type FilterKey = "q" | "store" | "min" | "max" | "free" | "low";

function activeChips(values: FilterValues): { key: FilterKey; label: string }[] {
  const chips: { key: FilterKey; label: string }[] = [];
  if (values.q) chips.push({ key: "q", label: `« ${values.q} »` });
  if (values.store) chips.push({ key: "store", label: values.store });
  if (Number(values.min) > 0) chips.push({ key: "min", label: `-${values.min} % et plus` });
  if (values.max) chips.push({ key: "max", label: `≤ ${values.max} €` });
  if (values.free === "1") chips.push({ key: "free", label: "Gratuits" });
  if (values.low === "1") chips.push({ key: "low", label: "Plus bas prix" });
  return chips;
}

function Count({ n }: { n: number }) {
  return <span className="ml-1 text-xs opacity-70">{n}</span>;
}
