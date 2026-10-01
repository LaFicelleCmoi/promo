import Link from "next/link";

/** Briques d'interface communes aux pages du panel admin. */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const color = { default: "text-white", good: "text-deal", warn: "text-amber-300", bad: "text-danger" }[tone];
  const inner = (
    <>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className={`mt-1.5 text-2xl font-black tabular-nums sm:text-3xl ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 transition hover:border-accent sm:p-5">
      {inner}
    </Link>
  ) : (
    <div className="card p-4 sm:p-5">{inner}</div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className = "",
  danger,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}) {
  return (
    <section className={`card overflow-hidden ${danger ? "border-danger/40" : ""} ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className={`font-bold ${danger ? "text-danger" : "text-white"}`}>{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

const PILL_TONES = {
  neutral: "border-border bg-surface-2 text-slate-300",
  accent: "border-accent/40 bg-accent/15 text-accent-hover",
  good: "border-deal/40 bg-deal/10 text-deal",
  warn: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  bad: "border-danger/40 bg-danger/10 text-danger",
};

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof PILL_TONES }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

/** « il y a 3 h », « hier »… */
export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "jamais";
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (abs < 60) return "à l'instant";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(s / (86400 * 30)), "month");
  return rtf.format(Math.round(s / (86400 * 365)), "year");
}

export function fullDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export const nf = new Intl.NumberFormat("fr-FR");

/** Pagination simple par liens (conserve les autres paramètres de recherche). */
export function Pagination({
  page,
  pages,
  params,
  basePath,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    if (p > 1) sp.set("page", String(p));
    else sp.delete("page");
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-ghost py-1.5">
          ← Précédent
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted tabular-nums">
        Page {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn-ghost py-1.5">
          Suivant →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
