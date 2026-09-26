import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export async function Header() {
  const user = await getUser();
  const name = (user?.user_metadata?.username as string | undefined) ?? user?.email;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-black tracking-tight">
          <span className="text-accent">Promo</span>Tracker
        </Link>

        <nav className="flex flex-1 items-center gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-white">
            Promos
          </Link>
          <Link href="/?free=1" className="hover:text-white">
            Gratuits
          </Link>
          {user && (
            <>
              <Link href="/wishlist" className="hover:text-white">
                Ma wishlist
              </Link>
              <Link href="/deals/new" className="hover:text-white">
                Proposer une promo
              </Link>
            </>
          )}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{name}</span>
            <form action={logout}>
              <button className="btn-ghost py-1.5">Déconnexion</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost py-1.5">
              Connexion
            </Link>
            <Link href="/signup" className="btn-primary py-1.5">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
