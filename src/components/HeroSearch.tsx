"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Recherche principale du hero : envoie vers les résultats filtrés, sans rechargement. */
export function HeroSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    startTransition(() => router.push(q ? `/?q=${encodeURIComponent(q)}#resultats` : "/#resultats"));
  }

  return (
    <form method="get" action="/" onSubmit={onSubmit} role="search" className="relative w-full max-w-xl">
      <label htmlFor="hero-q" className="sr-only">
        Rechercher un jeu
      </label>
      <svg
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-muted"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="hero-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Rechercher un jeu…"
        autoComplete="off"
        className="h-14 w-full rounded-xl border border-border bg-surface/90 pr-32 pl-11 text-base text-white shadow-2xl shadow-black/40 outline-none backdrop-blur transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn-primary absolute top-1/2 right-2 h-10 -translate-y-1/2 px-4 sm:px-5"
      >
        {pending ? "…" : "Rechercher"}
      </button>
    </form>
  );
}
