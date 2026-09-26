-- Promo Tracker : nouvelles boutiques (Steam, PlayStation, Xbox, GOG) et suivi de l'historique des prix.

alter table public.deals drop constraint if exists deals_source_check;
alter table public.deals add constraint deals_source_check
  check (source in ('steam', 'playstation', 'xbox', 'nintendo', 'epic', 'gog', 'cheapshark', 'community'));

-- Plus bas prix observé depuis le début du suivi, et nombre de jours suivis.
alter table public.deals
  add column if not exists lowest_price numeric(10, 2),
  add column if not exists tracked_days integer not null default 1;

-- Un relevé de prix par jeu et par jour (le plus bas de la journée).
-- Indexé par (source, external_id) et non par deals.id : l'historique survit quand une promo expire puis revient.
create table if not exists public.price_history (
  source       text not null,
  external_id  text not null,
  recorded_on  date not null default current_date,
  price        numeric(10, 2) not null check (price >= 0),
  currency     text not null,
  primary key (source, external_id, recorded_on)
);

alter table public.price_history enable row level security;

create policy "price history is public"
  on public.price_history for select
  using (true);

-- Appelée par /api/sync après chaque synchronisation (clé secrète uniquement).
create or replace function public.record_price_history()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  recorded integer;
begin
  insert into public.price_history (source, external_id, recorded_on, price, currency)
  select source, external_id, current_date, sale_price, currency
  from public.deals
  where source <> 'community'
  on conflict (source, external_id, recorded_on)
    do update set price = least(public.price_history.price, excluded.price);
  get diagnostics recorded = row_count;

  update public.deals d
  set lowest_price = h.lowest, tracked_days = h.days
  from (
    select source, external_id, min(price) as lowest, count(*)::integer as days
    from public.price_history
    group by source, external_id
  ) h
  where h.source = d.source
    and h.external_id = d.external_id
    and (d.lowest_price is distinct from h.lowest or d.tracked_days <> h.days);

  return recorded;
end;
$$;

revoke all on function public.record_price_history() from public, anon, authenticated;

-- « Plus bas prix » : seulement après 3 jours de suivi, sinon tout serait au plus bas dès le premier relevé.
alter table public.deals
  add column if not exists is_lowest boolean
  generated always as (tracked_days >= 3 and lowest_price is not null and sale_price <= lowest_price) stored;

create index if not exists deals_is_lowest_idx on public.deals (is_lowest) where is_lowest;
