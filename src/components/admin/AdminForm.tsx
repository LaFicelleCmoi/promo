"use client";

import { createContext, use, useTransition } from "react";
import { toast } from "@/components/Toaster";
import type { AdminResult } from "@/app/admin/actions";

const PendingContext = createContext(false);

type Props = {
  action: (prev: AdminResult, formData: FormData) => Promise<AdminResult>;
  hidden?: Record<string, string>;
  /** Demande une confirmation avant d'envoyer (actions destructrices). */
  confirm?: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Formulaire du panel : résultat affiché en toast, champs conservés en cas d'erreur
 * (envoi manuel au lieu de l'attribut action, que React 19 réinitialise après chaque envoi).
 * Le toast part directement après l'action : il s'affiche même si la ligne disparaît de la liste (ex. « Supprimer »).
 */
export function AdminForm({ action, hidden, confirm, resetOnSuccess, className, children }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        if (confirm && !window.confirm(confirm)) return;
        const form = e.currentTarget;
        const data = new FormData(form, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(async () => {
          try {
            const result = await action(undefined, data);
            if (!result) return;
            toast(result.message, { tone: result.ok ? "success" : "error" });
            if (result.ok && resetOnSuccess) form.reset();
          } catch (err) {
            // Redirection demandée par l'action (ex. après une suppression) : gérée par le routeur de Next.
            if (String((err as { digest?: string })?.digest).startsWith("NEXT_REDIRECT")) throw err;
            toast("L'action n'a pas abouti, recharge la page et réessaie.", { tone: "error" });
          }
        });
      }}
    >
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <PendingContext value={pending}>{children}</PendingContext>
    </form>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "danger";
};

const VARIANTS = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20",
};

export function SubmitButton({ children, pendingLabel, variant = "ghost", className = "", ...rest }: ButtonProps) {
  const pending = use(PendingContext);
  return (
    <button type="submit" disabled={pending || rest.disabled} {...rest} className={`${VARIANTS[variant]} ${className}`}>
      {pending && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/** Bouton d'action seul (ex. « Supprimer »), avec ses champs cachés. */
export function ActionButton({
  action,
  hidden,
  confirm,
  className,
  ...button
}: Omit<Props, "children" | "resetOnSuccess"> & Omit<ButtonProps, "hidden">) {
  return (
    <AdminForm action={action} hidden={hidden} confirm={confirm} className="contents">
      <SubmitButton {...button} className={className} />
    </AdminForm>
  );
}

/** Interrupteur qui enregistre aussitôt (ex. activer une source). */
export function SwitchForm({
  action,
  hidden,
  on,
  label,
}: Pick<Props, "action" | "hidden"> & { on: boolean; label: string }) {
  return (
    <AdminForm action={action} hidden={{ ...hidden, enabled: String(!on) }} className="contents">
      <SwitchButton on={on} label={label} />
    </AdminForm>
  );
}

function SwitchButton({ on, label }: { on: boolean; label: string }) {
  const pending = use(PendingContext);
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={pending}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition disabled:opacity-60 ${
        on ? "border-deal/60 bg-deal/80" : "border-border bg-surface-2"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition ${on ? "translate-x-5.5" : "translate-x-0.5"} ${
          pending ? "animate-pulse" : ""
        }`}
      />
    </button>
  );
}

/** Case à cocher présentée en interrupteur, dans un formulaire envoyé d'un bloc (ex. réglages). */
export function Toggle({
  name,
  defaultChecked,
  label,
  description,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full border border-border bg-surface-2 transition peer-checked:border-deal/60 peer-checked:bg-deal/80 peer-focus-visible:ring-2 peer-focus-visible:ring-accent" />
        <span className="absolute top-[3px] left-[3px] h-4.5 w-4.5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
