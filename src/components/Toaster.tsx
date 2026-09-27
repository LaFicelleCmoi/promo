"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Toast = {
  id: number;
  message: string;
  action?: { label: string; href: string };
  tone?: "success" | "info" | "error";
};

const listeners = new Set<(t: Toast) => void>();
let nextId = 1;

/** Affiche une notification éphémère (utilisable depuis n'importe quel composant client). */
export function toast(message: string, options: Omit<Toast, "id" | "message"> = {}) {
  const t = { id: nextId++, message, ...options };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const add = (t: Toast) => {
      setToasts((list) => [...list.slice(-2), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), 4000);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 text-sm text-white shadow-2xl shadow-black/60 backdrop-blur"
        >
          <span
            aria-hidden
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              t.tone === "error"
                ? "bg-danger/20 text-danger"
                : t.tone === "info"
                  ? "bg-surface-2 text-slate-300"
                  : "bg-deal/20 text-deal"
            }`}
          >
            {t.tone === "error" ? "!" : "✓"}
          </span>
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <Link href={t.action.href} className="font-semibold text-accent hover:text-accent-hover">
              {t.action.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
