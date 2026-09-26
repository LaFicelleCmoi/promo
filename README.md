# Promo Tracker 🎮

Tracker de promos jeux vidéo **toutes plateformes** (PC, PlayStation, Xbox, Nintendo Switch, mobile) avec
connexion / inscription, wishlist et prix cibles.

## Stack

| Couche        | Techno                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Front + API   | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) |
| Langage       | TypeScript                                                             |
| UI            | Tailwind CSS v4                                                        |
| Base + Auth   | [Supabase](https://supabase.com) (Postgres, Auth email/mot de passe, RLS) |
| Hébergement   | Vercel (+ Vercel Cron pour la synchro quotidienne)                     |

## Sources des promos

| Source            | Plateforme | Boutiques                                                         |
| ----------------- | ---------- | ----------------------------------------------------------------- |
| CheapShark        | PC         | Steam, GOG, Humble, Fanatical, GreenManGaming, Ubisoft, Epic…     |
| Epic Games Store  | PC         | Jeux gratuits / promos mises en avant                             |
| Nintendo eShop EU | Switch     | Toutes les promos eShop (prix en €)                               |
| Communauté        | Toutes     | PlayStation Store, Xbox Store, boîtes physiques, mobile…          |

Sony et Microsoft ne proposent pas d'API publique de promos : les offres PlayStation / Xbox sont partagées par
les utilisateurs connectés via **« Proposer une promo »**.

> Les prix CheapShark sont en USD, les autres en EUR : la devise est affichée sur chaque promo.

## Fonctionnalités

- Liste des promos avec filtres : plateforme, boutique, recherche, réduction minimale, prix max, gratuits, tri.
- Inscription (pseudo, email, mot de passe) avec confirmation par email, connexion, déconnexion.
- Wishlist : jeux à surveiller, plateforme et prix cible optionnels ; les promos correspondantes s'affichent.
- Ajout d'une promo à la wishlist en un clic, partage de promos communautaires (suppression par l'auteur).
- Synchro automatique quotidienne (`/api/sync`) + purge des promos expirées.

## Installation

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Dans **Authentication → URL Configuration**, ajoute `http://localhost:3000/auth/callback`
   (et l'URL de prod) aux *Redirect URLs*.
4. Configure l'environnement :

   ```bash
   cp .env.example .env.local
   ```

   puis remplis les clés (Project Settings → API).
5. Lance le projet :

   ```bash
   npm install
   npm run dev
   ```

6. Remplis la base une première fois :

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/sync
   ```

## Déploiement (Vercel)

Importe le repo sur Vercel, ajoute les variables de `.env.example` (avec `NEXT_PUBLIC_SITE_URL` = URL de prod).
Le cron défini dans [`vercel.json`](vercel.json) appelle `/api/sync` tous les jours à 6h UTC.

## Structure

```
src/
  app/
    page.tsx              liste des promos + filtres
    login/ signup/        connexion / inscription
    auth/                 server actions d'auth + callback de confirmation email
    deals/                proposer / supprimer une promo communautaire
    wishlist/             wishlist et promos correspondantes
    api/sync/route.ts     synchro des sources vers Supabase
  components/             Header, DealCard, Filters, formulaires
  lib/
    sources/              connecteurs CheapShark, Epic, Nintendo
    supabase/             clients serveur, admin et proxy (session)
  proxy.ts                rafraîchit la session et protège les pages privées
supabase/migrations/      schéma SQL + RLS
```
