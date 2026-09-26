import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { MobileMenu } from "@/components/MobileMenu";

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
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:gap-6">
        <Link href="/" className="shrink-0 text-lg font-black tracking-tight">
          <span className="text-accent">Promo</span>Tracker
        </Link>

        <nav className="hidden flex-1 items-center gap-4 text-sm text-muted md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-muted lg:inline">{name}</span>
              <form action={logout}>
                <button className="btn-ghost py-1.5">Déconnexion</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost py-1.5">
                Connexion
              </Link>
              <Link href="/signup" className="btn-primary py-1.5">
                Inscription
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {!user && (
            <Link href="/signup" className="btn-primary px-3 py-2 text-xs">
              Inscription
            </Link>
          )}
          <MobileMenu links={links} userName={name} />
        </div>
      </div>
    </header>
  );
}
