"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, uploadAvatar } from "@/app/compte/profile-actions";
import { Avatar } from "@/components/Avatar";
import { toast } from "@/components/Toaster";
import {
  ACCENTS,
  AVATAR_ICONS,
  AVATAR_ICON_LABELS,
  GRADIENTS,
  PATTERNS,
  TITLES,
  bannerBackground,
  type AccentKey,
  type AvatarIcon,
  type GradientKey,
  type PatternKey,
  type Profile,
} from "@/lib/profile";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/types";

type Props = { initial: Profile };

/** Recadre l'image au centre en carré 256 px et la compresse en WebP, directement dans le navigateur. */
async function toAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("conversion"))), "image/webp", 0.85),
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="font-bold text-white">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Swatch({
  selected,
  onClick,
  label,
  style,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      style={style}
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
        selected
          ? "ring-2 ring-white ring-offset-2 ring-offset-surface"
          : "opacity-80 hover:scale-105 hover:opacity-100"
      }`}
    >
      {children}
    </button>
  );
}

export function ProfileEditor({ initial }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(initial.username);
  const [p, setP] = useState<Omit<Profile, "username">>(() => {
    const { username: _u, ...rest } = initial;
    return rest;
  });
  const [saved, setSaved] = useState(() => JSON.stringify({ username: initial.username, ...p }));
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = useMemo(() => JSON.stringify({ username, ...p }) !== saved, [username, p, saved]);
  const set = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) => setP((prev) => ({ ...prev, [key]: value }));

  // Aperçu en direct de la couleur d'accent sur tout le site.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--color-accent", ACCENTS[p.accent].color);
    root.setProperty("--color-accent-hover", ACCENTS[p.accent].hover);
  }, [p.accent]);
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty("--color-accent");
      document.documentElement.style.removeProperty("--color-accent-hover");
    },
    [],
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Choisis une image (JPG, PNG, WebP…).", { tone: "error" });
    setUploading(true);
    try {
      const blob = await toAvatarBlob(file);
      const form = new FormData();
      form.append("file", new File([blob], "avatar.webp", { type: "image/webp" }));
      const { url, error } = await uploadAvatar(form);
      if (error || !url) throw new Error(error);
      set("avatar", { type: "photo", url });
      toast("Photo prête : pense à enregistrer.", { tone: "info" });
    } catch (err) {
      toast(err instanceof Error && err.message ? err.message : "Impossible d'utiliser cette image.", {
        tone: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  function save() {
    startTransition(async () => {
      const result = await saveProfile({ username, profile: p });
      if (!result.ok) return void toast(result.error ?? "Erreur", { tone: "error" });
      setSaved(JSON.stringify({ username, ...p }));
      toast("Profil enregistré");
      router.refresh();
    });
  }

  const avatarGradient: GradientKey = p.avatar.type === "photo" ? "aurore" : p.avatar.gradient;
  const togglePlatform = (pl: Platform) =>
    set("platforms", p.platforms.includes(pl) ? p.platforms.filter((x) => x !== pl) : [...p.platforms, pl]);

  return (
    <div className="space-y-6 pb-24">
      {/* Aperçu de la carte de profil */}
      <div className="card overflow-hidden">
        <div className="h-28 sm:h-36" style={bannerBackground(p.banner.gradient, p.banner.pattern)} />
        <div className="relative px-4 pb-5 sm:px-6">
          <div className="-mt-11 flex items-end gap-4">
            <Avatar avatar={p.avatar} name={username} size={88} rounded="rounded-2xl" className="ring-4 ring-surface" />
            {p.title && (
              <span className="mb-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                {p.title}
              </span>
            )}
          </div>
          <p className="mt-3 text-xl font-black text-white">{username || "Pseudo"}</p>
          <p className="mt-1 min-h-5 text-sm text-slate-300">
            {p.bio || <span className="text-muted">Ta bio apparaîtra ici.</span>}
          </p>
          {p.platforms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.platforms.map((pl) => (
                <span key={pl} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-slate-300">
                  {PLATFORM_LABELS[pl]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Section title="Avatar" hint="Une photo, ton initiale ou une icône, sur le dégradé de ton choix.">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-2 p-1 text-sm font-semibold">
          {(
            [
              ["photo", "Photo"],
              ["initial", "Initiale"],
              ["icon", "Icône"],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              aria-pressed={p.avatar.type === type}
              onClick={() =>
                type === "photo"
                  ? p.avatar.type !== "photo" && fileRef.current?.click()
                  : set(
                      "avatar",
                      type === "icon"
                        ? { type, icon: "manette", gradient: avatarGradient }
                        : { type, gradient: avatarGradient },
                    )
              }
              className={`rounded-lg py-2 transition ${p.avatar.type === type ? "bg-accent text-white" : "text-muted hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {p.avatar.type === "photo" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Avatar avatar={p.avatar} name={username} size={64} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-ghost py-2"
            >
              {uploading ? "Envoi…" : "Changer de photo"}
            </button>
            <p className="text-xs text-muted">Recadrée en carré et compressée avant l&apos;envoi.</p>
          </div>
        ) : (
          <>
            {uploading && <p className="text-sm text-muted">Envoi de la photo…</p>}
            <div>
              <p className="label">Dégradé</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(GRADIENTS) as GradientKey[]).map((g) => (
                  <Swatch
                    key={g}
                    label={GRADIENTS[g].label}
                    selected={avatarGradient === g}
                    onClick={() =>
                      set("avatar", { ...(p.avatar as { type: "initial" }), gradient: g } as Profile["avatar"])
                    }
                    style={{ backgroundImage: `linear-gradient(135deg, ${GRADIENTS[g].from}, ${GRADIENTS[g].to})` }}
                  />
                ))}
              </div>
            </div>
            {p.avatar.type === "icon" && (
              <div>
                <p className="label">Icône</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(AVATAR_ICONS) as AvatarIcon[]).map((icon) => (
                    <Swatch
                      key={icon}
                      label={AVATAR_ICON_LABELS[icon]}
                      selected={p.avatar.type === "icon" && p.avatar.icon === icon}
                      onClick={() => set("avatar", { type: "icon", icon, gradient: avatarGradient })}
                      style={{ backgroundColor: "var(--color-surface-2)" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-200"
                      >
                        <path d={AVATAR_ICONS[icon]} />
                      </svg>
                    </Swatch>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      <Section title="Identité">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-username" className="label">
              Pseudo
            </label>
            <input
              id="pf-username"
              value={username}
              maxLength={30}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="pf-title" className="label">
              Titre
            </label>
            <select
              id="pf-title"
              value={p.title ?? ""}
              onChange={(e) => set("title", e.target.value || null)}
              className="input"
            >
              <option value="">Aucun</option>
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="pf-bio" className="label">
            Bio
          </label>
          <textarea
            id="pf-bio"
            value={p.bio}
            maxLength={160}
            rows={3}
            placeholder="Fan de RPG, toujours à l'affût d'un -80 %…"
            onChange={(e) => set("bio", e.target.value)}
            className="input resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted tabular-nums">{p.bio.length}/160</p>
        </div>
      </Section>

      <Section title="Bannière">
        <div>
          <p className="label">Dégradé</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(GRADIENTS) as GradientKey[]).map((g) => (
              <Swatch
                key={g}
                label={GRADIENTS[g].label}
                selected={p.banner.gradient === g}
                onClick={() => set("banner", { ...p.banner, gradient: g })}
                style={{ backgroundImage: `linear-gradient(135deg, ${GRADIENTS[g].from}, ${GRADIENTS[g].to})` }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="label">Motif</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PATTERNS) as PatternKey[]).map((pt) => (
              <button
                key={pt}
                type="button"
                aria-pressed={p.banner.pattern === pt}
                onClick={() => set("banner", { ...p.banner, pattern: pt })}
                className="overflow-hidden rounded-xl border border-border text-xs font-semibold text-white transition aria-pressed:ring-2 aria-pressed:ring-white"
              >
                <span className="block h-10 w-20" style={bannerBackground(p.banner.gradient, pt)} />
                <span className="block bg-surface-2 py-1">{PATTERNS[pt]}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Apparence du site" hint="S'applique sur tous les appareils où tu es connecté.">
        <div>
          <p className="label">Couleur d&apos;accent</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACCENTS) as AccentKey[]).map((a) => (
              <Swatch
                key={a}
                label={ACCENTS[a].label}
                selected={p.accent === a}
                onClick={() => set("accent", a)}
                style={{ backgroundColor: ACCENTS[a].color }}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["comfortable", "Confortable", "Grandes cartes, plus d'espace"],
              ["compact", "Compacte", "Plus de promos à l'écran"],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              aria-pressed={p.density === value}
              onClick={() => set("density", value)}
              className={`rounded-xl border p-3 text-left transition ${
                p.density === value ? "border-accent bg-accent/10" : "border-border hover:border-accent/60"
              }`}
            >
              <p className="font-semibold text-white">{label}</p>
              <p className="text-xs text-muted">{hint}</p>
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <span>
            <span className="block font-semibold text-white">Réduire les animations</span>
            <span className="text-xs text-muted">Coupe le fond animé, les compteurs et les effets de mouvement.</span>
          </span>
          <input
            type="checkbox"
            checked={p.reduceMotion}
            onChange={(e) => set("reduceMotion", e.target.checked)}
            className="h-5 w-5 accent-accent"
          />
        </label>
      </Section>

      <Section
        title="Mes plateformes"
        hint="Ajoute un onglet « ★ Mes plateformes » sur l'accueil pour ne voir que leurs promos."
      >
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((pl) => {
            const on = p.platforms.includes(pl);
            return (
              <button
                key={pl}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlatform(pl)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  on ? "border-accent bg-accent text-white" : "border-border text-slate-300 hover:border-accent"
                }`}
              >
                {on ? "✓ " : ""}
                {PLATFORM_LABELS[pl]}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Barre d'enregistrement, visible dès qu'il y a des modifications */}
      <div
        className={`fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 transition md:bottom-6 ${
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-surface/95 p-3 shadow-2xl shadow-black/60 backdrop-blur">
          <p className="text-sm text-slate-300">Modifications non enregistrées</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const s = JSON.parse(saved);
                setUsername(s.username);
                const { username: _u, ...rest } = s;
                setP(rest);
              }}
              className="btn-ghost py-2"
            >
              Annuler
            </button>
            <button type="button" onClick={save} disabled={pending} className="btn-primary py-2">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
