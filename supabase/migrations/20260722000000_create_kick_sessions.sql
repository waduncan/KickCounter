create table if not exists public.kick_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  kick_count integer not null check (kick_count between 1 and 100),
  movement_times_seconds integer[] not null default '{}',
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  constraint ended_after_started check (ended_at >= started_at)
);

create index if not exists kick_sessions_user_started_idx
  on public.kick_sessions (user_id, started_at desc);

alter table public.kick_sessions enable row level security;

create policy "Users can read their own kick sessions"
  on public.kick_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own kick sessions"
  on public.kick_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own kick sessions"
  on public.kick_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own kick sessions"
  on public.kick_sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.kick_sessions to authenticated;
