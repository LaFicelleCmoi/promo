"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchCombobox } from "@/components/SearchCombobox";

const OPEN_EVENT = "promo:open-search";

/** Ouvre la recherche globale depuis n'importe quel bouton. */
export function openSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Bouton de recherche de l'en-tête (peut être affiché plusieurs fois, la palette est unique). */
export function SearchTrigger() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-label="Rechercher un jeu"
        className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted transition hover:border-accent hover:text-white lg:w-56"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden lg:inline">Rechercher…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 text-[10px] lg:inline">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>
    </>
  );
}

/** Recherche globale unique : raccourcis Ctrl/⌘+K et « / », ou boutons SearchTrigger. */
export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => setOpen(false), [pathname, searchParams]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche"
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
            onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div className="w-full max-w-xl">
              <SearchCombobox
                autoFocus
                leadingIcon
                placeholder="Rechercher un jeu, un bundle…"
                onSubmitQuery={(q) => router.push(q ? `/?q=${encodeURIComponent(q)}#resultats` : "/#resultats")}
                inputClassName="h-14 w-full rounded-xl border border-accent/60 bg-surface pr-4 pl-11 text-base text-white shadow-2xl outline-none ring-4 ring-accent/20 placeholder:text-muted"
              />
              <p className="mt-3 text-center text-xs text-muted">
                <kbd className="rounded border border-border px-1">↑</kbd>{" "}
                <kbd className="rounded border border-border px-1">↓</kbd> pour naviguer ·{" "}
                <kbd className="rounded border border-border px-1">Entrée</kbd> pour ouvrir ·{" "}
                <kbd className="rounded border border-border px-1">Échap</kbd> pour fermer
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
