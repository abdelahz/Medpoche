-- ============================================================
-- MEDENPOCHE — Storage: library bucket
-- Run this in the Supabase SQL editor (after schema.sql).
-- Private bucket: files are reachable only via short-lived
-- signed URLs minted server-side for authenticated users.
-- ============================================================

-- Private bucket for course materials (cours, résumés, QCMs, annales…).
insert into storage.buckets (id, name, public)
values ('library', 'library', false)
on conflict (id) do nothing;

-- RLS on storage.objects is enabled by default in Supabase.

-- Admins can upload / update / delete library files.
create policy "Admins manage library files"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'library'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    bucket_id = 'library'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Any authenticated user (students included) can read → enables signed URLs.
create policy "Authenticated read library files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'library');

-- ============================================================
-- DATASET IA bucket (Step 7) — the AI tutor's private knowledge
-- base. ADMINS ONLY: students never read these files.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('dataset', 'dataset', false)
on conflict (id) do nothing;

create policy "Admins manage dataset files"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'dataset'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    bucket_id = 'dataset'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
