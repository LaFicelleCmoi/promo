"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt?: string;
  className?: string;
  fallbackLabel?: string;
  loading?: "lazy" | "eager";
};

/** Image de jeu avec visuel de remplacement si l'image est absente ou ne se charge pas. */
export function GameImage({ src, alt = "", className = "", fallbackLabel, loading = "lazy" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-2 to-bg text-muted"
      >
        {fallbackLabel ? (
          <span className="text-4xl font-black text-muted/50">{fallbackLabel.slice(0, 1).toUpperCase()}</span>
        ) : (
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" />
            <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59l-.9 7.2A2.5 2.5 0 0 0 4.28 18.6c.84 0 1.62-.43 2.07-1.14L8 15h8l1.65 2.46c.45.71 1.23 1.14 2.07 1.14a2.5 2.5 0 0 0 2.48-2.81l-.9-7.2A4 4 0 0 0 17.32 5z" />
          </svg>
        )}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} className={className} />;
}
