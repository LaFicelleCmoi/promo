"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@/app/auth/actions";
import { CountBadge, useIsActive, type NavLink } from "@/components/NavLinks";
import { openSearch } from "@/components/SearchPalette";
import { Avatar } from "@/components/Avatar";
import type { Avatar as AvatarData } from "@/lib/profile";

type Props = {
  links: NavLink[];
  userName?: string | null;
  avatar?: AvatarData | null;
  wishlistCount?: number;
  admin?: boolean;
};

const ICONS: Record<string, React.ReactNode> = {
  "/": <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  "/?free=1": (
    <>
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z" />
    </>
  ),
  "/wishlist": (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  ),
  "/deals/new": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </svg>
  );
}

export function MobileMenu({ links, userName, avatar, wishlistCount = 0, admin = false }: Props) {
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
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-slate-200"
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
            className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col overflow-y-auto border-t border-border bg-bg px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]"
          >
            {userName ? (
              <Link
                href="/compte"
                onClick={close}
                className="card flex items-center gap-3 p-4 transition active:border-accent"
              >
                <Avatar avatar={avatar ?? { type: "initial", gradient: "aurore" }} name={userName ?? "?"} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{userName}</p>
                  <p className="text-sm text-muted">
                    {wishlistCount > 0
                      ? `${wishlistCount} jeu${wishlistCount > 1 ? "x" : ""} suivi${wishlistCount > 1 ? "s" : ""}`
                      : "Aucun jeu suivi pour l'instant"}
                  </p>
                </div>
                <span className="ml-auto text-xs font-semibold text-accent">Mon profil ›</span>
              </Link>
            ) : (
              <div className="card p-4">
                <p className="font-bold text-white">Suis tes jeux préférés</p>
                <p className="mt-1 text-sm text-muted">Wishlist et alertes de prix, 100 % gratuit.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={close} className="btn-ghost py-2.5">
                    Connexion
                  </Link>
                  <Link href="/signup" onClick={close} className="btn-primary py-2.5">
                    Inscription
                  </Link>
                </div>
              </div>
            )}

            {admin && (
              <Link
                href="/admin"
                onClick={close}
                className="mt-3 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-semibold text-amber-200"
              >
                <Icon>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Icon>
                <span className="flex-1">Panel admin</span>
                <span aria-hidden>›</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                close();
                openSearch();
              }}
              className="mt-4 flex h-12 items-center gap-3 rounded-xl border border-border bg-surface px-4 text-left text-muted"
            >
              <Icon>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </Icon>
              Rechercher un jeu…
            </button>

            <nav aria-label="Menu principal" className="mt-4 flex flex-col gap-1">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-semibold transition ${
                      active ? "bg-accent/10 text-accent" : "text-slate-100 active:bg-surface"
                    }`}
                  >
                    <span className={active ? "text-accent" : "text-muted"}>
                      <Icon>{ICONS[l.href]}</Icon>
                    </span>
                    <span className="flex-1">{l.label}</span>
                    <CountBadge n={l.badge} />
                    <svg
                      aria-hidden
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3 pt-6">
              {userName && (
                <form action={logout}>
                  <button className="btn w-full border border-danger/40 py-3 text-danger hover:bg-danger/10">
                    Déconnexion
                  </button>
                </form>
              )}
              <p className="text-center text-xs text-muted">
                Aucune transaction sur ce site : les achats se font sur les boutiques officielles.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
