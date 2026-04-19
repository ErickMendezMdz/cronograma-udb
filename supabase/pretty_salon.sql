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

create table if not exists public.pretty_salon_cash_transfers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  transfer_date date not null,
  from_method text not null check (from_method <> 'Credito'),
  to_method text not null check (to_method <> 'Credito'),
  amount numeric(12, 2) not null check (amount > 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_method <> to_method)
);

create index if not exists pretty_salon_cash_transfers_owner_date_idx
  on public.pretty_salon_cash_transfers (owner_id, transfer_date desc, created_at desc);

create table if not exists public.pretty_salon_expense_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  payment_date date not null,
  payment_method text not null check (payment_method not in ('Credito', 'Tarjeta de credito')),
  amount numeric(12, 2) not null check (amount > 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pretty_salon_expense_payments_owner_date_idx
  on public.pretty_salon_expense_payments (owner_id, payment_date desc, created_at desc);

create table if not exists public.pretty_salon_team_members (
  email text primary key,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

create or replace function public.is_pretty_salon_team_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.pretty_salon_team_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_pretty_salon_team_member() to authenticated;

update public.pretty_salon_transactions
set payment_method = 'Tarjeta de credito'
where kind = 'expense'
  and payment_method = 'Credito';

update public.pretty_salon_transactions
set payment_method = 'Cuenta Banco'
where payment_method in ('Tarjeta', 'Transferencia');

update public.pretty_salon_cash_transfers
set from_method = 'Cuenta Banco'
where from_method in ('Tarjeta', 'Transferencia')
  and to_method not in ('Tarjeta', 'Transferencia', 'Cuenta Banco');

update public.pretty_salon_cash_transfers
set to_method = 'Cuenta Banco'
where to_method in ('Tarjeta', 'Transferencia')
  and from_method not in ('Tarjeta', 'Transferencia', 'Cuenta Banco');

update public.pretty_salon_transactions
set status = 'pending'
where payment_method in ('Credito', 'Tarjeta de credito')
  and status <> 'pending';

alter table public.pretty_salon_transactions
  drop constraint if exists pretty_salon_credit_pending_chk;

alter table public.pretty_salon_transactions
  add constraint pretty_salon_credit_pending_chk
  check (payment_method not in ('Credito', 'Tarjeta de credito') or status = 'pending')
  not valid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pretty_salon_cash_transfers_methods_chk'
      and conrelid = 'public.pretty_salon_cash_transfers'::regclass
  ) then
    alter table public.pretty_salon_cash_transfers
      add constraint pretty_salon_cash_transfers_methods_chk
      check (
        from_method not in ('Credito', 'Tarjeta de credito')
        and to_method not in ('Credito', 'Tarjeta de credito')
      )
      not valid;
  end if;
end;
$$;

alter table public.pretty_salon_transactions enable row level security;
alter table public.pretty_salon_cash_transfers enable row level security;
alter table public.pretty_salon_expense_payments enable row level security;
alter table public.pretty_salon_team_members enable row level security;

drop policy if exists "pretty_salon_team_members_select_own"
  on public.pretty_salon_team_members;
create policy "pretty_salon_team_members_select_own"
  on public.pretty_salon_team_members
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "pretty_salon_transactions_select_own"
  on public.pretty_salon_transactions;
create policy "pretty_salon_transactions_select_own"
  on public.pretty_salon_transactions
  for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

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
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  )
  with check (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

drop policy if exists "pretty_salon_transactions_delete_own"
  on public.pretty_salon_transactions;
create policy "pretty_salon_transactions_delete_own"
  on public.pretty_salon_transactions
  for delete
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

drop policy if exists "pretty_salon_cash_transfers_select_own"
  on public.pretty_salon_cash_transfers;
create policy "pretty_salon_cash_transfers_select_own"
  on public.pretty_salon_cash_transfers
  for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

drop policy if exists "pretty_salon_cash_transfers_insert_own"
  on public.pretty_salon_cash_transfers;
create policy "pretty_salon_cash_transfers_insert_own"
  on public.pretty_salon_cash_transfers
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pretty_salon_cash_transfers_update_own"
  on public.pretty_salon_cash_transfers;
create policy "pretty_salon_cash_transfers_update_own"
  on public.pretty_salon_cash_transfers
  for update
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  )
  with check (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

drop policy if exists "pretty_salon_cash_transfers_delete_own"
  on public.pretty_salon_cash_transfers;
create policy "pretty_salon_cash_transfers_delete_own"
  on public.pretty_salon_cash_transfers
  for delete
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

drop policy if exists "pretty_salon_expense_payments_select_own"
  on public.pretty_salon_expense_payments;
create policy "pretty_salon_expense_payments_select_own"
  on public.pretty_salon_expense_payments
  for select
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

drop policy if exists "pretty_salon_expense_payments_insert_own"
  on public.pretty_salon_expense_payments;
create policy "pretty_salon_expense_payments_insert_own"
  on public.pretty_salon_expense_payments
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pretty_salon_expense_payments_update_own"
  on public.pretty_salon_expense_payments;
create policy "pretty_salon_expense_payments_update_own"
  on public.pretty_salon_expense_payments
  for update
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  )
  with check (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

drop policy if exists "pretty_salon_expense_payments_delete_own"
  on public.pretty_salon_expense_payments;
create policy "pretty_salon_expense_payments_delete_own"
  on public.pretty_salon_expense_payments
  for delete
  to authenticated
  using (
    (select auth.uid()) = owner_id
    or public.is_pretty_salon_team_member()
  );

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

drop trigger if exists pretty_salon_cash_transfers_set_updated_at
  on public.pretty_salon_cash_transfers;
create trigger pretty_salon_cash_transfers_set_updated_at
before update on public.pretty_salon_cash_transfers
for each row
execute function public.set_updated_at();

drop trigger if exists pretty_salon_expense_payments_set_updated_at
  on public.pretty_salon_expense_payments;
create trigger pretty_salon_expense_payments_set_updated_at
before update on public.pretty_salon_expense_payments
for each row
execute function public.set_updated_at();
