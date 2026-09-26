-- Promo Tracker : schéma initial
-- À exécuter dans Supabase > SQL Editor (ou `supabase db push`).

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Promos
-- ---------------------------------------------------------------------------
create table if not exists public.deals (
  id            uuid primary key default gen_random_uuid(),
  source        text not null check (source in ('cheapshark', 'epic', 'nintendo', 'community')),
  external_id   text not null default gen_random_uuid()::text,
  title         text not null check (char_length(title) between 1 and 200),
  platform      text not null check (platform in ('pc', 'playstation', 'xbox', 'switch', 'mobile', 'other')),
  store         text not null check (char_length(store) between 1 and 80),
  url           text not null check (url ~* '^https?://'),
  image_url     text check (image_url is null or image_url ~* '^https?://'),
  normal_price  numeric(10, 2) check (normal_price is null or normal_price >= 0),
  sale_price    numeric(10, 2) not null check (sale_price >= 0),
  discount      smallint not null default 0 check (discount between 0 and 100),
  currency      text not null default 'EUR' check (char_length(currency) = 3),
  ends_at       timestamptz,
  created_by    uuid references auth.users (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists deals_platform_idx on public.deals (platform);
create index if not exists deals_discount_idx on public.deals (discount desc);
create index if not exists deals_sale_price_idx on public.deals (sale_price);
create index if not exists deals_created_at_idx on public.deals (created_at desc);
create index if not exists deals_title_trgm_idx on public.deals using gin (title gin_trgm_ops);

alter table public.deals enable row level security;

-- Tout le monde peut lire les promos
create policy "deals are public"
  on public.deals for select
  using (true);

-- Un utilisateur connecté peut proposer une promo communautaire
create policy "users can submit community deals"
  on public.deals for insert
  to authenticated
  with check (source = 'community' and created_by = (select auth.uid()));

-- ... et supprimer les siennes
create policy "users can delete their own deals"
  on public.deals for delete
  to authenticated
  using (source = 'community' and created_by = (select auth.uid()));

-- Les sources automatiques (cheapshark, epic, nintendo) sont écrites
-- par /api/sync avec la clé secrète, qui contourne RLS.

-- Boutiques disponibles (pour les filtres)
create or replace view public.deal_stores
with (security_invoker = true) as
  select store, platform, count(*)::integer as deals
  from public.deals
  where ends_at is null or ends_at > now()
  group by store, platform;

-- ---------------------------------------------------------------------------
-- Wishlist / alertes de prix
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title         text not null check (char_length(title) between 2 and 120),
  platform      text check (platform in ('pc', 'playstation', 'xbox', 'switch', 'mobile', 'other')),
  target_price  numeric(10, 2) check (target_price is null or target_price >= 0),
  created_at    timestamptz not null default now()
);

create unique index if not exists wishlist_unique_idx
  on public.wishlist (user_id, lower(title), coalesce(platform, ''));

alter table public.wishlist enable row level security;

create policy "users manage their own wishlist"
  on public.wishlist for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Promos correspondant à la wishlist de l'utilisateur connecté
-- ---------------------------------------------------------------------------
create or replace function public.wishlist_matches()
returns table (wishlist_id uuid, deal jsonb)
language sql
stable
security invoker
set search_path = ''
as $$
  select w.id, to_jsonb(d)
  from public.wishlist w
  join public.deals d
    on d.title ilike '%' || replace(replace(w.title, '%', '\%'), '_', '\_') || '%'
   and (w.platform is null or d.platform = w.platform)
   and (w.target_price is null or d.sale_price <= w.target_price)
   and (d.ends_at is null or d.ends_at > now())
  where w.user_id = (select auth.uid())
  order by d.sale_price asc;
$$;

-- ---------------------------------------------------------------------------
-- Nettoyage des promos expirées (appelé par /api/sync)
-- ---------------------------------------------------------------------------
create or replace function public.purge_stale_deals(synced_sources text[], older_than timestamptz)
returns integer
language sql
security definer
set search_path = ''
as $$
  with removed as (
    delete from public.deals
    where (source = any (synced_sources) and last_seen_at < older_than)
       or (ends_at is not null and ends_at < now() - interval '1 day')
    returning 1
  )
  select count(*)::integer from removed;
$$;

revoke all on function public.purge_stale_deals(text[], timestamptz) from public, anon, authenticated;
