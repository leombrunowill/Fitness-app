-- Backfill profile columns required by dashboard + social UX
alter table if exists public.profiles
  add column if not exists training_goal text,
  add column if not exists experience_level text,
  add column if not exists weekly_training_days integer,
  add column if not exists bodyweight_goal numeric(8,2),
  add column if not exists display_name text,
  add column if not exists handle text,
  add column if not exists bio text;

create unique index if not exists idx_profiles_handle_unique
  on public.profiles(lower(handle))
  where handle is not null;
