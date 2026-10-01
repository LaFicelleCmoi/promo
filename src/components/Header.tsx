import Link from "next/link";
import { Suspense } from "react";
import { createClient, getUser } from "@/lib/supabase/server";
import { MobileMenu } from "@/components/MobileMenu";
import { NavLinks } from "@/components/NavLinks";
import { SearchPalette, SearchTrigger } from "@/components/SearchPalette";
import StarBorder from "@/components/reactbits/StarBorder";
import { UserMenu } from "@/components/UserMenu";
import { MobileTabBar } from "@/components/MobileTabBar";
import { ACCENTS, parseProfile } from "@/lib/profile";
import { isAdmin } from "@/lib/admin";

export async function Header() {
  const user = await getUser();
  const profile = user ? parseProfile(user.user_metadata, user.email?.split("@")[0]) : null;
  const name = profile?.username ?? null;
  const admin = isAdmin(user);

  // Personnalisation du compte appliquée à tout le site, rendue côté serveur (pas de clignotement).
  const themeCss = profile
    ? [
        profile.accent !== "violet" &&
          `:root{--color-accent:${ACCENTS[profile.accent].color};--color-accent-hover:${ACCENTS[profile.accent].hover}}`,
        profile.density === "compact" &&
          "@media (min-width:768px){.deal-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (min-width:1280px){.deal-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}.deal-grid h3{font-size:.875rem}",
        profile.reduceMotion &&
          ".aurora-bg{display:none}*,*::before,*::after{animation-duration:0s!important;animation-iteration-count:1!important;transition-duration:0s!important;scroll-behavior:auto!important}",
      ]
        .filter(Boolean)
        .join("")
    : "";

  // Nombre de jeux en wishlist, affiché à côté des liens « Ma wishlist ».
  let wishlistCount = 0;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase.from("wishlist").select("id", { count: "exact", head: true });
    wishlistCount = count ?? 0;
  }

  const links = [
    { href: "/", label: "Promos" },
    { href: "/?free=1", label: "Gratuits" },
    ...(user
      ? [
          { href: "/wishlist", label: "Ma wishlist", badge: wishlistCount },
          { href: "/deals/new", label: "Proposer une promo" },
        ]
      : []),
  ];

  return (
    <>
      {themeCss && <style>{themeCss}</style>}
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
              <UserMenu
                name={name ?? "Mon compte"}
                avatar={profile!.avatar}
                wishlistCount={wishlistCount}
                admin={admin}
              />
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
              <MobileMenu
                links={links}
                userName={name}
                avatar={profile?.avatar}
                wishlistCount={wishlistCount}
                admin={admin}
              />
            </Suspense>
          </div>
        </div>
        <Suspense>
          <SearchPalette />
        </Suspense>
      </header>
      {/* En dehors du header : son backdrop-blur piégerait un élément en position fixed. */}
      <Suspense>
        <MobileTabBar loggedIn={Boolean(user)} wishlistCount={wishlistCount} />
      </Suspense>
    </>
  );
}
