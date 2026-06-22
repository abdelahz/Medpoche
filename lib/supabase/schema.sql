-- ============================================================
-- MEDENPOCHE — Database Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- PROFILES (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,        -- kept in sync from prenom + nom
  prenom text,
  nom text,
  filiere text,          -- Science Math A/B | Science Physique | SVT | Science Agronomique
  phone text,
  lycee text,
  ville text,
  plan text default 'gratuit', -- gratuit | basic | premium (real billing: Step 14)
  is_premium boolean default false,
  is_admin boolean default false,
  questions_today int default 0,
  mcqs_today int default 0,
  created_at timestamp default now()
);

-- Migration for an existing DB (safe to re-run):
-- alter table profiles add column if not exists prenom text;
-- alter table profiles add column if not exists nom text;
-- alter table profiles add column if not exists filiere text;
-- alter table profiles add column if not exists phone text;
-- alter table profiles add column if not exists lycee text;
-- alter table profiles add column if not exists ville text;
-- alter table profiles add column if not exists plan text default 'gratuit';

-- Auto-create profile on signup trigger. Phone is collected (required) at
-- registration and passed via signup metadata.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- MCQS
create table mcqs (
  id serial primary key,
  question text not null,
  has_list boolean default false,
  image_url text,
  image_required boolean default false,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_e text,
  correct text not null,
  explanation text,
  module text,        -- matière: Mathématiques | Chimie | Physique | SVT
  subject text,       -- cours / thème (within a matière)
  year int,
  exam_blanc text,    -- named mock exam, e.g. "Examen blanc 1" (admin-assigned)
  position int,       -- order within an exam/année (ordered display, no shuffle)
  status text default 'flagged',
  flags jsonb default '[]',
  created_at timestamp default now()
);

-- Migration for an existing DB (safe to re-run):
-- alter table mcqs add column if not exists exam_blanc text;
-- alter table mcqs add column if not exists position int;

-- LIBRARY
create table library (
  id serial primary key,
  title text not null,
  type text not null,
  module text,        -- matière: Mathématiques | Chimie | Physique | SVT
  subject text,       -- cours / chapitre (within a matière), mirrors mcqs
  file_url text,      -- Storage path, OR a YouTube video id when type = 'Vidéo'
  playlist text,      -- optional playlist name (groups videos, type = 'Vidéo')
  position int,       -- order within a playlist
  created_at timestamp default now()
);

-- Migration for an existing DB (safe to re-run):
alter table library add column if not exists module text;
alter table library add column if not exists playlist text;
alter table library add column if not exists position int;

-- DATASET (AI chatbot knowledge base)
-- The RAG vector table (dataset_chunks), pgvector, and the match_chunks()
-- retrieval function live in lib/supabase/rag.sql — run that after this file.
create table dataset (
  id serial primary key,
  title text not null,
  subject text,
  file_url text,
  index_status text default 'pending', -- pending | indexing | indexed | failed (rag.sql)
  indexed_at timestamptz,
  chunk_count int default 0,
  created_at timestamp default now()
);

-- Migration for an existing DB (safe to re-run): the index columns are also
-- added by lib/supabase/rag.sql, so running rag.sql covers this.
-- alter table dataset add column if not exists index_status text default 'pending';
-- alter table dataset add column if not exists indexed_at timestamptz;
-- alter table dataset add column if not exists chunk_count int default 0;

-- STUDENT FILES
create table student_files (
  id serial primary key,
  user_id uuid references profiles(id),
  name text,
  type text,
  url text,
  created_at timestamp default now()
);

-- CHAT HISTORY
create table chat_history (
  id serial primary key,
  user_id uuid references profiles(id),
  question text,
  answer text,
  feedback int,        -- 1 = 👍, -1 = 👎, null = none (AI tutor answer rating)
  created_at timestamp default now()
);

-- Migration for an existing DB (safe to re-run):
-- alter table chat_history add column if not exists feedback int;

-- MCQ ATTEMPTS
create table mcq_attempts (
  id serial primary key,
  user_id uuid references profiles(id),
  mcq_id int references mcqs(id),
  selected text,
  is_correct boolean,
  created_at timestamp default now()
);

-- BOOKMARKS
create table bookmarks (
  id serial primary key,
  user_id uuid references profiles(id),
  mcq_id int references mcqs(id),
  created_at timestamp default now()
);

-- AI USAGE (daily quota / rate limiting for the AI tutor)
-- One row per consumed AI tutor request. The daily quota is computed live by
-- counting today's rows per user (no reset job). `kind` separates text vs photo
-- so per-plan photo caps can be enforced. See lib/plans.ts + lib/usage.ts.
create table ai_usage (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  kind text not null default 'text', -- 'text' | 'photo'
  created_at timestamptz default now()
);
create index if not exists ai_usage_user_day_idx on ai_usage(user_id, created_at);

-- ENABLE RLS ON ALL TABLES
alter table profiles enable row level security;
alter table mcqs enable row level security;
alter table library enable row level security;
alter table dataset enable row level security;
alter table student_files enable row level security;
alter table chat_history enable row level security;
alter table mcq_attempts enable row level security;
alter table bookmarks enable row level security;
alter table ai_usage enable row level security;

-- PROFILES policies
create policy "Users view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

-- MCQS policies
create policy "Students read ready mcqs"
  on mcqs for select
  using (auth.role() = 'authenticated' and status = 'ready');
create policy "Admins full access mcqs"
  on mcqs for all
  using (exists (
    select 1 from profiles
    where id = auth.uid() and is_admin = true
  ));

-- LIBRARY policies
create policy "Authenticated read library"
  on library for select
  using (auth.role() = 'authenticated');
create policy "Admins manage library"
  on library for all
  using (exists (
    select 1 from profiles
    where id = auth.uid() and is_admin = true
  ));

-- DATASET policies (admins only)
create policy "Admins manage dataset"
  on dataset for all
  using (exists (
    select 1 from profiles
    where id = auth.uid() and is_admin = true
  ));

-- STUDENT FILES / CHAT / ATTEMPTS / BOOKMARKS
create policy "Users own files"
  on student_files for all using (auth.uid() = user_id);
create policy "Users own chat"
  on chat_history for all using (auth.uid() = user_id);
create policy "Users own attempts"
  on mcq_attempts for all using (auth.uid() = user_id);
create policy "Users own bookmarks"
  on bookmarks for all using (auth.uid() = user_id);
create policy "Users own ai_usage"
  on ai_usage for all using (auth.uid() = user_id);

-- ============================================================
-- TABLE GRANTS (REQUIRED)
-- RLS gates which *rows* a role can see, but a role must first
-- hold a table-level GRANT or PostgREST returns "permission
-- denied for table" (error 42501) before RLS is ever evaluated.
-- These are the same grants Supabase applies to new tables by
-- default; re-running them is safe and idempotent.
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Apply the same grants automatically to any future tables/sequences.
alter default privileges in schema public
  grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

-- ============================================================
-- ADMIN ACCESS TO OTHER USERS' ROWS (Step 7)
-- A policy on `profiles` cannot query `profiles` inline without
-- triggering Postgres "infinite recursion". A SECURITY DEFINER
-- helper runs as owner (bypassing RLS), so it can be called from
-- policies safely.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  );
$$;

-- Admins can read and update every profile (student management + dashboard counts).
create policy "Admins view all profiles"
  on profiles for select using (public.is_admin());
create policy "Admins update all profiles"
  on profiles for update using (public.is_admin());

-- Admins can read every student's attempts (per-student analytics).
create policy "Admins read all attempts"
  on mcq_attempts for select using (public.is_admin());

-- ============================================================
-- MIGRATION — AI usage / daily quota (re-runnable on an existing DB)
-- Run this block if `ai_usage` doesn't exist yet. Safe to re-run.
-- ============================================================
create table if not exists ai_usage (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  kind text not null default 'text', -- 'text' | 'photo'
  created_at timestamptz default now()
);
create index if not exists ai_usage_user_day_idx on ai_usage(user_id, created_at);

alter table ai_usage enable row level security;

drop policy if exists "Users own ai_usage" on ai_usage;
create policy "Users own ai_usage"
  on ai_usage for all using (auth.uid() = user_id);

-- A role needs a table-level GRANT before RLS is evaluated, or PostgREST returns
-- "permission denied for table" (42501). The blanket grants above cover this for
-- a fresh run; this explicit grant makes the migration self-sufficient.
grant all on ai_usage to anon, authenticated, service_role;
grant usage, select on sequence ai_usage_id_seq to anon, authenticated, service_role;

-- ============================================================
-- GUARD — plan / privileges are admin-only (re-runnable)
-- The "Users update own profile" RLS policy lets a student update
-- their OWN row with no column restriction — so without this guard a
-- student could self-assign plan='premium' (or is_admin=true) straight
-- from the browser JS client. This BEFORE UPDATE trigger blocks any
-- change to plan / is_premium / is_admin unless the caller is an admin
-- or the service role. Normal profile edits (name, filière, phone…) are
-- unaffected. RUN THIS — it closes a real free-upgrade hole.
-- ============================================================
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.plan is distinct from old.plan
      or new.is_premium is distinct from old.is_premium
      or new.is_admin is distinct from old.is_admin) then
    if not (public.is_admin() or auth.role() = 'service_role') then
      raise exception 'Modification du plan/privilèges réservée aux administrateurs.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on profiles;
create trigger profiles_guard_privileges
  before update on profiles
  for each row execute function public.guard_profile_privileges();

-- ============================================================
-- MIGRATION — signup phone capture (re-runnable)
-- Phone is now REQUIRED at registration; the signup trigger must
-- copy it from the auth metadata into profiles.phone. Re-running
-- `create or replace` is safe; existing rows are unaffected.
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- EXTRACTION JOBS — durable, chunked MCQ extraction (re-runnable)
-- The admin MCQ importer no longer runs Gemini in a single request:
-- multi-page PDFs blew past Vercel's 60s function limit → 504. Each
-- upload becomes a job processed a few pages at a time while the
-- browser polls until done. One row per import. Safe to re-run.
-- ============================================================
create table if not exists extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',     -- pending | processing | done | error
  questions_path text not null,               -- Storage path in the `extractions` bucket
  corrections_path text,                       -- optional corrigé, same bucket
  cursor int not null default 0,               -- next page index to process
  total_pages int,                             -- filled on the first step
  result jsonb not null default '[]'::jsonb,   -- accumulated ExtractedMCQ[]
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists extraction_jobs_admin_idx on extraction_jobs(admin_id, created_at);

alter table extraction_jobs enable row level security;

-- Admins see and drive only their own jobs.
drop policy if exists "Admins manage own extraction jobs" on extraction_jobs;
create policy "Admins manage own extraction jobs"
  on extraction_jobs for all
  using (public.is_admin() and admin_id = auth.uid())
  with check (public.is_admin() and admin_id = auth.uid());

-- A role needs a table-level GRANT before RLS is evaluated, or PostgREST
-- returns "permission denied for table" (42501).
grant all on extraction_jobs to anon, authenticated, service_role;

-- ============================================================
-- REPORTS — student "Signaler" (content error reports). Created from any
-- content surface (QCM, IA, bibliothèque). ADMINS ONLY read/manage them:
-- there is deliberately NO student SELECT policy, so reports never surface
-- in student dashboards. Re-runnable.
-- ============================================================
create table if not exists reports (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  context text not null,                  -- 'mcq' | 'ai' | 'library' | 'autre'
  context_id text,                        -- reported item id (mcq/library/chat id…), or null
  label text,                             -- short human label (question snippet, doc title…)
  message text,                           -- optional free-text description
  status text not null default 'open',    -- 'open' | 'resolved'
  created_at timestamptz default now()
);
create index if not exists reports_status_idx on reports(status, created_at desc);

alter table reports enable row level security;

-- Any authenticated user may CREATE their own report…
drop policy if exists "Users create reports" on reports;
create policy "Users create reports"
  on reports for insert to authenticated with check (auth.uid() = user_id);

-- …but ONLY admins can read / resolve / delete them (never shown to students).
drop policy if exists "Admins read reports" on reports;
create policy "Admins read reports" on reports for select using (public.is_admin());
drop policy if exists "Admins update reports" on reports;
create policy "Admins update reports" on reports for update using (public.is_admin());
drop policy if exists "Admins delete reports" on reports;
create policy "Admins delete reports" on reports for delete using (public.is_admin());

grant all on reports to anon, authenticated, service_role;
grant usage, select on sequence reports_id_seq to anon, authenticated, service_role;

-- ============================================================
-- HARDEN USAGE TABLES (re-runnable) — SECURITY
-- mcq_attempts and ai_usage previously had `for all` user policies, which let a
-- student UPDATE/DELETE their OWN rows from the browser client: deleting rows
-- resets the daily quota (→ unlimited practice / AI), and editing is_correct
-- inflates XP / streak / leaderboard. Restrict both to SELECT + INSERT of their
-- own rows. The app only ever INSERTs these via the user session (recordAttempt
-- / recordAiUsage); account deletion uses the service role, which bypasses RLS.
-- Also add the index the daily-quota / stats / streak queries rely on.
-- RUN THIS on existing databases — it closes a real quota/leaderboard bypass.
-- ============================================================
drop policy if exists "Users own attempts" on mcq_attempts;
drop policy if exists "Users read own attempts" on mcq_attempts;
drop policy if exists "Users insert own attempts" on mcq_attempts;
create policy "Users read own attempts"
  on mcq_attempts for select using (auth.uid() = user_id);
create policy "Users insert own attempts"
  on mcq_attempts for insert with check (auth.uid() = user_id);

drop policy if exists "Users own ai_usage" on ai_usage;
drop policy if exists "Users read own ai_usage" on ai_usage;
drop policy if exists "Users insert own ai_usage" on ai_usage;
create policy "Users read own ai_usage"
  on ai_usage for select using (auth.uid() = user_id);
create policy "Users insert own ai_usage"
  on ai_usage for insert with check (auth.uid() = user_id);

create index if not exists mcq_attempts_user_day_idx on mcq_attempts(user_id, created_at);

-- ============================================================
-- PROTECT MCQ CONTENT (re-runnable) — SECURITY / freemium
-- Previously ANY authenticated user could `select *` the whole ready MCQ bank
-- (questions + correct + explanation) straight from the browser client, which
-- bypassed the daily quota and the paywall entirely. Drop the broad student
-- read policy: students no longer read `mcqs` directly at all. MCQs are served
-- ONLY through the quota-enforcing server actions (getPracticeQuestions etc.),
-- which read with the service role. Admins keep full access via the existing
-- "Admins full access mcqs" policy. RUN THIS on existing databases.
-- ============================================================
drop policy if exists "Students read ready mcqs" on mcqs;

-- ============================================================
-- SINGLE ACTIVE SESSION (re-runnable) — anti account-sharing
-- Each login writes a fresh token here and mirrors it in the `mp_session`
-- cookie; the middleware signs out any device whose cookie token no longer
-- matches (newest login wins). Updating session_token is allowed by the
-- "Users update own profile" policy (not blocked by the privilege guard).
-- RUN THIS.
-- ============================================================
alter table profiles add column if not exists session_token text;

-- ============================================================
-- AI-GENERATED MCQ EXPLANATIONS CACHE (re-runnable)
-- Students can tap "Explique avec l'IA" on a QCM correction; the generated
-- explanation is cached here so it's produced once per question — not per click
-- or per student. Kept separate from `explanation` (official/admin text) so the
-- two never overwrite each other. Written by the explainMcq server action via
-- the service role. RUN THIS.
-- ============================================================
alter table mcqs add column if not exists ai_explanation text;
