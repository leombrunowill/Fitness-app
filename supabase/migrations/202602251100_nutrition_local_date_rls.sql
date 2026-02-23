alter table public.nutrition_logs
  add column if not exists local_date date;

update public.nutrition_logs
set local_date = (created_at at time zone 'utc')::date
where local_date is null;

alter table public.nutrition_logs
  alter column local_date set not null;

create index if not exists idx_nutrition_logs_user_local_date on public.nutrition_logs(user_id, local_date desc);
create index if not exists idx_nutrition_logs_user_meal_local_date on public.nutrition_logs(user_id, meal_type, local_date desc);

alter table public.nutrition_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='nutrition_logs' and policyname='nutrition_logs_delete_own') then
    create policy nutrition_logs_delete_own on public.nutrition_logs for delete using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.favorite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  calories numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  serving_label text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_favorite_foods_user_name on public.favorite_foods(user_id, food_name);
create index if not exists idx_favorite_foods_user_created on public.favorite_foods(user_id, created_at desc);

alter table public.favorite_foods enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='favorite_foods' and policyname='favorite_foods_select_own') then
    create policy favorite_foods_select_own on public.favorite_foods for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='favorite_foods' and policyname='favorite_foods_insert_own') then
    create policy favorite_foods_insert_own on public.favorite_foods for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='favorite_foods' and policyname='favorite_foods_update_own') then
    create policy favorite_foods_update_own on public.favorite_foods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='favorite_foods' and policyname='favorite_foods_delete_own') then
    create policy favorite_foods_delete_own on public.favorite_foods for delete using (auth.uid() = user_id);
  end if;
end $$;
