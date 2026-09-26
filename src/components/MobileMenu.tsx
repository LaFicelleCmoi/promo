"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/app/auth/actions";
import { useIsActive, type NavLink } from "@/components/NavLinks";

type Props = { links: NavLink[]; userName?: string | null };

export function MobileMenu({ links, userName }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = useIsActive();

  // Ferme le menu après chaque navigation (y compris un simple changement de paramètres, ex. ?free=1).
  useEffect(() => setOpen(false), [pathname, searchParams]);

  // Bloque le scroll de la page et ferme avec Échap quand le menu est ouvert.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-slate-200"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {/* Portail vers <body> : le backdrop-blur du header piégerait un enfant en position fixed. */}
      {open &&
        createPortal(
          <div
            id="mobile-menu"
            className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-border bg-bg px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {userName && <p className="mb-3 truncate text-sm text-muted">Connecté en tant que {userName}</p>}
            <nav aria-label="Menu principal" className="flex flex-col">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between border-b border-border py-4 text-lg font-semibold ${
                      active ? "text-accent" : "text-slate-100 active:text-accent"
                    }`}
                  >
                    {l.label}
                    {active && <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6">
              {userName ? (
                <form action={logout}>
                  <button className="btn-ghost w-full py-3">Déconnexion</button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" onClick={close} className="btn-ghost py-3">
                    Connexion
                  </Link>
                  <Link href="/signup" onClick={close} className="btn-primary py-3">
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
