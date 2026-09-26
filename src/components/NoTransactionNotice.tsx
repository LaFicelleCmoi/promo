/** Rappelle que le site ne vend rien : aucun paiement, uniquement des liens vers les boutiques officielles. */
export function NoTransactionNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="flex items-start gap-2 text-xs text-muted">
        <ShieldIcon />
        <span>
          Aucun paiement sur Promo Tracker : l&apos;achat se fait toujours sur la boutique officielle.
        </span>
      </p>
    );
  }

  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm sm:items-center sm:p-4"
    >
      <span className="mt-0.5 shrink-0 text-accent sm:mt-0">
        <ShieldIcon size={20} />
      </span>
      <p className="text-slate-200">
        <strong className="font-semibold text-white">Aucune transaction sur ce site.</strong>{" "}
        Promo Tracker ne vend rien et ne te demandera jamais de carte bancaire : chaque promo renvoie vers la boutique
        officielle (Steam, Epic, eShop…), où se fait l&apos;achat.
      </p>
    </aside>
  );
}

function ShieldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-px shrink-0"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
