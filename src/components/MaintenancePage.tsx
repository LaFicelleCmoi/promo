import Link from "next/link";

/** Page affichée à la place du site quand le mode maintenance est activé depuis le panel admin. */
export function MaintenancePage({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center">
      <div
        aria-hidden
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/30 bg-amber-400/10 text-4xl shadow-2xl shadow-amber-500/10"
      >
        🛠️
      </div>
      <h1 className="text-3xl font-black tracking-tight">Maintenance en cours</h1>
      <p className="mt-3 text-muted">{message}</p>
      <p className="mt-8 text-xs text-muted">
        Administrateur ?{" "}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
