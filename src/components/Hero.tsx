import { AuroraBackground } from "@/components/AuroraBackground";
import CountUp from "@/components/reactbits/CountUp";
import GradientText from "@/components/reactbits/GradientText";

type Props = { deals: number; stores: number; platforms: number };

export function Hero({ deals, stores, platforms }: Props) {
  const stats = [
    { value: deals, label: "promos suivies" },
    { value: stores, label: "boutiques" },
    { value: platforms, label: "plateformes" },
  ];

  return (
    <section className="relative isolate">
      <AuroraBackground />
      <h1 className="text-2xl leading-tight font-black tracking-tight text-balance sm:text-4xl lg:text-5xl">
        Toutes les promos jeux vidéo, <GradientText>au même endroit</GradientText>.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:mt-3 sm:text-base">
        Les prix de Steam, PlayStation Store, Xbox Store, Nintendo eShop, Epic et GOG suivis chaque jour, avec
        l&apos;historique du plus bas prix.
      </p>

      <dl className="mt-5 grid max-w-xl grid-cols-3 gap-2 sm:mt-6 sm:gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface/60 px-3 py-2 backdrop-blur sm:px-4 sm:py-3"
          >
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <CountUp
                to={s.value}
                delay={i * 0.15}
                duration={1.5}
                className="text-xl font-black text-white sm:text-3xl"
              />
              <span aria-hidden className="block text-[11px] text-muted sm:text-xs">
                {s.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
