import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FeaturedDeals } from "@/components/FeaturedDeals";
import { HeroSearch } from "@/components/HeroSearch";
import CountUp from "@/components/reactbits/CountUp";
import GradientText from "@/components/reactbits/GradientText";
import type { Deal } from "@/lib/types";
import { MAIN_STORES } from "@/lib/stores";

const TRACKED_STORES = MAIN_STORES;
// Boutiques présentes sous plusieurs noms (ex. « PlayStation Store (PS4/PS5) ») : filtre par plateforme.
const STORE_LINKS: Record<string, string> = {
  playstation: "/?platform=playstation",
  xbox: "/?platform=xbox",
  nintendo: "/?platform=switch",
};
const FEATURED_SOURCES = ["playstation", "xbox", "steam"] as const;

type Props = { deals: number; platforms: number; query?: string };

function formatUpdatedAt(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  const tz = "Europe/Paris";
  const day = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: tz });
  const time = date.toLocaleTimeString("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  if (day(date) === day(new Date())) return `aujourd'hui à ${time}`;
  return `le ${date.toLocaleDateString("fr-FR", { timeZone: tz, day: "numeric", month: "long" })} à ${time}`;
}

async function getHeroData() {
  const supabase = await createClient();
  const notExpired = `ends_at.is.null,ends_at.gt.${new Date().toISOString()}`;

  // Meilleure promo de chaque grande boutique, sur des jeux vendus au moins 30 € (évite les petits jeux à 99 %).
  const featured = await Promise.all(
    FEATURED_SOURCES.map((source) =>
      supabase
        .from("deals")
        .select("*")
        .eq("source", source)
        .gt("sale_price", 0)
        .gte("normal_price", 30)
        .not("image_url", "is", null)
        .or(notExpired)
        .order("discount", { ascending: false })
        .order("normal_price", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ),
  );

  const { data: latest } = await supabase
    .from("deals")
    .select("last_seen_at")
    .neq("source", "community")
    .order("last_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    featured: featured.map((r) => r.data as Deal | null).filter((d): d is Deal => d !== null),
    updatedAt: formatUpdatedAt(latest?.last_seen_at ?? null),
  };
}

export async function Hero({ deals, platforms, query }: Props) {
  const { featured, updatedAt } = await getHeroData();

  const stats = [
    { value: deals, label: "promos suivies" },
    { value: TRACKED_STORES.length, label: "boutiques officielles" },
    { value: platforms, label: "plateformes" },
  ];

  return (
    <section className="relative isolate pt-6 pb-8 sm:pt-10 sm:pb-12 lg:pt-14">
      <AuroraBackground />
      {/* Grille en filigrane */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-y-0 left-1/2 -z-10 -mt-8 w-screen -translate-x-1/2 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />

      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          {updatedAt && (
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-deal" />
              </span>
              Prix mis à jour {updatedAt}
            </p>
          )}

          <h1 className="mt-5 text-4xl leading-[1.05] font-black tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Le meilleur prix pour chaque jeu, <GradientText>sur toutes les plateformes.</GradientText>
          </h1>

          <p className="mt-5 max-w-xl text-base text-pretty text-slate-300 sm:text-lg">
            Steam, PlayStation, Xbox, Nintendo eShop, Epic et GOG comparés chaque jour. Historique des prix et alertes
            sur ta wishlist.
          </p>

          <div className="mt-7">
            <HeroSearch defaultValue={query} />
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href="/?free=1#resultats" className="font-medium text-accent hover:text-accent-hover">
                Jeux gratuits du moment →
              </Link>
              <Link href="/?low=1#resultats" className="font-medium text-slate-300 hover:text-white">
                Au plus bas prix →
              </Link>
            </div>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
            {[
              "Aucune transaction sur ce site",
              "Liens vers les boutiques officielles",
              "Gratuit, sans carte bancaire",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <svg
                  aria-hidden
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-deal"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:block">
          <FeaturedDeals deals={featured} total={deals} />
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-6 border-t border-border/70 pt-6 sm:mt-12 lg:flex-row lg:items-center lg:justify-between">
        <dl className="flex divide-x divide-border">
          {stats.map((s, i) => (
            <div key={s.label} className="px-4 first:pl-0 sm:px-6">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <CountUp
                  to={s.value}
                  delay={i * 0.15}
                  duration={1.5}
                  className="text-2xl font-black text-white sm:text-3xl"
                />
                <span aria-hidden className="block text-xs text-muted">
                  {s.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-[11px] font-medium tracking-widest text-muted uppercase">Prix suivis sur</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
            {TRACKED_STORES.map((store) => (
              <li key={store.key}>
                <a
                  href={`${STORE_LINKS[store.key] ?? `/?store=${encodeURIComponent(store.label)}`}#resultats`}
                  className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-slate-300 transition hover:text-white"
                >
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: store.color }} />
                  {store.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
