-- Ejecutar en Supabase SQL Editor para habilitar "Compras con tarjeta".
-- Conserva personal_loans sin cambios y aísla todos los registros por owner_id.

create table if not exists public.reminder_credit_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text not null default '',
  cut_day integer not null check (cut_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_savings_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text not null default '',
  account_type text not null default 'savings' check (account_type in ('savings', 'checking', 'wallet', 'other')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_shared_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_case_participants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.reminder_shared_cases(id) on delete cascade,
  name text not null,
  is_owner boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_shared_purchases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.reminder_shared_cases(id) on delete cascade,
  card_id uuid null references public.reminder_credit_cards(id) on delete set null,
  description text not null,
  purchase_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  first_opportunity date not null,
  second_opportunity date not null,
  installment_count integer not null default 1 check (installment_count > 0),
  first_installment_date date not null,
  created_at timestamptz not null default now(),
  check (second_opportunity > first_opportunity)
);

create table if not exists public.reminder_purchase_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.reminder_shared_purchases(id) on delete cascade,
  participant_id uuid not null references public.reminder_case_participants(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (purchase_id, participant_id)
);

create table if not exists public.reminder_shared_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.reminder_shared_cases(id) on delete cascade,
  participant_id uuid not null references public.reminder_case_participants(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_at date not null,
  method text not null default 'Transferencia',
  route text not null default 'account' check (route in ('account', 'direct_card')),
  account_id uuid null references public.reminder_savings_accounts(id) on delete set null,
  card_id uuid null references public.reminder_credit_cards(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Migración idempotente para instalaciones creadas con una versión anterior.
alter table public.reminder_savings_accounts add column if not exists bank text not null default '';
alter table public.reminder_savings_accounts add column if not exists account_type text not null default 'savings';
alter table public.reminder_shared_purchases add column if not exists installment_count integer not null default 1;
alter table public.reminder_shared_purchases add column if not exists first_installment_date date;
update public.reminder_shared_purchases set first_installment_date = first_opportunity where first_installment_date is null;
alter table public.reminder_shared_purchases alter column first_installment_date set not null;
alter table public.reminder_shared_payments add column if not exists route text not null default 'account';
alter table public.reminder_shared_payments add column if not exists account_id uuid null references public.reminder_savings_accounts(id) on delete set null;
alter table public.reminder_shared_payments add column if not exists card_id uuid null references public.reminder_credit_cards(id) on delete set null;

alter table public.reminder_savings_accounts drop constraint if exists reminder_savings_accounts_account_type_check;
alter table public.reminder_savings_accounts add constraint reminder_savings_accounts_account_type_check check (account_type in ('savings', 'checking', 'wallet', 'other'));
alter table public.reminder_shared_purchases drop constraint if exists reminder_shared_purchases_installment_count_check;
alter table public.reminder_shared_purchases add constraint reminder_shared_purchases_installment_count_check check (installment_count > 0);
alter table public.reminder_shared_payments drop constraint if exists reminder_shared_payments_route_check;
alter table public.reminder_shared_payments add constraint reminder_shared_payments_route_check check (route in ('account', 'direct_card'));

create table if not exists public.reminder_fund_allocations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.reminder_shared_cases(id) on delete cascade,
  payment_id uuid not null references public.reminder_shared_payments(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  allocated_at date not null,
  destination_type text not null check (destination_type in ('card', 'savings', 'other')),
  card_id uuid null references public.reminder_credit_cards(id) on delete set null,
  account_id uuid null references public.reminder_savings_accounts(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reminder_cards_owner_idx on public.reminder_credit_cards(owner_id);
create index if not exists reminder_accounts_owner_idx on public.reminder_savings_accounts(owner_id);
create index if not exists reminder_cases_owner_idx on public.reminder_shared_cases(owner_id, status);
create index if not exists reminder_participants_case_idx on public.reminder_case_participants(case_id);
create index if not exists reminder_purchases_case_idx on public.reminder_shared_purchases(case_id, purchase_date desc);
create index if not exists reminder_shares_purchase_idx on public.reminder_purchase_shares(purchase_id);
create index if not exists reminder_payments_case_idx on public.reminder_shared_payments(case_id, paid_at desc);
create index if not exists reminder_allocations_case_idx on public.reminder_fund_allocations(case_id, allocated_at desc);

alter table public.reminder_credit_cards enable row level security;
alter table public.reminder_savings_accounts enable row level security;
alter table public.reminder_shared_cases enable row level security;
alter table public.reminder_case_participants enable row level security;
alter table public.reminder_shared_purchases enable row level security;
alter table public.reminder_purchase_shares enable row level security;
alter table public.reminder_shared_payments enable row level security;
alter table public.reminder_fund_allocations enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'reminder_credit_cards', 'reminder_savings_accounts', 'reminder_shared_cases',
    'reminder_case_participants', 'reminder_shared_purchases', 'reminder_purchase_shares',
    'reminder_shared_payments', 'reminder_fund_allocations'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', table_name || '_delete_own', table_name);
  end loop;
end $$;
