"use client";

import { useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleWishlist } from "@/app/wishlist/actions";
import { toast } from "@/components/Toaster";

type Props = {
  title: string;
  platform: string;
  initial: boolean;
  loggedIn: boolean;
  variant?: "icon" | "full";
};

/** Cœur « wishlist » : état immédiat (optimiste), puis confirmé par le serveur. */
export function WishlistButton({ title, platform, initial, loggedIn, variant = "icon" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function onClick() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setError(false);
    startTransition(async () => {
      setOptimistic(!saved);
      const result = await toggleWishlist(title, platform);
      if (result.error === "login") return router.push(`/login?next=${encodeURIComponent(pathname)}`);
      if (result.error) {
        setError(true);
        toast("Impossible de mettre à jour ta wishlist, réessaie.", { tone: "error" });
      } else if (result.inWishlist) {
        toast("Ajouté à ta wishlist", { action: { label: "Voir", href: "/wishlist" } });
      } else {
        toast("Retiré de ta wishlist", { tone: "info" });
      }
      setSaved(result.inWishlist);
    });
  }

  const label = optimistic ? "Retirer de ma wishlist" : "Ajouter à ma wishlist";
  const heart = (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={optimistic ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${optimistic ? "scale-110" : ""}`}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );

  if (variant === "full") {
    return (
      <div>
        <button
          type="button"
          onClick={onClick}
          aria-pressed={optimistic}
          disabled={pending}
          className={`btn w-full border py-3 ${
            optimistic
              ? "border-pink-500/50 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20"
              : "border-border bg-surface text-slate-200 hover:border-pink-500/60 hover:text-white"
          }`}
        >
          {heart}
          {optimistic ? "Dans ma wishlist" : "Suivre ce jeu"}
        </button>
        <p role="status" className="mt-2 min-h-4 text-center text-xs text-muted">
          {error
            ? "Oups, réessaie dans un instant."
            : optimistic
              ? "Tu seras alerté quand le prix baisse."
              : !loggedIn
                ? "Connexion requise pour suivre un jeu."
                : ""}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      disabled={pending}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
        optimistic
          ? "border-pink-500/50 bg-pink-500/15 text-pink-400"
          : "border-border bg-surface text-muted hover:border-pink-500/60 hover:text-pink-400"
      } ${error ? "ring-2 ring-danger/60" : ""}`}
    >
      {heart}
    </button>
  );
}
