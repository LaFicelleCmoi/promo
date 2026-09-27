import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WishlistForm } from "@/components/WishlistForm";
import { WishlistItemCard } from "@/components/WishlistItemCard";
import { NoTransactionNotice } from "@/components/NoTransactionNotice";
import { findGameArt } from "@/lib/gameArt";
import type { Deal, WishlistItem } from "@/lib/types";

export const metadata: Metadata = { title: "Ma wishlist — Promo Tracker" };

async function loadWishlist() {
  const supabase = await createClient();
  const [{ data: items }, { data: matches }] = await Promise.all([
    supabase.from("wishlist").select("*").order("created_at", { ascending: false }),
    supabase.rpc("wishlist_matches"),
  ]);
  const wishlist = (items ?? []) as WishlistItem[];
  const dealsByItem = new Map<string, Deal[]>();
  for (const m of (matches ?? []) as { wishlist_id: string; deal: Deal }[]) {
    dealsByItem.set(m.wishlist_id, [...(dealsByItem.get(m.wishlist_id) ?? []), m.deal]);
  }
  return { wishlist, dealsByItem };
}

async function WishlistList() {
  const { wishlist, dealsByItem } = await loadWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center sm:p-12">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-500/10 text-pink-400"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </span>
        <p className="text-lg font-bold text-white">Ta wishlist est vide</p>
        <p className="max-w-md text-sm text-muted">
          Ajoute un jeu avec le formulaire ci-dessus, ou clique sur le cœur d&apos;une promo : tu seras prévenu dès
          qu&apos;il passe sous ton prix cible.
        </p>
        <Link href="/" className="btn-primary mt-2">
          Découvrir les promos
        </Link>
      </div>
    );
  }

  // Images et prix actuels (hors promo), mis en cache une journée.
  const arts = await Promise.all(
    wishlist.map((item) => (dealsByItem.has(item.id) ? Promise.resolve(null) : findGameArt(item.title, item.platform))),
  );
  const rows = wishlist
    .map((item, i) => ({ item, deals: dealsByItem.get(item.id) ?? [], art: arts[i] }))
    // Les jeux en promo d'abord.
    .sort((a, b) => Number(b.deals.length > 0) - Number(a.deals.length > 0));

  const onSale = rows.filter((r) => r.deals.length > 0).length;
  const alerts = wishlist.filter((w) => w.notify).length;
  const stats = [
    { label: "jeux suivis", value: wishlist.length },
    { label: "en promo maintenant", value: onSale, highlight: onSale > 0 },
    { label: "alertes email actives", value: alerts },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-3 gap-2 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`card px-3 py-3 sm:px-5 sm:py-4 ${s.highlight ? "border-deal/40" : ""}`}>
            <dt className="text-[11px] text-muted sm:text-xs">{s.label}</dt>
            <dd className={`text-2xl font-black tabular-nums sm:text-3xl ${s.highlight ? "text-deal" : "text-white"}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((r) => (
          <WishlistItemCard key={r.item.id} item={r.item} deals={r.deals} art={r.art} />
        ))}
      </div>
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement de ta wishlist">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-20 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card flex animate-pulse flex-col sm:flex-row">
            <div className="aspect-[460/215] bg-surface-2 sm:w-64" />
            <div className="flex-1 space-y-3 p-4">
              <div className="h-5 w-2/3 rounded bg-surface-2" />
              <div className="h-12 rounded bg-surface-2" />
              <div className="h-8 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/wishlist");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Ma wishlist</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Ajoute les jeux que tu attends : dès qu&apos;une promo correspond (et passe sous ton prix cible), elle
          apparaît ici et tu reçois un email.
        </p>
      </div>

      <WishlistForm />
      <NoTransactionNotice compact />

      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistList />
      </Suspense>
    </div>
  );
}
