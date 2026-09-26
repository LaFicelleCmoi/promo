"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/auth/actions";

type Props = { mode: "login" | "signup"; next?: string; initialError?: string };

export function AuthForm({ mode, next, initialError }: Props) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : signup,
    initialError ? { error: initialError } : undefined,
  );
  const isSignup = mode === "signup";

  return (
    <div className="card mx-auto mt-2 w-full max-w-md p-5 sm:mt-10 sm:p-8">
      <h1 className="text-2xl font-bold">{isSignup ? "Créer un compte" : "Connexion"}</h1>
      <p className="mt-1 text-sm text-muted">
        {isSignup
          ? "Wishlist, alertes de prix et partage de promos."
          : "Content de te revoir ! Connecte-toi pour retrouver ta wishlist."}
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
              <input id="username" name="username" required minLength={3} maxLength={30} className="input" />
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 8 : undefined}
              className="input"
            />
          </div>

          {isSignup && (
            <div>
              <label htmlFor="confirm" className="label">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="input"
              />
            </div>
          )}

          {state?.error && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full py-3 sm:py-2">
            {pending ? "Patiente…" : isSignup ? "S'inscrire" : "Se connecter"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? (
          <>
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Connexion
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Inscription
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
