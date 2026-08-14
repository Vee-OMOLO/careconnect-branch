-- ════════════════════════════════════════════════════════════════
-- CareConnect — migration 004
-- The Safety Vault is the parent's record and the caregiver's
-- reference. This makes that split real at the database level.
-- Run after 003. Safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. Emergency contacts — the family reads, the parent writes
--
-- The caregiver needs these most when they cannot reach the parent,
-- so read access is deliberately wide. Write access is not: a
-- caregiver quietly changing the pediatrician's number is exactly the
-- failure you cannot afford in an emergency.
-- ────────────────────────────────────────────────────────────────
drop policy if exists "family read emergency_contacts" on public.emergency_contacts;
create policy "family read emergency_contacts" on public.emergency_contacts
  for select using (public.is_family_member(link_key));

drop policy if exists "family write emergency_contacts"  on public.emergency_contacts;
drop policy if exists "parent write emergency_contacts"  on public.emergency_contacts;
create policy "parent write emergency_contacts" on public.emergency_contacts
  for insert with check (public.is_family_parent(link_key));

drop policy if exists "family update emergency_contacts" on public.emergency_contacts;
drop policy if exists "parent update emergency_contacts" on public.emergency_contacts;
create policy "parent update emergency_contacts" on public.emergency_contacts
  for update using (public.is_family_parent(link_key))
  with check (public.is_family_parent(link_key));

drop policy if exists "family delete emergency_contacts" on public.emergency_contacts;
drop policy if exists "parent delete emergency_contacts" on public.emergency_contacts;
create policy "parent delete emergency_contacts" on public.emergency_contacts
  for delete using (public.is_family_parent(link_key));

-- ────────────────────────────────────────────────────────────────
-- 2. Medical info lives on the families row — parent-only edits.
--    Reading stays open to every member.
-- ────────────────────────────────────────────────────────────────
drop policy if exists "members update family" on public.families;
drop policy if exists "parent updates family" on public.families;
create policy "parent updates family" on public.families
  for update using (public.is_family_parent(link_key))
  with check (public.is_family_parent(link_key));

-- ════════════════════════════════════════════════════════════════
-- After running this, check both roles:
--   parent    → can add and edit contacts, medical info, care team
--   caregiver → sees all of it, can tap to call, cannot change it
-- ════════════════════════════════════════════════════════════════
