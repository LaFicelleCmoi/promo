"use client";

import { createUserAction } from "@/app/admin/actions";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";

/** Création d'un compte déjà confirmé, directement depuis le panel. */
export function CreateUserForm() {
  return (
    <details className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold text-white sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-accent">
            ＋
          </span>
          Créer un compte
        </span>
        <span aria-hidden className="text-muted transition group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <AdminForm
        action={createUserAction}
        resetOnSuccess
        className="grid gap-3 border-t border-border p-4 sm:grid-cols-3 sm:p-5"
      >
        <div>
          <label htmlFor="cu-username" className="label">
            Pseudo
          </label>
          <input id="cu-username" name="username" minLength={3} maxLength={30} className="input" />
        </div>
        <div>
          <label htmlFor="cu-email" className="label">
            Email
          </label>
          <input id="cu-email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label htmlFor="cu-password" className="label">
            Mot de passe
          </label>
          <input
            id="cu-password"
            name="password"
            type="text"
            minLength={8}
            required
            autoComplete="off"
            className="input"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
          <input type="checkbox" name="admin" className="h-4 w-4 accent-[var(--color-accent)]" />
          Donner le rôle admin
        </label>
        <SubmitButton variant="primary" pendingLabel="Création…" className="py-2.5 sm:justify-self-end">
          Créer le compte
        </SubmitButton>
      </AdminForm>
    </details>
  );
}
