import type { Metadata } from "next";
import Link from "next/link";
import { MAIN_STORES, storeTheme } from "@/lib/stores";

export const metadata: Metadata = {
  title: "Extension Chrome — Promo Tracker",
  description:
    "Le meilleur prix du jeu que tu regardes, directement sur Steam, PlayStation Store, Xbox, Nintendo eShop, Epic, GOG, Ubisoft, Google Play et App Store.",
};

const STORES = [...MAIN_STORES.map((s) => s.label), "Google Play", "App Store"];

const FEATURES = [
  {
    title: "Le meilleur prix, sur place",
    text: "Sur la page d'un jeu, un panneau indique si c'est le meilleur prix suivi ou s'il est moins cher ailleurs, et où.",
    icon: "M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  },
  {
    title: "Le plus bas prix observé",
    text: "L'historique du site en un coup d'œil : tu sais tout de suite si la promo vaut vraiment le coup.",
    icon: "M3 3v18h18M7 14l4-4 4 4 5-5",
  },
  {
    title: "Suivre un jeu en un clic",
    text: "« Suivre ce jeu » l'ajoute à ta wishlist : notification dès qu'il passe en promo, sur toutes les boutiques.",
    icon: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z",
  },
  {
    title: "Les promos du moment",
    text: "L'icône de l'extension affiche la réduction du jeu ouvert, et son menu les meilleures promos et ta wishlist.",
    icon: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  },
];

const STEPS = [
  <>
    Télécharge l&apos;extension, puis <strong>décompresse</strong> le fichier .zip dans un dossier que tu gardes.
  </>,
  <>
    Dans Chrome, ouvre <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">chrome://extensions</code> (ou Edge
    : <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">edge://extensions</code>).
  </>,
  <>
    Active le <strong>Mode développeur</strong> (interrupteur en haut à droite).
  </>,
  <>
    Clique sur <strong>Charger l&apos;extension non empaquetée</strong> et choisis le dossier décompressé.
  </>,
  <>
    Épingle Promo Tracker (icône puzzle de la barre d&apos;outils), puis ouvre la page d&apos;un jeu sur une boutique.
  </>,
];

export default function ExtensionPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 sm:space-y-14">
      <section className="grid items-center gap-8 pt-2 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-hover">
            Nouveau · Chrome, Edge, Brave, Opera
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Le meilleur prix,
            <br />
            <span className="text-accent">là où tu achètes.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            L&apos;extension Promo Tracker compare le jeu que tu regardes sur toutes les boutiques officielles, montre
            son plus bas prix et le suit pour toi. Gratuite, sans publicité, sans pistage.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="/promo-tracker-extension.zip" download className="btn-primary px-6 py-3 text-base">
              <svg
                aria-hidden
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" />
              </svg>
              Télécharger l&apos;extension
            </a>
            <a href="#installation" className="btn-ghost px-6 py-3 text-base">
              Comment l&apos;installer
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">
            Version 1.0 · 22 Ko · en attente de publication sur le Chrome Web Store
          </p>
        </div>

        {/* Aperçu du panneau affiché sur les boutiques */}
        <div aria-hidden className="relative">
          <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-accent/20 blur-3xl sm:-inset-6" />
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50">
            <div className="flex items-center border-b border-border px-4 py-2.5 text-sm font-black text-white">
              <span className="text-accent-hover">Promo</span>Tracker
              <span className="ml-auto text-muted">— ✕</span>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p className="text-xs text-muted">ELDEN RING</p>
              <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
                <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">Moins cher ailleurs</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-deal">23,99 €</span>
                  <s className="text-xs text-muted">59,99 €</s>
                  <span className="rounded bg-deal px-1.5 text-[11px] font-black text-black">-60%</span>
                </p>
                <p className="text-slate-300">
                  sur <strong className="text-white">Xbox Store</strong>
                </p>
              </div>
              <p className="text-xs text-slate-300">
                Plus bas prix observé : <strong className="text-white">19,99 €</strong>
              </p>
              <ul className="divide-y divide-surface-2 border-t border-border">
                {[
                  ["Xbox Store", "23,99 €", "-60%", ""],
                  ["Steam", "35,99 €", "-40%", "ici"],
                  ["PlayStation Store", "39,99 €", "-33%", ""],
                ].map(([s, p, d, here]) => (
                  <li key={s} className="flex items-center gap-2 py-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: storeTheme(s).color }} />
                    <span className="flex-1 text-slate-300">{s}</span>
                    {here && (
                      <span className="rounded bg-accent/20 px-1 text-[10px] font-bold text-violet-200">{here}</span>
                    )}
                    <span className="font-bold text-white">{p}</span>
                    <span className="w-9 text-right text-xs font-bold text-deal">{d}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <span className="rounded-lg bg-accent py-2 text-center text-xs font-bold text-white">
                  ♡ Suivre ce jeu
                </span>
                <span className="rounded-lg border border-border py-2 text-center text-xs font-bold text-white">
                  Voir le comparatif
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">
          Fonctionnalités
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="card flex gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-hover">
                <svg
                  aria-hidden
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={f.icon} />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stores-title" className="card p-5 sm:p-6">
        <h2 id="stores-title" className="text-lg font-bold">
          Fonctionne sur les 9 boutiques officielles
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {STORES.map((s) => (
            <li
              key={s}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold text-slate-200"
            >
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: storeTheme(s).color }} />
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section id="installation" aria-labelledby="install-title" className="scroll-mt-24">
        <h2 id="install-title" className="text-2xl font-bold">
          Installation
        </h2>
        <p className="mt-1 text-sm text-muted">
          En attendant la publication sur le Chrome Web Store, l&apos;installation se fait en 1 minute :
        </p>
        <ol className="mt-5 space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="card flex items-start gap-4 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-white">
                {i + 1}
              </span>
              <p className="pt-1 text-sm text-slate-200">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted">
          Pour suivre des jeux depuis l&apos;extension, connecte-toi simplement sur{" "}
          <Link href="/login" className="text-accent hover:underline">
            Promo Tracker
          </Link>{" "}
          dans le même navigateur.
        </p>
      </section>

      <section className="card space-y-2 p-5 text-sm text-muted sm:p-6">
        <h2 className="text-base font-bold text-white">Respect de ta vie privée</h2>
        <p>
          L&apos;extension ne lit que le <strong className="text-slate-200">nom du jeu</strong> affiché sur les pages
          produit des boutiques listées, pour l&apos;envoyer à Promo Tracker et récupérer ses prix. Elle ne lit pas ton
          historique, ne touche à aucun formulaire ni paiement, n&apos;intègre aucun pisteur. Détails dans la{" "}
          <Link href="/confidentialite#extension" className="text-accent hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
        <p>Aucun achat n&apos;est fait via l&apos;extension : les offres restent sur les boutiques officielles.</p>
      </section>
    </div>
  );
}
