"use client";

import { useState } from "react";

type Props = { activeCount: number; children: React.ReactNode };

/** Sur mobile, les filtres sont repliés derrière un bouton ; toujours visibles à partir de sm. */
export function FiltersToggle({ activeCount, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost w-full justify-between py-3 sm:hidden"
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtres et tri
          {activeCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-white">{activeCount}</span>
          )}
        </span>
        <span className={`transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      <div className={`${open ? "mt-3 block" : "hidden"} sm:mt-0 sm:block`}>{children}</div>
    </div>
  );
}
