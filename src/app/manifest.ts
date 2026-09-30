import type { MetadataRoute } from "next";

/** Manifeste d'application : installation sur l'écran d'accueil (obligatoire pour les notifications sur iPhone). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promo Tracker",
    short_name: "Promo Tracker",
    description: "Les promos jeux vidéo de toutes les boutiques, avec alertes de prix.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
