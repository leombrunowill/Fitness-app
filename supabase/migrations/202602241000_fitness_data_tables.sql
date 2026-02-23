create extension if not exists "pgcrypto";

create table if not exists public.bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(8,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.workout_sets
  alter column workout_id type uuid using nullif(workout_id, '')::uuid;

alter table public.workout_sets
  drop constraint if exists workout_sets_workout_id_fkey;

alter table public.workout_sets
  add constraint workout_sets_workout_id_fkey foreign key (workout_id) references public.workouts(id) on delete cascade;

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  calories numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  meal_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal_type text not null default 'cut',
  target_weight numeric(8,2),
  weekly_pace numeric(6,2),
  daily_calorie_target integer,
  daily_protein_target integer,
  updated_at timestamptz not null default now()
);

create index if not exists idx_bodyweight_logs_user_created on public.bodyweight_logs(user_id, created_at desc);
create index if not exists idx_workouts_user_started on public.workouts(user_id, started_at desc);
create index if not exists idx_nutrition_logs_user_created on public.nutrition_logs(user_id, created_at desc);

alter table public.bodyweight_logs enable row level security;
alter table public.workouts enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.user_goals enable row level security;

DO $$
BEGIN
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bodyweight_logs' and policyname='bodyweight_logs_select_own') then
    create policy bodyweight_logs_select_own on public.bodyweight_logs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bodyweight_logs' and policyname='bodyweight_logs_insert_own') then
    create policy bodyweight_logs_insert_own on public.bodyweight_logs for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='bodyweight_logs' and policyname='bodyweight_logs_update_own') then
    create policy bodyweight_logs_update_own on public.bodyweight_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workouts' and policyname='workouts_select_own') then
    create policy workouts_select_own on public.workouts for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workouts' and policyname='workouts_insert_own') then
    create policy workouts_insert_own on public.workouts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workouts' and policyname='workouts_update_own') then
    create policy workouts_update_own on public.workouts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='nutrition_logs' and policyname='nutrition_logs_select_own') then
    create policy nutrition_logs_select_own on public.nutrition_logs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='nutrition_logs' and policyname='nutrition_logs_insert_own') then
    create policy nutrition_logs_insert_own on public.nutrition_logs for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='nutrition_logs' and policyname='nutrition_logs_update_own') then
    create policy nutrition_logs_update_own on public.nutrition_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_goals' and policyname='user_goals_select_own') then
    create policy user_goals_select_own on public.user_goals for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_goals' and policyname='user_goals_insert_own') then
    create policy user_goals_insert_own on public.user_goals for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_goals' and policyname='user_goals_update_own') then
    create policy user_goals_update_own on public.user_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
END $$;
