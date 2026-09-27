"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SearchCombobox } from "@/components/SearchCombobox";

/** Recherche principale du hero : suggestions instantanées, ou résultats filtrés sur Entrée. */
export function HeroSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const search = (q: string) =>
    startTransition(() => router.push(q ? `/?q=${encodeURIComponent(q)}#resultats` : "/#resultats"));

  return (
    <form
      method="get"
      action="/"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        search(String(new FormData(e.currentTarget).get("q") ?? "").trim());
      }}
      className="relative w-full max-w-xl"
    >
      <label htmlFor="hero-q" className="sr-only">
        Rechercher un jeu
      </label>
      <SearchCombobox
        id="hero-q"
        defaultValue={defaultValue}
        onSubmitQuery={search}
        leadingIcon
        inputClassName="h-14 w-full rounded-xl border border-border bg-surface/90 pr-32 pl-11 text-base text-white shadow-2xl shadow-black/40 outline-none backdrop-blur transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/20"
        trailing={
          <button
            type="submit"
            disabled={pending}
            className="btn-primary absolute top-1/2 right-2 h-10 -translate-y-1/2 px-4 sm:px-5"
          >
            {pending ? "…" : "Rechercher"}
          </button>
        }
      />
    </form>
  );
}
