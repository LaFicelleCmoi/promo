"use client";

import { useActionState } from "react";
import { createDeal, type DealFormState } from "@/app/deals/actions";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/types";

export function DealForm() {
  const [state, action, pending] = useActionState<DealFormState, FormData>(createDeal, undefined);

  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="title" className="label">
          Jeu
        </label>
        <input id="title" name="title" required maxLength={200} placeholder="Astro Bot" className="input" />
      </div>

      <div>
        <label htmlFor="platform" className="label">
          Plateforme
        </label>
        <select id="platform" name="platform" required defaultValue="playstation" className="input">
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="store" className="label">
          Boutique
        </label>
        <input id="store" name="store" required maxLength={80} placeholder="PlayStation Store, Amazon, Fnac…" className="input" />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="url" className="label">
          Lien de la promo
        </label>
        <input id="url" name="url" type="url" required placeholder="https://…" className="input" />
      </div>

      <div>
        <label htmlFor="sale_price" className="label">
          Prix promo (€)
        </label>
        <input id="sale_price" name="sale_price" inputMode="decimal" required placeholder="29,99" className="input" />
      </div>

      <div>
        <label htmlFor="normal_price" className="label">
          Prix normal (€)
        </label>
        <input id="normal_price" name="normal_price" inputMode="decimal" placeholder="69,99" className="input" />
      </div>

      <div>
        <label htmlFor="ends_at" className="label">
          Fin de la promo
        </label>
        <input id="ends_at" name="ends_at" type="datetime-local" className="input" />
      </div>

      <div>
        <label htmlFor="image_url" className="label">
          Image (optionnel)
        </label>
        <input id="image_url" name="image_url" type="url" placeholder="https://…/cover.jpg" className="input" />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger sm:col-span-2">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
          {pending ? "Publication…" : "Publier la promo"}
        </button>
      </div>
    </form>
  );
}
