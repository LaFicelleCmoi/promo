-- Promo Tracker : sort pg_trgm du schéma public (recommandation du linter Supabase).
-- L'index trigramme sur deals.title continue de fonctionner.

create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
