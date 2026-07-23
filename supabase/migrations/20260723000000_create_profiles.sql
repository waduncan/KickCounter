create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pregnancy_weeks smallint check (pregnancy_weeks between 1 and 42),
  baby_name text check (char_length(baby_name) <= 100),
  doctor_name text check (char_length(doctor_name) <= 200),
  doctor_phone text check (char_length(doctor_phone) <= 50),
  doctor_website text check (char_length(doctor_website) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.profiles to authenticated;
