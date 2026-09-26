"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Formulaire de filtres : navigation côté client, sans paramètres vides dans l'URL (?q=lego&store=&min=…).
 * Sans JavaScript, il reste un formulaire GET classique.
 */
export function FilterForm({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(e.currentTarget)) {
      if (typeof value === "string" && value.trim() !== "" && !(key === "sort" && value === "discount")) {
        params.set(key, value.trim());
      }
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/?${qs}` : "/", { scroll: false }));
  }

  return (
    <form
      method="get"
      action="/"
      onSubmit={onSubmit}
      data-pending={pending || undefined}
      className={`group ${className ?? ""}`}
    >
      {children}
    </form>
  );
}
