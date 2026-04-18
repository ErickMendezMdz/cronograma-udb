create table if not exists public.pretty_salon_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  transaction_date date not null,
  concept text not null,
  category text not null default 'General',
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null default 'Efectivo',
  status text not null default 'paid' check (status in ('paid', 'pending')),
  contact text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pretty_salon_transactions_owner_date_idx
  on public.pretty_salon_transactions (owner_id, transaction_date desc, created_at desc);

create index if not exists pretty_salon_transactions_owner_kind_idx
  on public.pretty_salon_transactions (owner_id, kind, status);

alter table public.pretty_salon_transactions enable row level security;

drop policy if exists "pretty_salon_transactions_select_own"
  on public.pretty_salon_transactions;
create policy "pretty_salon_transactions_select_own"
  on public.pretty_salon_transactions
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "pretty_salon_transactions_insert_own"
  on public.pretty_salon_transactions;
create policy "pretty_salon_transactions_insert_own"
  on public.pretty_salon_transactions
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pretty_salon_transactions_update_own"
  on public.pretty_salon_transactions;
create policy "pretty_salon_transactions_update_own"
  on public.pretty_salon_transactions
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pretty_salon_transactions_delete_own"
  on public.pretty_salon_transactions;
create policy "pretty_salon_transactions_delete_own"
  on public.pretty_salon_transactions
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

drop trigger if exists pretty_salon_transactions_set_updated_at
  on public.pretty_salon_transactions;
create trigger pretty_salon_transactions_set_updated_at
before update on public.pretty_salon_transactions
for each row
execute function public.set_updated_at();
