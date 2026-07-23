alter table public.profiles
  add column if not exists expected_due_date date;

update public.profiles
set expected_due_date = current_date + ((40 - pregnancy_weeks::integer) * 7)
where expected_due_date is null
  and pregnancy_weeks is not null;

alter table public.profiles
  drop column if exists pregnancy_weeks;
