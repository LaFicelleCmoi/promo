"use client";

import { useState } from "react";
import { toast } from "@/components/Toaster";

/** Partage natif sur mobile, sinon copie du lien dans le presse-papiers. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} en promo sur Promo Tracker`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Lien copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 text-sm text-muted transition hover:text-white"
    >
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
            <path d="M16 6l-4-4-4 4M12 2v13" />
          </>
        )}
      </svg>
      <span role="status">{copied ? "Lien copié" : "Partager cette promo"}</span>
    </button>
  );
}
