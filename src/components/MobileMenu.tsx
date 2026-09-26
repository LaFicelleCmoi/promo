"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/app/auth/actions";

type Props = { links: { href: string; label: string }[]; userName?: string | null };

export function MobileMenu({ links, userName }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le menu après chaque navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Bloque le scroll de la page quand le menu est ouvert.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
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
          <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-border bg-bg px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {userName && <p className="mb-3 truncate text-sm text-muted">Connecté en tant que {userName}</p>}
            <nav className="flex flex-col">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="border-b border-border py-4 text-lg font-semibold text-slate-100 active:text-accent"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6">
              {userName ? (
                <form action={logout}>
                  <button className="btn-ghost w-full py-3">Déconnexion</button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="btn-ghost py-3">
                    Connexion
                  </Link>
                  <Link href="/signup" className="btn-primary py-3">
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
