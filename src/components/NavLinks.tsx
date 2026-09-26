"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type NavLink = { href: string; label: string };

/** Un lien est actif si son chemin ET ses paramètres correspondent à la page courante. */
export function useIsActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (href: string) => {
    const url = new URL(href, "http://x");
    if (url.pathname !== pathname) return false;
    // "/" = toutes les promos : actif seulement si aucun raccourci (ex. ?free=1) n'est appliqué.
    if (href === "/") return searchParams.get("free") !== "1";
    return [...url.searchParams].every(([key, value]) => searchParams.get(key) === value);
  };
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const isActive = useIsActive();

  return (
    <>
      {links.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center whitespace-nowrap transition hover:text-white ${
              active
                ? "font-semibold text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent"
                : ""
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
