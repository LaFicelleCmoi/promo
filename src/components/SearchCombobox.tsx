"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchHit } from "@/app/api/search/route";
import { PLATFORM_LABELS, isPlatform } from "@/lib/types";
import { StoreBadge, StoreDot } from "@/components/StoreBadge";

type Props = {
  /** « navigate » : ouvre la fiche jeu ; « select » : remplit un formulaire (wishlist). */
  mode?: "navigate" | "select";
  onSelect?: (hit: SearchHit) => void;
  onSubmitQuery?: (q: string) => void;
  name?: string;
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  inputClassName?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  /** Contenu affiché à droite du champ (bouton…). */
  trailing?: React.ReactNode;
  leadingIcon?: boolean;
};

const price = (h: SearchHit) =>
  h.sale_price === 0
    ? "Gratuit"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: h.currency }).format(h.sale_price);

/** Champ de recherche avec suggestions instantanées (combobox accessible, pilotable au clavier). */
export function SearchCombobox({
  mode = "navigate",
  onSelect,
  onSubmitQuery,
  name = "q",
  id,
  defaultValue = "",
  placeholder = "Rechercher un jeu…",
  autoFocus,
  inputClassName = "input",
  required,
  minLength,
  maxLength,
  trailing,
  leadingIcon = false,
}: Props) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Recherche avec un léger délai pour ne pas interroger la base à chaque touche.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const catalog = mode === "select" ? "&catalog=1" : "";
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}${catalog}`, { signal: controller.signal });
        const json = await res.json();
        setHits(json.hits ?? []);
        setActive(-1);
      } catch {
        // Requête annulée par une nouvelle frappe.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, mode]);

  // Ferme la liste au clic en dehors.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  function choose(hit: SearchHit) {
    setOpen(false);
    if (mode === "select") {
      setValue(hit.title);
      onSelect?.(hit);
    } else {
      router.push(`/jeu/${hit.id}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && hits[active]) {
        e.preventDefault();
        choose(hits[active]);
      } else if (onSubmitQuery) {
        e.preventDefault();
        setOpen(false);
        onSubmitQuery(value.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && value.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full">
      {leadingIcon && (
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
      )}
      <input
        id={id}
        name={name}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />
      {trailing}

      {showList && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/60">
          {loading && hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">Recherche…</p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">
              {mode === "select"
                ? `Aucun jeu trouvé pour « ${value.trim()} ».`
                : `Aucune promo en cours pour « ${value.trim()} ».`}
              {mode === "navigate" && " Ajoute-le à ta wishlist pour être alerté."}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-[60vh] overflow-y-auto py-1">
              {hits.map((hit, i) => (
                <li
                  key={hit.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(hit)}
                  onPointerEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-surface-2" : ""}`}
                >
                  <div className="aspect-[460/215] w-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {hit.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hit.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{hit.title}</p>
                    <p className="truncate text-xs text-muted">
                      <StoreDot store={hit.store} className="mr-1.5 align-middle" />
                      {isPlatform(hit.platform) ? PLATFORM_LABELS[hit.platform] : hit.platform} · {hit.store}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-bold tabular-nums ${hit.kind === "catalog" && hit.discount === 0 ? "text-slate-200" : "text-deal"}`}
                    >
                      {price(hit)}
                    </p>
                    {hit.discount > 0 ? (
                      <p className="text-[11px] text-muted">-{hit.discount}%</p>
                    ) : (
                      hit.kind === "catalog" && <p className="text-[11px] text-muted">prix actuel</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {mode === "navigate" && onSubmitQuery && value.trim().length >= 2 && (
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                onSubmitQuery(value.trim());
              }}
              className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-surface-2 hover:text-white"
            >
              <span>
                Voir tous les résultats pour « <span className="font-semibold text-white">{value.trim()}</span> »
              </span>
              <kbd className="rounded border border-border px-1.5 text-[10px] text-muted">Entrée</kbd>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
