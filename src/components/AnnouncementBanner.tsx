"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnnouncementTone } from "@/lib/settings";

const TONES: Record<AnnouncementTone, string> = {
  info: "border-accent/30 bg-accent/15 text-violet-100",
  success: "border-deal/30 bg-deal/15 text-green-100",
  warning: "border-amber-400/30 bg-amber-400/15 text-amber-100",
  danger: "border-danger/30 bg-danger/15 text-red-100",
};

/** Clé courte du message : une nouvelle annonce réapparaît même si la précédente a été fermée. */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7).toString(36);

/** Bandeau d'annonce réglé depuis le panel admin, refermable par chaque visiteur. */
export function AnnouncementBanner({
  message,
  tone,
  link,
  linkLabel,
}: {
  message: string;
  tone: AnnouncementTone;
  link: string | null;
  linkLabel: string;
}) {
  const key = `announcement-closed:${hash(message + (link ?? ""))}`;
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    try {
      setClosed(localStorage.getItem(key) === "1");
    } catch {
      // stockage indisponible : le bandeau reste affiché
    }
  }, [key]);

  if (closed) return null;

  const external = link?.startsWith("http");
  return (
    <div role="region" aria-label="Annonce" className={`border-b ${TONES[tone]}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
        <p className="min-w-0 flex-1">
          {message}
          {link && (
            <>
              {" "}
              <Link
                href={link}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-semibold whitespace-nowrap text-white underline underline-offset-2"
              >
                {linkLabel} →
              </Link>
            </>
          )}
        </p>
        <button
          type="button"
          aria-label="Fermer l'annonce"
          onClick={() => {
            setClosed(true);
            try {
              localStorage.setItem(key, "1");
            } catch {
              // fermé pour cette visite seulement
            }
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-current opacity-70 transition hover:bg-white/10 hover:opacity-100"
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
