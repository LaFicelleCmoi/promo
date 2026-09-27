"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "@/app/auth/actions";

type Props = { mode: "login" | "signup"; next?: string; initialError?: string };

const BENEFITS = [
  { title: "Wishlist et alertes", text: "Suis tes jeux, sois prévenu dès qu'ils passent sous ton prix cible." },
  { title: "Historique des prix", text: "Vérifie si une promo est vraiment un bon plan avant d'acheter." },
  { title: "6 boutiques comparées", text: "Steam, PlayStation, Xbox, eShop, Epic et GOG au même endroit." },
  {
    title: "Aucune transaction",
    text: "100 % gratuit, aucune carte bancaire : l'achat se fait sur la boutique officielle.",
  },
];

/** Robustesse indicative du mot de passe (longueur, casse, chiffres, symboles). */
function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length < 8) return { level: 0, label: "Trop court (8 caractères minimum)" };
  if (score <= 2) return { level: 1, label: "Faible" };
  if (score === 3) return { level: 2, label: "Correct" };
  if (score === 4) return { level: 3, label: "Bon" };
  return { level: 4, label: "Excellent" };
}

function PasswordInput({
  id,
  autoComplete,
  minLength,
  value,
  onChange,
}: {
  id: string;
  autoComplete: string;
  minLength?: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-white"
      >
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}

export function AuthForm({ mode, next, initialError }: Props) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : signup,
    initialError ? { error: initialError } : undefined,
  );
  const isSignup = mode === "signup";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const pwd = strength(password);
  const mismatch = isSignup && confirm.length > 0 && confirm !== password;
  const strengthColor = ["bg-danger", "bg-danger", "bg-amber-400", "bg-deal", "bg-deal"][pwd.level];

  return (
    <div className="mx-auto mt-2 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface sm:mt-8 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden border-r border-border bg-surface-2/60 p-8 lg:flex">
        <div aria-hidden className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative">
          <p className="text-lg font-black">
            <span className="text-accent">Promo</span>Tracker
          </p>
          <p className="mt-2 text-2xl leading-tight font-black text-balance">
            {isSignup ? "Ne rate plus jamais une bonne promo." : "Content de te revoir !"}
          </p>
        </div>
        <ul className="relative space-y-4">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-deal/15 text-deal"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="text-sm text-muted">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <div className="p-5 sm:p-8">
        <h1 className="text-2xl font-bold">{isSignup ? "Créer un compte" : "Connexion"}</h1>
        <p className="mt-1 text-sm text-muted">
          {isSignup
            ? "Gratuit, sans carte bancaire. Ton compte est prêt en 10 secondes."
            : "Connecte-toi pour retrouver ta wishlist et tes alertes."}
        </p>

        {state?.message ? (
          <p className="mt-6 rounded-lg border border-deal/40 bg-deal/10 p-4 text-sm text-deal">{state.message}</p>
        ) : (
          <form action={action} className="mt-6 space-y-4">
            {next && <input type="hidden" name="next" value={next} />}

            {isSignup && (
              <div>
                <label htmlFor="username" className="label">
                  Pseudo
                </label>
                <input
                  id="username"
                  name="username"
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="nickname"
                  placeholder="GameHunter"
                  className="input"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="toi@exemple.fr"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <PasswordInput
                id="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : undefined}
                value={password}
                onChange={setPassword}
              />
              {isSignup && password.length > 0 && (
                <div className="mt-2" aria-live="polite">
                  <div className="flex gap-1" aria-hidden>
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full transition ${i <= Math.max(pwd.level, 1) ? strengthColor : "bg-surface-2"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted">Robustesse : {pwd.label}</p>
                </div>
              )}
            </div>

            {isSignup && (
              <div>
                <label htmlFor="confirm" className="label">
                  Confirmer le mot de passe
                </label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirm}
                  onChange={setConfirm}
                />
                {mismatch && (
                  <p className="mt-1 text-xs text-danger" role="alert">
                    Les mots de passe ne correspondent pas.
                  </p>
                )}
              </div>
            )}

            {state?.error && (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                {state.error}
              </p>
            )}

            <button type="submit" disabled={pending || mismatch} className="btn-primary w-full py-3">
              {pending ? "Patiente…" : isSignup ? "S'inscrire" : "Se connecter"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? (
            <>
              Déjà inscrit ?{" "}
              <Link href="/login" className="font-semibold text-accent hover:underline">
                Connexion
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-semibold text-accent hover:underline">
                Créer un compte gratuit
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
