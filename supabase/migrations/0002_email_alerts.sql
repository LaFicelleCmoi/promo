-- Promo Tracker : alertes email de la wishlist (envoyées via Resend par /api/sync)

alter table public.wishlist
  add column if not exists notify boolean not null default true;

-- Historique des alertes envoyées : une promo n'est notifiée qu'une fois par jeu surveillé.
create table if not exists public.alert_log (
  wishlist_id  uuid not null references public.wishlist (id) on delete cascade,
  deal_id      uuid not null references public.deals (id) on delete cascade,
  sent_at      timestamptz not null default now(),
  primary key (wishlist_id, deal_id)
);

-- Accessible uniquement avec la clé secrète (aucune policy).
alter table public.alert_log enable row level security;

-- Promos correspondant aux wishlists, pas encore notifiées, avec l'email du destinataire.
create or replace function public.pending_wishlist_alerts()
returns table (
  wishlist_id  uuid,
  user_id      uuid,
  email        text,
  username     text,
  wish_title   text,
  deal         jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id,
    w.user_id,
    u.email::text,
    coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email::text, '@', 1)),
    w.title,
    to_jsonb(d)
  from public.wishlist w
  join auth.users u on u.id = w.user_id
  join public.deals d
    on d.title ilike '%' || replace(replace(w.title, '%', '\%'), '_', '\_') || '%'
   and (w.platform is null or d.platform = w.platform)
   and (w.target_price is null or d.sale_price <= w.target_price)
   and (d.ends_at is null or d.ends_at > now())
  where w.notify
    and u.email is not null
    and u.email_confirmed_at is not null
    and not exists (
      select 1 from public.alert_log l where l.wishlist_id = w.id and l.deal_id = d.id
    )
  order by w.user_id, d.discount desc;
$$;

revoke all on function public.pending_wishlist_alerts() from public, anon, authenticated;
