"use client";

import { useActionState, useEffect, useState } from "react";
import { createWishlistItem, type WishlistFormState } from "@/app/wishlist/actions";
import { PLATFORMS, PLATFORM_LABELS, isPlatform } from "@/lib/types";
import { SearchCombobox } from "@/components/SearchCombobox";
import { toast } from "@/components/Toaster";

export function WishlistForm() {
  const [state, action, pending] = useActionState<WishlistFormState, FormData>(createWishlistItem, undefined);
  const [platform, setPlatform] = useState("");
  // Change de clé après un ajout réussi : le formulaire (et la recherche) repartent à zéro.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      toast("Jeu ajouté à ta wishlist");
      setPlatform("");
      setFormKey((k) => k + 1);
    }
  }, [state]);

  return (
    <form key={formKey} action={action} className="card grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="w-title" className="label">
          Jeu à surveiller
        </label>
        <SearchCombobox
          id="w-title"
          name="title"
          mode="select"
          required
          minLength={2}
          maxLength={120}
          placeholder="Hollow Knight, Zelda…"
          onSelect={(hit) => isPlatform(hit.platform) && setPlatform(hit.platform)}
        />
      </div>
      <div>
        <label htmlFor="w-platform" className="label">
          Plateforme
        </label>
        <select
          id="w-platform"
          name="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="input"
        >
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
          Prix cible (€)
        </label>
        <input id="w-target" name="target_price" inputMode="decimal" placeholder="15" className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary py-3 sm:py-2">
        {pending ? "Ajout…" : "Ajouter"}
      </button>
      <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-4">
        <input type="checkbox" name="notify" defaultChecked className="accent-accent" />
        M&apos;envoyer une notification quand une promo correspond
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-danger sm:col-span-4">
          {state.error}
        </p>
      )}
    </form>
  );
}
