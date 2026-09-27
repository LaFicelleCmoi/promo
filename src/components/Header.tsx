import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/supabase/server";
import { MobileMenu } from "@/components/MobileMenu";
import { NavLinks } from "@/components/NavLinks";
import { SearchPalette, SearchTrigger } from "@/components/SearchPalette";
import StarBorder from "@/components/reactbits/StarBorder";
import { UserMenu } from "@/components/UserMenu";
import { MobileTabBar } from "@/components/MobileTabBar";

export async function Header() {
  const user = await getUser();
  const name = (user?.user_metadata?.username as string | undefined) ?? user?.email ?? null;

  const links = [
    { href: "/", label: "Promos" },
    { href: "/?free=1", label: "Gratuits" },
    ...(user
      ? [
          { href: "/wishlist", label: "Ma wishlist" },
          { href: "/deals/new", label: "Proposer une promo" },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:gap-6">
          <Link href="/" aria-label="Promo Tracker — accueil" className="shrink-0 text-lg font-black tracking-tight">
            <span className="text-accent">Promo</span>Tracker
          </Link>

          <nav aria-label="Menu principal" className="hidden flex-1 gap-5 self-stretch text-sm text-muted md:flex">
            <Suspense
              fallback={links.map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center whitespace-nowrap hover:text-white">
                  {l.label}
                </Link>
              ))}
            >
              <NavLinks links={links} />
            </Suspense>
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <SearchTrigger />
            {user ? (
              <UserMenu name={name ?? "Mon compte"} />
            ) : (
              <>
                <Link href="/login" className="btn-ghost py-1.5">
                  Connexion
                </Link>
                <StarBorder as={Link} href="/signup" speed="5s" innerClassName="px-4 py-1.5 text-sm">
                  Inscription
                </StarBorder>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            {!user && (
              <Link href="/signup" className="btn-primary px-3 py-2 text-xs">
                Inscription
              </Link>
            )}
            <Suspense>
              <MobileMenu links={links} userName={name} />
            </Suspense>
          </div>
        </div>
        <Suspense>
          <SearchPalette />
        </Suspense>
      </header>
      {/* En dehors du header : son backdrop-blur piégerait un élément en position fixed. */}
      <Suspense>
        <MobileTabBar loggedIn={Boolean(user)} />
      </Suspense>
    </>
  );
}
