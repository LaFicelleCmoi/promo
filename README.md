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
| Notifications | Web Push (service worker + clés VAPID), sans email                     |
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
| Ubisoft Connect    | PC              | EUR    | catalogue du Ubisoft Store (index Algolia public) |
| Epic (CheapShark)  | PC              | USD    | promos payantes de l'Epic Games Store     |
| Google Play        | Mobile          | EUR    | r/googleplaydeals + vérification Google Play |
| App Store          | Mobile          | EUR    | r/AppHookup + API iTunes d'Apple          |
| Communauté         | Toutes          | EUR    | promos proposées par les utilisateurs     |

Seules ces boutiques officielles sont suivies : les revendeurs de clés (Humble, Fanatical, GreenManGaming, IndieGala…)
sont exclus, y compris pour les promos proposées par la communauté (la boutique est déduite du lien).

Les réductions réservées aux abonnés (PS Plus, Game Pass) sont ignorées : seules les promos ouvertes à tous
sont suivies.

### Historique des prix

À chaque synchro, le prix de chaque jeu est enregistré dans `price_history`. Les cartes affichent le **plus bas
prix observé**, et un badge **« Plus bas prix »** apparaît quand le prix actuel égale ce minimum (après au moins
3 jours de suivi). Un filtre permet de n'afficher que ces jeux.

## Gamme de couleurs des boutiques

Chaque boutique a sa couleur (définie dans [`src/lib/stores.ts`](src/lib/stores.ts)), utilisée pour la pastille des
badges, le liseré des cartes et le bouton « Voir sur … ».

| Boutique          | Repère    | Bouton (fond / texte)   |
| ----------------- | --------- | ----------------------- |
| Steam             | `#22c3c3` | `#22c3c3` / `#062a2a`   |
| PlayStation Store | `#4f78ff` | `#0070d1` / blanc       |
| Xbox Store        | `#8bd12c` | `#107c10` / blanc       |
| Nintendo eShop    | `#ff6060` | `#e60012` / blanc       |
| Epic Games Store  | `#f4f4f5` | `#f4f4f5` / `#111111`   |
| GOG               | `#e864e0` | `#86328a` / blanc       |
| Ubisoft Connect   | `#fde047` | `#2563eb` / blanc       |

Les repères sont vérifiés sur fond sombre : contraste ≥ 4,5:1, écart ΔE ≥ 18 entre les 7 boutiques principales en
vision normale (≥ 6 en daltonisme, toléré car le nom de la boutique est toujours écrit). Le texte des badges reste
neutre : la couleur ne porte jamais seule l'information.

## Fonctionnalités

- Liste des promos avec filtres : plateforme, boutique, recherche, réduction minimale, prix max, gratuits, tri.
- Inscription (pseudo, email, mot de passe) avec confirmation par email, connexion, déconnexion.
- Wishlist : jeux à surveiller, plateforme et prix cible optionnels ; les promos correspondantes s'affichent.
- Ajout d'une promo à la wishlist en un clic, partage de promos communautaires (suppression par l'auteur).
- Notifications système quand une promo correspond à un jeu de la wishlist, activables jeu par jeu.
- Suivi quotidien des prix sur Steam, PlayStation, Xbox, eShop, Epic, GOG et Ubisoft Connect, avec historique et plus bas prix.
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

## Notifications

Les alertes de la wishlist sont des **notifications système** (Web Push), sans email : elles s'affichent sur le
téléphone ou l'ordinateur, même site fermé, pour tous les utilisateurs.

- L'utilisateur les active sur chaque appareil depuis **Ma wishlist → Activer les notifications** (bouton « Tester »
  pour vérifier). Sur iPhone (iOS 16.4+), il faut d'abord ajouter le site à l'écran d'accueil.
- Après chaque synchro, `/api/sync` envoie une notification par utilisateur pour les promos pas encore signalées
  (une promo = une seule fois ; le clic ouvre la fiche du jeu ou la wishlist).
- Les abonnements (un par appareil) sont rangés dans `app_metadata.push_subscriptions` du compte Supabase, modifiables
  uniquement côté serveur ; les abonnements expirés sont supprimés automatiquement.
- Variables : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (clés générées avec
  `npx web-push generate-vapid-keys`).

**Inscription sans email** : le compte est créé côté serveur déjà confirmé (`REQUIRE_EMAIL_CONFIRMATION` absent ou
`false`), l'inscription fonctionne donc avec n'importe quelle adresse.

## Panel admin

`/admin`, réservé aux comptes dont `app_metadata.role` vaut `admin` (404 pour tous les autres). Le rôle n'est modifiable que côté serveur : depuis le panel (« Promouvoir admin ») ou l'API d'administration de Supabase.

- **Tableau de bord** : comptes, promos par source et plateforme, jeux les plus suivis, dernière synchro, état du site.
- **Utilisateurs** : recherche, création, rôle admin, suspension (24 h → définitive), pseudo / email / mot de passe, réinitialisation du profil, wishlist, notification individuelle, suppression.
- **Promos** : recherche et filtres, modification de tous les champs, ajout manuel, suppression, « Masquer » (la synchro ne la réimporte plus).
- **Synchro & sources** : synchro complète ou par source, activation des sources, vidage d'une source, relevé des prix, purge, alertes.
- **Notifications** : annonce Web Push à tous les abonnés, historique des alertes.
- **Réglages** : bandeau d'annonce, mode maintenance, inscriptions et propositions ouvertes ou fermées, synchro quotidienne et alertes automatiques.
- **Journal** : les 300 dernières actions admin.

Réglages, journal et dernier rapport de synchro sont rangés en JSON dans le bucket privé `config` de Supabase Storage (aucune table supplémentaire).

## Extension Chrome

Le dossier [`extension/`](extension) contient l'extension (Manifest V3, sans dépendance ni étape de compilation) :

- sur la page d'un jeu des 9 boutiques officielles, un panneau affiche le meilleur prix suivi, le plus bas prix
  observé, les autres offres et un bouton « Suivre ce jeu » (wishlist) ;
- l'icône affiche la réduction du jeu ouvert, et son menu la wishlist en promo et les promos du moment.

Elle appelle `/api/extension/lookup`, `/api/extension/wishlist` et `/api/extension/popup` avec la session du site
(cookies), via son service worker. `npm run extension:build` régénère les icônes et l'archive
`public/promo-tracker-extension.zip`, téléchargeable sur la page `/extension`.

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
    push/                 notifications système (Web Push) des alertes wishlist
    supabase/             clients serveur, admin et proxy (session)
  proxy.ts                rafraîchit la session et protège les pages privées
supabase/migrations/      schéma SQL + RLS
```
