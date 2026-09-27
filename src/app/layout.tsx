import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen overflow-x-clip">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-5 sm:py-8">{children}</main>
        <footer className="mx-auto max-w-7xl space-y-2 border-t border-border px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] text-xs text-muted md:pb-10">
          <p>
            <strong className="text-slate-300">Aucune transaction sur ce site.</strong> Promo Tracker est un comparateur
            de promos : rien n&apos;est vendu ici et aucun paiement ni coordonnée bancaire ne t&apos;est jamais demandé.
            Les achats se font uniquement sur les boutiques officielles.
          </p>
          <p>
            Données : Steam, PlayStation Store, Xbox Store, Nintendo eShop, Epic Games Store, GOG, CheapShark et la
            communauté. Prix indicatifs relevés chaque jour, vérifie sur la boutique avant d&apos;acheter.
          </p>
        </footer>
        <Toaster />
        <BackToTop />
      </body>
    </html>
  );
}
