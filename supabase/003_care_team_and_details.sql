-- ════════════════════════════════════════════════════════════════
-- CareConnect — migration 003
-- Adds: quick-log detail, care team, parent-only event scheduling.
-- Run in the Supabase SQL Editor after schema.sql. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. Quick-log detail
--    "Meal → solids", "Diaper → wet". Kept separate from `notes` so
--    it stays filterable, while notes remain free text.
-- ────────────────────────────────────────────────────────────────
alter table public.activity_logs
  add column if not exists detail text;

-- ────────────────────────────────────────────────────────────────
-- 2. Care team
--    The people around the child: pediatrician, tutor, family doctor.
--    Distinct from emergency_contacts, which is who to call in a
--    crisis. Someone can appear in both.
-- ────────────────────────────────────────────────────────────────
create table if not exists public.care_team (
  id           uuid primary key default gen_random_uuid(),
  link_key     text not null references public.families(link_key) on delete cascade,
  name         text not null,
  member_role  text not null default 'other'
               check (member_role in (
                 'pediatrician', 'family_doctor', 'dentist', 'therapist',
                 'tutor', 'coach', 'nanny', 'other'
               )),
  organization text,
  phone        text,
  email        text,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists care_team_family_idx
  on public.care_team (link_key, created_at);

alter table public.care_team enable row level security;

-- ────────────────────────────────────────────────────────────────
-- 3. Is this user the parent of this family?
--    Mirrors is_family_member. SECURITY DEFINER for the same reason:
--    it reads family_members, which is itself RLS-protected.
-- ────────────────────────────────────────────────────────────────
create or replace function public.is_family_parent(key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where link_key = key
      and user_id = auth.uid()
      and role = 'parent'
  );
$$;

-- ────────────────────────────────────────────────────────────────
-- 4. Care team policies — everyone reads, only the parent writes
-- ────────────────────────────────────────────────────────────────
drop policy if exists "family read care_team" on public.care_team;
create policy "family read care_team" on public.care_team
  for select using (public.is_family_member(link_key));

drop policy if exists "parent write care_team" on public.care_team;
create policy "parent write care_team" on public.care_team
  for insert with check (public.is_family_parent(link_key));

drop policy if exists "parent update care_team" on public.care_team;
create policy "parent update care_team" on public.care_team
  for update using (public.is_family_parent(link_key))
  with check (public.is_family_parent(link_key));

drop policy if exists "parent delete care_team" on public.care_team;
create policy "parent delete care_team" on public.care_team
  for delete using (public.is_family_parent(link_key));

-- ────────────────────────────────────────────────────────────────
-- 5. Only the parent schedules events
--    The caregiver UI hides the form, but hiding a button is not
--    security — anyone can call the API directly. This is the part
--    that actually enforces it.
-- ────────────────────────────────────────────────────────────────
drop policy if exists "family write child_events" on public.child_events;
create policy "parent write child_events" on public.child_events
  for insert with check (public.is_family_parent(link_key));

drop policy if exists "family update child_events" on public.child_events;
create policy "parent update child_events" on public.child_events
  for update using (public.is_family_parent(link_key))
  with check (public.is_family_parent(link_key));

drop policy if exists "family delete child_events" on public.child_events;
create policy "parent delete child_events" on public.child_events
  for delete using (public.is_family_parent(link_key));

-- Reading stays open to the whole family: the caregiver needs to see
-- appointments and medication times to do the job.

-- ────────────────────────────────────────────────────────────────
-- 6. Realtime for the care team table
-- ────────────────────────────────────────────────────────────────
do $$
begin
  begin
    alter publication supabase_realtime add table public.care_team;
  exception when duplicate_object then null;
  end;
end $$;

alter table public.care_team replica identity full;
