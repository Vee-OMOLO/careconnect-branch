-- ════════════════════════════════════════════════════════════════
-- CareConnect — complete schema
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Safe to re-run: every statement is idempotent.
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────────────────────────────

-- One row per signed-up person. `role` is set at signup by the
-- trigger at the bottom of this file, never by a later prompt.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text check (role is null or role in ('parent', 'caregiver')),
  link_key   text,
  created_at timestamptz not null default now()
);

-- A family is identified by a deterministic link_key built as
-- lower(parent_email) || '_' || lower(child_name). Parent and caregiver
-- derive the same key independently, so no invite codes change hands.
create table if not exists public.families (
  link_key     text primary key,
  parent_email text not null,
  child_name   text not null,
  created_by   uuid references auth.users(id) on delete set null,
  blood_type   text,
  allergies    text,
  conditions   text,
  medications  text,
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.family_members (
  link_key   text not null references public.families(link_key) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('parent', 'caregiver')),
  joined_at  timestamptz not null default now(),
  primary key (link_key, user_id)
);

create table if not exists public.activity_logs (
  id            uuid primary key default gen_random_uuid(),
  link_key      text not null references public.families(link_key) on delete cascade,
  logged_by     uuid references auth.users(id) on delete set null,
  activity_type text not null,
  notes         text,                      -- the optional note; see FIXES.md
  photo_url     text,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create table if not exists public.sos_alerts (
  id             uuid primary key default gen_random_uuid(),
  link_key       text not null references public.families(link_key) on delete cascade,
  raised_by      uuid references auth.users(id) on delete set null,
  emergency_type text not null default 'other'
                 check (emergency_type in (
                   'medical', 'fire', 'missing_child', 'injury',
                   'allergic_reaction', 'choking', 'other'
                 )),
  message        text,
  latitude       double precision,
  longitude      double precision,
  accuracy       double precision,
  status         text not null default 'active' check (status in ('active', 'resolved')),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists public.child_events (
  id         uuid primary key default gen_random_uuid(),
  link_key   text not null references public.families(link_key) on delete cascade,
  title      text not null,
  kind       text not null default 'other'
             check (kind in ('appointment', 'medication', 'school', 'other')),
  starts_at  timestamptz not null,
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists public.caregiver_locations (
  link_key   text not null references public.families(link_key) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  latitude   double precision not null,
  longitude  double precision not null,
  accuracy   double precision,
  updated_at timestamptz not null default now(),
  primary key (link_key, user_id)
);

create table if not exists public.emergency_contacts (
  id           uuid primary key default gen_random_uuid(),
  link_key     text not null references public.families(link_key) on delete cascade,
  name         text not null,
  relationship text,
  phone        text not null,
  email        text,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  link_key   text not null references public.families(link_key) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- Indexes for the queries the app actually runs
-- ────────────────────────────────────────────────────────────────
create index if not exists activity_logs_family_time_idx
  on public.activity_logs (link_key, occurred_at desc);
create index if not exists sos_alerts_family_status_idx
  on public.sos_alerts (link_key, status, created_at desc);
create index if not exists child_events_family_time_idx
  on public.child_events (link_key, starts_at);
create index if not exists emergency_contacts_family_idx
  on public.emergency_contacts (link_key, is_primary desc);

-- ────────────────────────────────────────────────────────────────
-- Membership check
--
-- SECURITY DEFINER matters here. A policy on family_members that
-- queries family_members would recurse and error at runtime. Running
-- as the definer bypasses RLS inside the function, so the check
-- terminates. search_path is pinned to block search-path hijacking.
-- ────────────────────────────────────────────────────────────────
create or replace function public.is_family_member(key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where link_key = key and user_id = auth.uid()
  );
$$;

-- ────────────────────────────────────────────────────────────────
-- Row Level Security
-- Every shared table gates on is_family_member(link_key): you can only
-- ever touch rows belonging to a family you have joined.
-- ────────────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.families            enable row level security;
alter table public.family_members      enable row level security;
alter table public.activity_logs       enable row level security;
alter table public.sos_alerts          enable row level security;
alter table public.child_events        enable row level security;
alter table public.caregiver_locations enable row level security;
alter table public.emergency_contacts  enable row level security;
alter table public.notifications       enable row level security;

-- profiles: you own your row.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- families: members read and update. Anyone signed in may create one
-- (that is a parent registering) and may look one up to link to it.
drop policy if exists "read families" on public.families;
create policy "read families" on public.families
  for select using (auth.uid() is not null);

drop policy if exists "create family" on public.families;
create policy "create family" on public.families
  for insert with check (auth.uid() is not null);

drop policy if exists "members update family" on public.families;
create policy "members update family" on public.families
  for update using (public.is_family_member(link_key))
  with check (public.is_family_member(link_key));

-- family_members: you may add yourself; members see each other.
drop policy if exists "join family" on public.family_members;
create policy "join family" on public.family_members
  for insert with check (user_id = auth.uid());

drop policy if exists "read members" on public.family_members;
create policy "read members" on public.family_members
  for select using (user_id = auth.uid() or public.is_family_member(link_key));

drop policy if exists "leave family" on public.family_members;
create policy "leave family" on public.family_members
  for delete using (user_id = auth.uid());

-- The five shared tables all share one shape, so generate their
-- policies rather than repeating the same four statements each time.
do $$
declare t text;
begin
  foreach t in array array[
    'activity_logs', 'sos_alerts', 'child_events',
    'caregiver_locations', 'emergency_contacts', 'notifications'
  ]
  loop
    execute format('drop policy if exists "family read %1$s" on public.%1$I', t);
    execute format(
      'create policy "family read %1$s" on public.%1$I
         for select using (public.is_family_member(link_key))', t);

    execute format('drop policy if exists "family write %1$s" on public.%1$I', t);
    execute format(
      'create policy "family write %1$s" on public.%1$I
         for insert with check (public.is_family_member(link_key))', t);

    execute format('drop policy if exists "family update %1$s" on public.%1$I', t);
    execute format(
      'create policy "family update %1$s" on public.%1$I
         for update using (public.is_family_member(link_key))
         with check (public.is_family_member(link_key))', t);

    execute format('drop policy if exists "family delete %1$s" on public.%1$I', t);
    execute format(
      'create policy "family delete %1$s" on public.%1$I
         for delete using (public.is_family_member(link_key))', t);
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────
-- New user → profile row
-- Register.jsx sends { full_name, role, child_name } as user metadata.
-- This copies role onto the profile so the app never asks a second time.
-- ────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'role', '')
  )
  on conflict (id) do update
    set email     = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role      = coalesce(excluded.role, public.profiles.role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- Realtime
-- replica identity full makes the payload carry the whole row, so the
-- parent view can read notes and emergency_type straight off an INSERT
-- without a follow-up query.
-- ────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['activity_logs', 'sos_alerts', 'caregiver_locations', 'child_events']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════
-- Done. Check Authentication > URL Configuration next, and add your
-- dev and production URLs to the redirect allow-list.
-- ════════════════════════════════════════════════════════════════
