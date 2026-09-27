"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { openSearch } from "@/components/SearchPalette";

const icons = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  heart: (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="1" />
      <path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z" />
    </>
  ),
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
};

function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg
      aria-hidden
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

/** Barre d'onglets fixe en bas de l'écran sur mobile. */
export function MobileTabBar({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const free = searchParams.get("free") === "1";

  const tabs = [
    { href: "/", label: "Promos", icon: "home" as const, active: pathname === "/" && !free },
    { href: "/?free=1", label: "Gratuits", icon: "gift" as const, active: pathname === "/" && free },
    { href: "/wishlist", label: "Wishlist", icon: "heart" as const, active: pathname.startsWith("/wishlist") },
    loggedIn
      ? { href: "/deals/new", label: "Proposer", icon: "plus" as const, active: pathname.startsWith("/deals/new") }
      : {
          href: "/login",
          label: "Compte",
          icon: "user" as const,
          active: pathname === "/login" || pathname === "/signup",
        },
  ];

  const cls = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition ${
      active ? "text-accent" : "text-muted active:text-white"
    }`;

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto flex max-w-md">
        {tabs.slice(0, 2).map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined} className={cls(t.active)}>
            <Icon name={t.icon} />
            {t.label}
          </Link>
        ))}
        <button type="button" onClick={openSearch} className={cls(false)}>
          <Icon name="search" />
          Rechercher
        </button>
        {tabs.slice(2).map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined} className={cls(t.active)}>
            <Icon name={t.icon} />
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
