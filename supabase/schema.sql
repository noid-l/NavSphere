create extension if not exists pgcrypto;
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.link_environment as enum ('test', 'prod');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.timezone('utc', pg_catalog.now());
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  description text,
  sort integer not null default 100,
  is_public boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_created_by_name_key unique (created_by, name)
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  url text not null check (url ~* '^https?://'),
  env public.link_environment not null default 'prod',
  category_id uuid not null references public.categories (id) on delete cascade,
  description text,
  icon text,
  sort integer not null default 100,
  is_public boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint links_created_by_category_id_name_key unique (created_by, category_id, name)
);

create index if not exists categories_owner_sort_idx
  on public.categories (created_by, sort, created_at desc);

create index if not exists categories_public_sort_idx
  on public.categories (is_public, sort)
  where is_public = true;

create index if not exists links_owner_category_sort_idx
  on public.links (created_by, category_id, sort, created_at desc);

create index if not exists links_category_id_idx
  on public.links (category_id);

create index if not exists links_public_sort_idx
  on public.links (is_public, sort)
  where is_public = true;

create index if not exists links_name_trgm_idx
  on public.links using gin (name extensions.gin_trgm_ops);

create index if not exists links_description_trgm_idx
  on public.links using gin (description extensions.gin_trgm_ops);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists links_set_updated_at on public.links;
create trigger links_set_updated_at
before update on public.links
for each row
execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.links enable row level security;

drop policy if exists "categories_select_visible" on public.categories;
drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_select_public_anon" on public.categories;
create policy "categories_select_public_anon"
on public.categories
for select
to anon
using (is_public = true);

drop policy if exists "categories_select_visible_authenticated" on public.categories;
create policy "categories_select_visible_authenticated"
on public.categories
for select
to authenticated
using (is_public = true or created_by = (select auth.uid()));

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
on public.categories
for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
on public.categories
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
on public.categories
for delete
to authenticated
using (created_by = (select auth.uid()));

drop policy if exists "links_select_visible" on public.links;
drop policy if exists "links_select_own" on public.links;
drop policy if exists "links_select_public" on public.links;
drop policy if exists "links_select_public_anon" on public.links;
create policy "links_select_public_anon"
on public.links
for select
to anon
using (is_public = true);

drop policy if exists "links_select_visible_authenticated" on public.links;
create policy "links_select_visible_authenticated"
on public.links
for select
to authenticated
using (is_public = true or created_by = (select auth.uid()));

drop policy if exists "links_insert_own" on public.links;
create policy "links_insert_own"
on public.links
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.categories
    where categories.id = category_id
      and categories.created_by = (select auth.uid())
  )
);

drop policy if exists "links_update_own" on public.links;
create policy "links_update_own"
on public.links
for update
to authenticated
using (created_by = (select auth.uid()))
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.categories
    where categories.id = category_id
      and categories.created_by = (select auth.uid())
  )
);

drop policy if exists "links_delete_own" on public.links;
create policy "links_delete_own"
on public.links
for delete
to authenticated
using (created_by = (select auth.uid()));
