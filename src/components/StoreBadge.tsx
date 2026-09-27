import { storeTheme } from "@/lib/stores";

type Props = { store: string; size?: "sm" | "md"; className?: string };

/** Badge de boutique : pastille à la couleur de la boutique + nom en texte neutre. */
export function StoreBadge({ store, size = "sm", className = "" }: Props) {
  const theme = storeTheme(store);
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded border px-1.5 py-0.5 font-medium text-slate-200 ${
        size === "sm" ? "text-[10px] sm:text-[11px]" : "text-xs"
      } ${className}`}
      style={{
        backgroundColor: `color-mix(in oklab, ${theme.color} 13%, transparent)`,
        borderColor: `color-mix(in oklab, ${theme.color} 35%, transparent)`,
      }}
    >
      <StoreDot store={store} />
      <span className="truncate">{store}</span>
    </span>
  );
}

/** Pastille seule, à placer devant un nom de boutique. */
export function StoreDot({ store, className = "" }: { store: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: storeTheme(store).color }}
    />
  );
}
