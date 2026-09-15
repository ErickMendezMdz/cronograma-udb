-- Ejecutar despues de supabase/pretty_salon.sql.

create table if not exists public.pretty_salon_settlements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  period_month text not null check (period_month ~ '^\\d{4}-(0[1-9]|1[0-2])$'),
  period_half smallint not null check (period_half in (1, 2)),
  accounting_date date not null,
  performed_on date not null default current_date,
  performed_by text not null default '',
  status text not null default 'in_progress'
    check (status in ('in_progress', 'finalized', 'reopened')),
  app_cash_initial numeric(12, 2) not null default 0,
  app_bank_initial numeric(12, 2) not null default 0,
  app_cash_final numeric(12, 2),
  app_bank_final numeric(12, 2),
  draft jsonb not null default '{}'::jsonb,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_month, period_half)
);

create index if not exists pretty_salon_settlements_period_idx
  on public.pretty_salon_settlements (period_month desc, period_half desc);

create or replace function public.is_pretty_salon_owner()
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
      and role = 'owner'
  );
$$;

grant execute on function public.is_pretty_salon_owner() to authenticated;

create or replace function public.protect_finalized_pretty_salon_settlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'finalized' and not public.is_pretty_salon_owner() then
    raise exception 'Solo el propietario puede modificar o reabrir un cuadre finalizado.';
  end if;
  return new;
end;
$$;

drop trigger if exists pretty_salon_settlements_protect_finalized
  on public.pretty_salon_settlements;
create trigger pretty_salon_settlements_protect_finalized
before update or delete on public.pretty_salon_settlements
for each row execute function public.protect_finalized_pretty_salon_settlement();

drop trigger if exists pretty_salon_settlements_set_updated_at
  on public.pretty_salon_settlements;
create trigger pretty_salon_settlements_set_updated_at
before update on public.pretty_salon_settlements
for each row execute function public.set_updated_at();

alter table public.pretty_salon_settlements enable row level security;

drop policy if exists "pretty_salon_settlements_select_team"
  on public.pretty_salon_settlements;
create policy "pretty_salon_settlements_select_team"
  on public.pretty_salon_settlements
  for select to authenticated
  using ((select auth.uid()) = owner_id or public.is_pretty_salon_team_member());

drop policy if exists "pretty_salon_settlements_insert_own"
  on public.pretty_salon_settlements;
create policy "pretty_salon_settlements_insert_own"
  on public.pretty_salon_settlements
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "pretty_salon_settlements_update_team"
  on public.pretty_salon_settlements;
create policy "pretty_salon_settlements_update_team"
  on public.pretty_salon_settlements
  for update to authenticated
  using ((select auth.uid()) = owner_id or public.is_pretty_salon_team_member())
  with check ((select auth.uid()) = owner_id or public.is_pretty_salon_team_member());

drop policy if exists "pretty_salon_settlements_delete_owner"
  on public.pretty_salon_settlements;
create policy "pretty_salon_settlements_delete_owner"
  on public.pretty_salon_settlements
  for delete to authenticated
  using (public.is_pretty_salon_owner());
