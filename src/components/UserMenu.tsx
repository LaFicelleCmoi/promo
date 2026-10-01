"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/auth/actions";
import { CountBadge } from "@/components/NavLinks";
import { Avatar } from "@/components/Avatar";
import type { Avatar as AvatarData } from "@/lib/profile";

/** Menu du compte : avatar (initiale) et liens personnels. */
export function UserMenu({
  name,
  avatar,
  wishlistCount = 0,
  admin = false,
}: {
  name: string;
  avatar: AvatarData;
  wishlistCount?: number;
  admin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface pr-2.5 pl-1.5 text-sm text-slate-200 transition hover:border-accent"
      >
        <Avatar avatar={avatar} name={name} size={28} rounded="rounded-md" />
        <span className="hidden max-w-32 truncate lg:inline">{name}</span>
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`text-muted transition ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-2xl shadow-black/60"
        >
          <p className="truncate border-b border-border px-4 py-2.5 text-xs text-muted">
            Connecté en tant que <span className="font-semibold text-slate-200">{name}</span>
          </p>
          {admin && (
            <Link
              role="menuitem"
              href="/admin"
              className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-400/10"
            >
              <svg
                aria-hidden
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Panel admin
            </Link>
          )}
          <Link
            role="menuitem"
            href="/wishlist"
            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-200 hover:bg-surface-2"
          >
            Ma wishlist
            <CountBadge n={wishlistCount} />
          </Link>
          <Link role="menuitem" href="/compte" className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-surface-2">
            Mon profil
          </Link>
          <Link
            role="menuitem"
            href="/deals/new"
            className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-surface-2"
          >
            Proposer une promo
          </Link>
          <form action={logout} className="border-t border-border">
            <button
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/10"
            >
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
