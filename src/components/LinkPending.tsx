"use client";

import { useLinkStatus } from "next/link";

/** Petit indicateur affiché dans un <Link> pendant le chargement de la page cible. */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`ml-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px] ${
        pending ? "inline-block" : "hidden"
      }`}
    />
  );
}
