"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameImage } from "@/components/GameImage";
import { StoreDot } from "@/components/StoreBadge";

const KEY = "promo-tracker:recent";
const MAX = 12;

export type RecentGame = {
  id: string;
  title: string;
  image: string | null;
  store: string;
  price: number;
  currency: string;
  discount: number;
};

function read(): RecentGame[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as RecentGame[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Enregistre la fiche consultée (navigateur uniquement, rien n'est envoyé au serveur). */
export function RecentlyViewedTracker({ game }: { game: RecentGame }) {
  useEffect(() => {
    try {
      const list = [game, ...read().filter((g) => g.id !== game.id)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // Stockage indisponible (navigation privée…) : on ignore.
    }
  }, [game]);
  return null;
}

const price = (g: RecentGame) =>
  g.price === 0
    ? "Gratuit"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: g.currency }).format(g.price);

/** Rangée « Vus récemment » de l'accueil. */
export function RecentlyViewedRail() {
  const [games, setGames] = useState<RecentGame[]>([]);

  useEffect(() => setGames(read()), []);

  if (games.length < 2) return null;

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setGames([]);
  }

  return (
    <section aria-labelledby="recent-title" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="recent-title" className="text-lg font-bold sm:text-xl">
            Vus récemment
          </h2>
          <p className="text-xs text-muted sm:text-sm">Reprends là où tu t&apos;étais arrêté.</p>
        </div>
        <button type="button" onClick={clear} className="shrink-0 text-sm text-muted hover:text-white">
          Effacer
        </button>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {games.map((g) => (
          <li key={g.id} className="w-44 shrink-0 snap-start sm:w-52">
            <Link href={`/jeu/${g.id}`} className="card group block overflow-hidden transition hover:border-accent/60">
              <div className="relative aspect-[460/215] overflow-hidden bg-surface-2">
                <GameImage src={g.image} fallbackLabel={g.title} className="h-full w-full object-cover" />
                {g.discount > 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded bg-deal px-1 text-[10px] font-black text-black">
                    -{g.discount}%
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold text-white group-hover:text-accent">{g.title}</p>
                <p className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted">
                  <span className="flex min-w-0 items-center gap-1">
                    <StoreDot store={g.store} />
                    <span className="truncate">{g.store}</span>
                  </span>
                  <span className="font-bold text-deal tabular-nums">{price(g)}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
