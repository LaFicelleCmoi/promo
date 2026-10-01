import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { MaintenancePage } from "@/components/MaintenancePage";
import { getSettings } from "@/lib/settings";
import { getUser } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { Toaster } from "@/components/Toaster";
import { BackToTop } from "@/components/BackToTop";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Promo Tracker — les promos jeux vidéo, toutes plateformes",
  description:
    "Suis les prix et promos jeux vidéo sur Steam, PlayStation, Xbox, Nintendo eShop, Epic et GOG. Historique, wishlist et alertes de prix.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d12",
};

// Pages accessibles pendant la maintenance (connexion des admins, mentions obligatoires).
const OPEN_DURING_MAINTENANCE = ["/login", "/auth", "/mentions-legales", "/confidentialite", "/cgu"];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, requestHeaders] = await Promise.all([getSettings(), headers()]);
  const path = requestHeaders.get("x-pathname") ?? "/";
  const maintenance =
    settings.maintenance.enabled &&
    !OPEN_DURING_MAINTENANCE.some((p) => path === p || path.startsWith(`${p}/`)) &&
    !isAdmin(await getUser());
  const { announcement } = settings;

  return (
    <html lang="fr">
      <body className="min-h-screen overflow-x-clip">
        {announcement.enabled && announcement.message && (
          <AnnouncementBanner
            message={announcement.message}
            tone={announcement.tone}
            link={announcement.link}
            linkLabel={announcement.linkLabel}
          />
        )}
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
          {maintenance ? <MaintenancePage message={settings.maintenance.message} /> : children}
        </main>
        <footer className="mx-auto max-w-7xl space-y-2 border-t border-border px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] text-xs text-muted md:pb-10">
          <p>
            <strong className="text-slate-300">Aucune transaction sur ce site.</strong> Promo Tracker est un comparateur
            de promos : rien n&apos;est vendu ici et aucun paiement ni coordonnée bancaire ne t&apos;est jamais demandé.
            Les achats se font uniquement sur les boutiques officielles.
          </p>
          <p>
            Données : Steam, PlayStation Store, Xbox Store, Nintendo eShop, Epic Games Store, GOG, CheapShark, Google
            Play et App Store (repérés via Reddit) et la communauté. Prix indicatifs relevés chaque jour, vérifie sur la
            boutique avant d&apos;acheter.
          </p>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité et cookies
            </Link>
            <Link href="/cgu" className="hover:text-white">
              Conditions d&apos;utilisation
            </Link>
            <span>© {new Date().getFullYear()} Promo Tracker</span>
          </nav>
        </footer>
        <Toaster />
        <BackToTop />
      </body>
    </html>
  );
}
