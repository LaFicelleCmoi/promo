import Link from "next/link";

export const LEGAL_UPDATED = "1er octobre 2026";
export const CONTACT_DISCORD = "LaFicelleCmoi";

type Section = { id: string; title: string; content: React.ReactNode };

const PAGES = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité et cookies" },
  { href: "/cgu", label: "Conditions d'utilisation" },
];

/** Gabarit commun des pages légales : sommaire, sections numérotées, liens entre pages. */
export function LegalPage({
  title,
  intro,
  current,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  current: string;
  sections: Section[];
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <nav
        aria-label="Pages légales"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={p.href === current ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
              p.href === current
                ? "border-accent bg-accent/15 font-semibold text-white"
                : "border-border text-muted hover:border-accent hover:text-white"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : {LEGAL_UPDATED}</p>
        <div className="mt-4 max-w-3xl text-slate-300">{intro}</div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="Sommaire" className="sticky top-24">
            <p className="label">Sommaire</p>
            <ol className="mt-2 space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted hover:text-white">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="legal space-y-8">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
              <h2 id={`${s.id}-title`} className="text-xl font-bold text-white">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-300">{s.content}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Bloc d'informations (clé / valeur) pour les mentions légales. */
export function InfoList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="card divide-y divide-border">
      {items.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[200px_1fr]">
          <dt className="text-sm text-muted">{k}</dt>
          <dd className="text-sm text-slate-200">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
