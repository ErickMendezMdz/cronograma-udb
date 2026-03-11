create table if not exists public.tank_budgets (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tank_expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'General',
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists tank_expenses_owner_date_idx
  on public.tank_expenses (owner_id, expense_date desc, created_at desc);

alter table public.tank_budgets enable row level security;
alter table public.tank_expenses enable row level security;

drop policy if exists "tank_budgets_select_own" on public.tank_budgets;
create policy "tank_budgets_select_own"
  on public.tank_budgets
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "tank_budgets_insert_own" on public.tank_budgets;
create policy "tank_budgets_insert_own"
  on public.tank_budgets
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "tank_budgets_update_own" on public.tank_budgets;
create policy "tank_budgets_update_own"
  on public.tank_budgets
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "tank_expenses_select_own" on public.tank_expenses;
create policy "tank_expenses_select_own"
  on public.tank_expenses
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "tank_expenses_insert_own" on public.tank_expenses;
create policy "tank_expenses_insert_own"
  on public.tank_expenses
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "tank_expenses_update_own" on public.tank_expenses;
create policy "tank_expenses_update_own"
  on public.tank_expenses
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "tank_expenses_delete_own" on public.tank_expenses;
create policy "tank_expenses_delete_own"
  on public.tank_expenses
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

drop trigger if exists tank_budgets_set_updated_at on public.tank_budgets;
create trigger tank_budgets_set_updated_at
before update on public.tank_budgets
for each row
execute function public.set_updated_at();
