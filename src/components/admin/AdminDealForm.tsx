"use client";

import { useEffect, useState } from "react";
import { saveDealAction } from "@/app/admin/actions";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { StoreBadge } from "@/components/StoreBadge";
import { computeDiscount, formatPrice } from "@/lib/format";
import { PLATFORMS, PLATFORM_LABELS, type Deal } from "@/lib/types";

type Values = Pick<
  Deal,
  | "title"
  | "platform"
  | "store"
  | "url"
  | "image_url"
  | "normal_price"
  | "sale_price"
  | "discount"
  | "currency"
  | "ends_at"
>;

const EMPTY: Values = {
  title: "",
  platform: "pc",
  store: "",
  url: "",
  image_url: null,
  normal_price: null,
  sale_price: 0,
  discount: 0,
  currency: "EUR",
  ends_at: null,
};

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

/** Date ISO → valeur d'un champ datetime-local (heure locale du navigateur). */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toIso = (local: string) => {
  const d = new Date(local);
  return local && !Number.isNaN(d.getTime()) ? d.toISOString() : "";
};

/** Formulaire complet d'une promo (création ou modification), avec aperçu en direct. */
export function AdminDealForm({ deal, id }: { deal?: Values; id?: string }) {
  const initial = deal ?? EMPTY;
  const [v, setV] = useState({
    title: initial.title,
    platform: initial.platform,
    store: initial.store,
    url: initial.url,
    image_url: initial.image_url ?? "",
    normal_price: initial.normal_price?.toString() ?? "",
    sale_price: deal ? initial.sale_price.toString() : "",
    discount: deal ? initial.discount.toString() : "",
    currency: initial.currency,
    ends_at: "",
  });
  // Heure locale du navigateur : calculée après l'hydratation (le serveur n'a pas le même fuseau).
  useEffect(() => setV((s) => ({ ...s, ends_at: toLocalInput(initial.ends_at) })), [initial.ends_at]);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const sale = num(v.sale_price);
  const normal = num(v.normal_price);
  const autoDiscount = sale !== null ? computeDiscount(normal, sale) : 0;
  const currency = /^[A-Za-z]{3}$/.test(v.currency) ? v.currency.toUpperCase() : "EUR";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <AdminForm action={saveDealAction} hidden={id ? { id } : undefined} className="card space-y-4 p-4 sm:p-5">
        <div>
          <label htmlFor="d-title" className="label">
            Titre
          </label>
          <input
            id="d-title"
            name="title"
            required
            maxLength={200}
            value={v.title}
            onChange={set("title")}
            className="input"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="d-platform" className="label">
              Plateforme
            </label>
            <select id="d-platform" name="platform" value={v.platform} onChange={set("platform")} className="input">
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="d-store" className="label">
              Boutique
            </label>
            <input
              id="d-store"
              name="store"
              required
              maxLength={80}
              value={v.store}
              onChange={set("store")}
              className="input"
            />
          </div>
        </div>
        <div>
          <label htmlFor="d-url" className="label">
            Lien de la promo
          </label>
          <input id="d-url" name="url" type="url" required value={v.url} onChange={set("url")} className="input" />
        </div>
        <div>
          <label htmlFor="d-image" className="label">
            Image (lien)
          </label>
          <input
            id="d-image"
            name="image_url"
            type="url"
            value={v.image_url}
            onChange={set("image_url")}
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="d-sale" className="label">
              Prix promo
            </label>
            <input
              id="d-sale"
              name="sale_price"
              inputMode="decimal"
              required
              value={v.sale_price}
              onChange={set("sale_price")}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="d-normal" className="label">
              Prix normal
            </label>
            <input
              id="d-normal"
              name="normal_price"
              inputMode="decimal"
              value={v.normal_price}
              onChange={set("normal_price")}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="d-discount" className="label">
              Réduction %
            </label>
            <input
              id="d-discount"
              name="discount"
              inputMode="numeric"
              value={v.discount}
              onChange={set("discount")}
              placeholder={`Auto : ${autoDiscount}`}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="d-currency" className="label">
              Devise
            </label>
            <input
              id="d-currency"
              name="currency"
              maxLength={3}
              value={v.currency}
              onChange={set("currency")}
              className="input uppercase"
            />
          </div>
        </div>
        <div>
          <label htmlFor="d-ends" className="label">
            Fin de la promo
          </label>
          <input
            id="d-ends"
            type="datetime-local"
            value={v.ends_at}
            onChange={set("ends_at")}
            className="input sm:max-w-xs"
          />
          {/* Envoyée en ISO (avec fuseau) : le serveur n'a pas à deviner l'heure locale. */}
          <input type="hidden" name="ends_at" value={toIso(v.ends_at)} />
          <p className="mt-1 text-xs text-muted">Vide = sans date de fin.</p>
        </div>
        <SubmitButton variant="primary" pendingLabel="Enregistrement…" className="w-full py-2.5 sm:w-auto">
          {id ? "Enregistrer les modifications" : "Ajouter la promo"}
        </SubmitButton>
      </AdminForm>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="label">Aperçu</p>
        <div className="card overflow-hidden">
          <div className="aspect-[460/215] bg-surface-2">
            {v.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.image_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="space-y-2 p-4">
            {v.store && <StoreBadge store={v.store} />}
            <p className="line-clamp-2 font-semibold text-white">{v.title || "Titre du jeu"}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-deal">{sale !== null ? formatPrice(sale, currency) : "—"}</span>
              {normal !== null && sale !== null && normal > sale && (
                <span className="text-sm text-muted line-through">{formatPrice(normal, currency)}</span>
              )}
              {(num(v.discount) ?? autoDiscount) > 0 && (
                <span className="ml-auto rounded bg-deal px-1.5 py-0.5 text-xs font-black text-black">
                  -{num(v.discount) ?? autoDiscount}%
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
