"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** Barre d'onglets défilante : garde l'onglet actif visible sur mobile. */
export function TabsScroller({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const active = ref.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const nav = ref.current;
    if (!active || !nav || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
  }, [searchParams]);

  return (
    <nav ref={ref} aria-label="Plateformes" className={className}>
      {children}
    </nav>
  );
}
