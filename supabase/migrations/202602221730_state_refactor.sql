-- State + persistence refactor baseline
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  lifter_mode text not null default 'auto' check (lifter_mode in ('beginner', 'intermediate', 'advanced', 'auto')),
  experience_score integer not null default 0,
  preferred_units text not null default 'imperial',
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  auto_rest_timer boolean not null default true,
  sound_enabled boolean not null default true,
  haptics_enabled boolean not null default false,
  adaptive_ui boolean not null default true,
  manual_mode_override boolean not null default false,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text,
  exercise_id text,
  muscle_group text,
  secondary_muscle_group text,
  secondary_multiplier numeric(3,2) default 0.5,
  weight numeric(8,2),
  reps integer,
  rpe numeric(4,2),
  completed boolean not null default true,
  is_warmup boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_sets_user_created_at on public.workout_sets(user_id, created_at desc);
create index if not exists idx_workout_sets_user_workout on public.workout_sets(user_id, workout_id);
create index if not exists idx_workout_sets_user_muscle on public.workout_sets(user_id, muscle_group);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.workout_sets enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_own') then
    create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_own') then
    create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_settings' and policyname='user_settings_select_own') then
    create policy user_settings_select_own on public.user_settings for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_settings' and policyname='user_settings_insert_own') then
    create policy user_settings_insert_own on public.user_settings for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_settings' and policyname='user_settings_update_own') then
    create policy user_settings_update_own on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workout_sets' and policyname='workout_sets_select_own') then
    create policy workout_sets_select_own on public.workout_sets for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workout_sets' and policyname='workout_sets_insert_own') then
    create policy workout_sets_insert_own on public.workout_sets for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workout_sets' and policyname='workout_sets_update_own') then
    create policy workout_sets_update_own on public.workout_sets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
