"use client";

import { useActionState, useState } from "react";
import { createDeal, type DealFormState } from "@/app/deals/actions";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/types";
import { GameImage } from "@/components/GameImage";

/** Boutiques reconnues à partir du lien collé. */
const STORES: { match: RegExp; store: string; platform?: Platform }[] = [
  { match: /(^|\.)playstation\.com$/, store: "PlayStation Store", platform: "playstation" },
  { match: /(^|\.)(xbox|microsoft)\.com$/, store: "Xbox Store", platform: "xbox" },
  { match: /(^|\.)nintendo\.(com|fr|co\.uk|de)$/, store: "Nintendo eShop", platform: "switch" },
  { match: /(^|\.)steampowered\.com$/, store: "Steam", platform: "pc" },
  { match: /(^|\.)epicgames\.com$/, store: "Epic Games Store", platform: "pc" },
  { match: /(^|\.)gog\.com$/, store: "GOG", platform: "pc" },
  { match: /(^|\.)instant-gaming\.com$/, store: "Instant Gaming", platform: "pc" },
  { match: /(^|\.)eneba\.com$/, store: "Eneba" },
  { match: /(^|\.)apps\.apple\.com$/, store: "App Store", platform: "mobile" },
  { match: /(^|\.)play\.google\.com$/, store: "Google Play", platform: "mobile" },
  { match: /(^|\.)amazon\.(fr|com|de|co\.uk|es|it)$/, store: "Amazon" },
  { match: /(^|\.)fnac\.com$/, store: "Fnac" },
  { match: /(^|\.)cdiscount\.com$/, store: "Cdiscount" },
  { match: /(^|\.)micromania\.fr$/, store: "Micromania" },
  { match: /(^|\.)leclerc\.com$|e\.leclerc$/, store: "E.Leclerc" },
  { match: /(^|\.)auchan\.fr$/, store: "Auchan" },
  { match: /(^|\.)carrefour\.fr$/, store: "Carrefour" },
];

function detectStore(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return STORES.find((s) => s.match.test(host)) ?? null;
  } catch {
    return null;
  }
}

const parsePrice = (v: string) => {
  const n = Number(v.trim().replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};
const euro = (n: number) =>
  n === 0 ? "Gratuit" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export function DealForm() {
  const [state, action, pending] = useActionState<DealFormState, FormData>(createDeal, undefined);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("playstation");
  const [store, setStore] = useState("");
  const [url, setUrl] = useState("");
  const [sale, setSale] = useState("");
  const [normal, setNormal] = useState("");
  const [image, setImage] = useState("");
  const [detected, setDetected] = useState<string | null>(null);

  function onUrlChange(value: string) {
    setUrl(value);
    const found = detectStore(value);
    setDetected(found?.store ?? null);
    if (found) {
      // On ne remplace pas une boutique saisie à la main.
      if (!store || STORES.some((s) => s.store === store)) setStore(found.store);
      if (found.platform) setPlatform(found.platform);
    }
  }

  const salePrice = parsePrice(sale);
  const normalPrice = parsePrice(normal);
  const discount =
    salePrice !== null && normalPrice && normalPrice > salePrice ? Math.round((1 - salePrice / normalPrice) * 100) : 0;
  const priceError = salePrice !== null && normalPrice !== null && salePrice > normalPrice;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form action={action} className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <label htmlFor="url" className="label">
            Lien de la promo
          </label>
          <input
            id="url"
            name="url"
            type="url"
            required
            autoFocus
            placeholder="Colle le lien de la page du jeu : https://…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="input"
          />
          <p className="mt-1 min-h-4 text-xs text-muted" aria-live="polite">
            {detected ? (
              <span className="text-deal">✓ Boutique reconnue : {detected}</span>
            ) : (
              "La boutique et la plateforme sont détectées automatiquement."
            )}
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="title" className="label">
            Jeu
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            placeholder="Astro Bot"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="platform" className="label">
            Plateforme
          </label>
          <select
            id="platform"
            name="platform"
            required
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="input"
          >
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
          <input
            id="store"
            name="store"
            required
            maxLength={80}
            placeholder="PlayStation Store, Amazon, Fnac…"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="sale_price" className="label">
            Prix promo (€)
          </label>
          <input
            id="sale_price"
            name="sale_price"
            inputMode="decimal"
            required
            placeholder="29,99"
            value={sale}
            onChange={(e) => setSale(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="normal_price" className="label">
            Prix normal (€)
          </label>
          <input
            id="normal_price"
            name="normal_price"
            inputMode="decimal"
            placeholder="69,99"
            value={normal}
            onChange={(e) => setNormal(e.target.value)}
            aria-invalid={priceError}
            className="input"
          />
          {priceError && <p className="mt-1 text-xs text-danger">Le prix promo dépasse le prix normal.</p>}
        </div>

        <div>
          <label htmlFor="ends_at" className="label">
            Fin de la promo (optionnel)
          </label>
          <input id="ends_at" name="ends_at" type="datetime-local" className="input" />
        </div>

        <div>
          <label htmlFor="image_url" className="label">
            Image (optionnel)
          </label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            placeholder="https://…/cover.jpg"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="input"
          />
        </div>

        {state?.error && (
          <p
            role="alert"
            className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger sm:col-span-2"
          >
            {state.error}
          </p>
        )}

        <div className="sm:col-span-2">
          <button type="submit" disabled={pending || priceError} className="btn-primary w-full py-3 sm:w-auto sm:py-2">
            {pending ? "Publication…" : "Publier la promo"}
          </button>
        </div>
      </form>

      {/* Aperçu en direct de la carte telle qu'elle apparaîtra */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="label mb-2">Aperçu</p>
        <div className="card overflow-hidden">
          <div className="relative aspect-[460/215] bg-surface-2">
            <GameImage
              key={image}
              src={/^https?:\/\//.test(image) ? image : null}
              fallbackLabel={title || "?"}
              className="h-full w-full object-cover"
            />
            {discount > 0 && (
              <span className="absolute top-2 left-2 rounded-md bg-deal px-2 py-0.5 text-sm font-black text-black">
                -{discount}%
              </span>
            )}
          </div>
          <div className="space-y-2 p-4">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-slate-300">{PLATFORM_LABELS[platform]}</span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-muted">{store || "Boutique"}</span>
              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">Communauté</span>
            </div>
            <p className={`line-clamp-2 font-semibold ${title ? "text-white" : "text-muted"}`}>
              {title || "Nom du jeu"}
            </p>
            <div>
              {normalPrice !== null && salePrice !== null && normalPrice > salePrice && (
                <p className="text-xs text-muted line-through">{euro(normalPrice)}</p>
              )}
              <p className="text-lg font-bold text-deal">{salePrice !== null ? euro(salePrice) : "—"}</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Vérifie que le prix est bien affiché sur la boutique : les promos erronées peuvent être supprimées.
        </p>
      </aside>
    </div>
  );
}
