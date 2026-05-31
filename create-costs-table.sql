-- Run this in Supabase SQL editor to create the costs table used by pages/costs.tsx
create table if not exists public.costs (
  id bigint generated always as identity primary key,
  description text not null,
  amount numeric not null,
  category text,
  note text,
  created_at timestamptz not null default now(),
  created_by_email text
);

alter table public.costs enable row level security;

create policy costs_auth_insert
  on public.costs
  for insert
  with check (auth.role() = 'authenticated');

create policy costs_auth_select
  on public.costs
  for select
  using (auth.role() = 'authenticated');

create policy costs_auth_update
  on public.costs
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy costs_auth_delete
  on public.costs
  for delete
  using (auth.role() = 'authenticated');
