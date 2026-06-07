create table if not exists public.personal_loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  borrower_name text not null,
  category text not null,
  loan_date date not null default current_date,
  returned_at timestamptz null,
  status text not null default 'active' check (status in ('active', 'returned')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_loans_owner_idx
  on public.personal_loans (owner_id);

create index if not exists personal_loans_status_idx
  on public.personal_loans (status);

create index if not exists personal_loans_category_idx
  on public.personal_loans (category);

create index if not exists personal_loans_loan_date_idx
  on public.personal_loans (loan_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists personal_loans_set_updated_at
  on public.personal_loans;
create trigger personal_loans_set_updated_at
before update on public.personal_loans
for each row
execute function public.set_updated_at();

alter table public.personal_loans enable row level security;

drop policy if exists "personal_loans_select_own"
  on public.personal_loans;
create policy "personal_loans_select_own"
  on public.personal_loans
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "personal_loans_insert_own"
  on public.personal_loans;
create policy "personal_loans_insert_own"
  on public.personal_loans
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "personal_loans_update_own"
  on public.personal_loans;
create policy "personal_loans_update_own"
  on public.personal_loans
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "personal_loans_delete_own"
  on public.personal_loans;
create policy "personal_loans_delete_own"
  on public.personal_loans
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);
