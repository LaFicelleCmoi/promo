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
| Emails        | [Resend](https://resend.com) — clé API « Promo Tracker »               |
| Hébergement   | Vercel (+ Vercel Cron pour la synchro quotidienne)                     |

## Sources des prix

Les prix sont relevés chaque jour directement sur les boutiques officielles :

| Boutique           | Plateforme      | Devise | Méthode                                   |
| ------------------ | --------------- | ------ | ----------------------------------------- |
| Steam              | PC              | EUR    | recherche des promos du magasin Steam     |
| PlayStation Store  | PS5 / PS4       | EUR    | API GraphQL du store (catégorie Promos)   |
| Xbox Store         | Xbox / PC       | EUR    | API de xbox.com (« Offres sur les jeux ») |
| Nintendo eShop     | Switch          | EUR    | API de recherche Nintendo Europe          |
| Epic Games Store   | PC              | EUR    | jeux gratuits / promos mises en avant     |
| GOG                | PC              | EUR    | API catalogue GOG                         |
| CheapShark         | PC              | USD    | autres revendeurs (Humble, Fanatical…)    |
| Communauté         | Toutes          | EUR    | promos proposées par les utilisateurs     |

Les réductions réservées aux abonnés (PS Plus, Game Pass) sont ignorées : seules les promos ouvertes à tous
sont suivies.

### Historique des prix

À chaque synchro, le prix de chaque jeu est enregistré dans `price_history`. Les cartes affichent le **plus bas
prix observé**, et un badge **« Plus bas prix »** apparaît quand le prix actuel égale ce minimum (après au moins
3 jours de suivi). Un filtre permet de n'afficher que ces jeux.

## Fonctionnalités

- Liste des promos avec filtres : plateforme, boutique, recherche, réduction minimale, prix max, gratuits, tri.
- Inscription (pseudo, email, mot de passe) avec confirmation par email, connexion, déconnexion.
- Wishlist : jeux à surveiller, plateforme et prix cible optionnels ; les promos correspondantes s'affichent.
- Ajout d'une promo à la wishlist en un clic, partage de promos communautaires (suppression par l'auteur).
- Alertes email (Resend) quand une promo correspond à un jeu de la wishlist, activables jeu par jeu.
- Suivi quotidien des prix sur Steam, PlayStation, Xbox, eShop, Epic et GOG, avec historique et plus bas prix.
- Synchro automatique quotidienne (`/api/sync`) + purge des promos expirées.

## Installation

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute dans l'ordre les fichiers de [`supabase/migrations/`](supabase/migrations/)
   (`0001` à `0004`).
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

## Emails (Resend)

Tous les emails utilisent la clé API Resend **« Promo Tracker »**.

**Alertes wishlist** — mets la clé dans `RESEND_API_KEY`. Après chaque synchro, `/api/sync` envoie à chaque
utilisateur un email récapitulant les nouvelles promos de sa wishlist (une promo n'est notifiée qu'une fois).

**Emails d'inscription / confirmation (Supabase Auth)** — dans Supabase, *Authentication → Emails → SMTP Settings* :

| Champ          | Valeur                                    |
| -------------- | ----------------------------------------- |
| Host           | `smtp.resend.com`                         |
| Port           | `465`                                     |
| Username       | `resend`                                  |
| Password       | la clé API « Promo Tracker »              |
| Sender email   | l'adresse de `EMAIL_FROM`                 |
| Sender name    | `Promo Tracker`                           |

> Sans domaine vérifié sur Resend, l'expéditeur `onboarding@resend.dev` ne peut écrire **qu'à l'adresse du
> compte Resend**. Ajoute et vérifie ton domaine (*Resend → Domains*) pour écrire à tous les utilisateurs.

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
    sources/              connecteurs Steam, PlayStation, Xbox, Nintendo, Epic, GOG, CheapShark
    email/                alertes wishlist et template d'email (Resend)
    supabase/             clients serveur, admin et proxy (session)
  proxy.ts                rafraîchit la session et protège les pages privées
supabase/migrations/      schéma SQL + RLS
```
