create table if not exists public.spotify_family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  monthly_amount numeric(12, 2) not null default 2 check (monthly_amount > 0),
  start_month text not null check (start_month ~ '^[0-9]{4}-[0-9]{2}$'),
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spotify_family_members_owner_order_idx
  on public.spotify_family_members (owner_id, display_order, created_at);

create table if not exists public.spotify_family_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  member_id uuid not null references public.spotify_family_members (id) on delete cascade,
  billing_month text not null check (billing_month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount numeric(12, 2) not null check (amount > 0),
  payment_date date not null,
  payment_method text not null default 'Cuenta Banco',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, billing_month)
);

create index if not exists spotify_family_payments_owner_month_idx
  on public.spotify_family_payments (owner_id, billing_month desc, created_at desc);

alter table public.spotify_family_members enable row level security;
alter table public.spotify_family_payments enable row level security;

drop policy if exists "spotify_family_members_select_own"
  on public.spotify_family_members;
create policy "spotify_family_members_select_own"
  on public.spotify_family_members
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "spotify_family_members_insert_own"
  on public.spotify_family_members;
create policy "spotify_family_members_insert_own"
  on public.spotify_family_members
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "spotify_family_members_update_own"
  on public.spotify_family_members;
create policy "spotify_family_members_update_own"
  on public.spotify_family_members
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "spotify_family_members_delete_own"
  on public.spotify_family_members;
create policy "spotify_family_members_delete_own"
  on public.spotify_family_members
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "spotify_family_payments_select_own"
  on public.spotify_family_payments;
create policy "spotify_family_payments_select_own"
  on public.spotify_family_payments
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "spotify_family_payments_insert_own"
  on public.spotify_family_payments;
create policy "spotify_family_payments_insert_own"
  on public.spotify_family_payments
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "spotify_family_payments_update_own"
  on public.spotify_family_payments;
create policy "spotify_family_payments_update_own"
  on public.spotify_family_payments
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "spotify_family_payments_delete_own"
  on public.spotify_family_payments;
create policy "spotify_family_payments_delete_own"
  on public.spotify_family_payments
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists spotify_family_members_set_updated_at
  on public.spotify_family_members;
create trigger spotify_family_members_set_updated_at
before update on public.spotify_family_members
for each row
execute function public.set_updated_at();

drop trigger if exists spotify_family_payments_set_updated_at
  on public.spotify_family_payments;
create trigger spotify_family_payments_set_updated_at
before update on public.spotify_family_payments
for each row
execute function public.set_updated_at();
