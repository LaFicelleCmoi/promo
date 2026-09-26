"use client";

import { useActionState, useEffect, useRef } from "react";
import { createWishlistItem, type WishlistFormState } from "@/app/wishlist/actions";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/types";

export function WishlistForm() {
  const [state, action, pending] = useActionState<WishlistFormState, FormData>(createWishlistItem, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="w-title" className="label">
          Jeu à surveiller
        </label>
        <input id="w-title" name="title" required minLength={2} maxLength={120} placeholder="Hollow Knight" className="input" />
      </div>
      <div>
        <label htmlFor="w-platform" className="label">
          Plateforme
        </label>
        <select id="w-platform" name="platform" defaultValue="" className="input">
          <option value="">Toutes</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="w-target" className="label">
          Prix cible
        </label>
        <input id="w-target" name="target_price" inputMode="decimal" placeholder="15" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Ajout…" : "Ajouter"}
      </button>
      {state?.error && (
        <p role="alert" className="text-sm text-danger sm:col-span-4">
          {state.error}
        </p>
      )}
    </form>
  );
}
