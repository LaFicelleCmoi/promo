import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promo Tracker — les promos jeux vidéo, toutes plateformes",
  description: "Suis les promos jeux vidéo sur PC, PlayStation, Xbox et Nintendo Switch. Wishlist et alertes de prix.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted">
          Données : CheapShark, Epic Games Store, Nintendo eShop et la communauté. Prix indicatifs, vérifie sur la
          boutique avant d&apos;acheter.
        </footer>
      </body>
    </html>
  );
}
