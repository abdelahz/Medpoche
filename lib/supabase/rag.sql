-- ============================================================
-- MEDENPOCHE — RAG knowledge base (Step 12)
-- Run this in the Supabase SQL editor (after schema.sql).
-- Vector search over the Dataset IA: the AI tutor retrieves
-- grounded context from here. Idempotent — safe to re-run.
-- ============================================================

-- pgvector ships with Supabase; just enable it.
create extension if not exists vector;

-- Per-file indexing state on the Dataset IA.
alter table dataset add column if not exists index_status text default 'pending'; -- pending | indexing | indexed | failed
alter table dataset add column if not exists indexed_at timestamptz;
alter table dataset add column if not exists chunk_count int default 0;
-- > 0 marks a PRIMARY reference: its chunks are floated first in retrieval
-- (e.g. the physique-chimie tips book becomes the go-to source for those matières).
alter table dataset add column if not exists priority int not null default 0;

-- One row per embedded chunk of a dataset document.
create table if not exists dataset_chunks (
  id           bigserial primary key,
  dataset_id   int references dataset(id) on delete cascade,
  content      text not null,
  embedding    vector(768),            -- text-embedding-004 output dimension
  module       text,                   -- optional matière tag (filtered retrieval)
  subject      text,                   -- optional cours / chapitre
  source_title text,                   -- denormalized title, for citations
  page         int,
  chunk_index  int,
  created_at   timestamptz default now()
);

create index if not exists dataset_chunks_dataset_id_idx on dataset_chunks(dataset_id);
-- Approximate nearest-neighbour (cosine) index for fast retrieval.
create index if not exists dataset_chunks_embedding_idx
  on dataset_chunks using hnsw (embedding vector_cosine_ops);

alter table dataset_chunks enable row level security;

-- Admins manage the corpus directly. Students NEVER read chunks through the
-- table — retrieval goes via match_chunks() below — so there is no student
-- SELECT policy here.
drop policy if exists "Admins manage dataset_chunks" on dataset_chunks;
create policy "Admins manage dataset_chunks"
  on dataset_chunks for all using (public.is_admin());

-- Cosine-similarity retrieval. SECURITY DEFINER so authenticated students can
-- pull grounded context without a direct read grant on the table. Returns only
-- chunk content + citation metadata, capped at 20 rows. `priority` is the source
-- document's priority (0 for MCQ chunks) — the caller floats primary refs first.
-- Return-type change → drop before recreate.
drop function if exists public.match_chunks(vector, int, text);
create or replace function public.match_chunks(
  query_embedding vector(768),
  match_count int default 6,
  filter_module text default null
)
returns table (
  id bigint,
  content text,
  source_title text,
  page int,
  module text,
  subject text,
  priority int,
  similarity float
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id, c.content, c.source_title, c.page, c.module, c.subject,
    coalesce(d.priority, 0)::int as priority,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.dataset_chunks c
  left join public.dataset d on d.id = c.dataset_id
  where c.embedding is not null
    and (filter_module is null or c.module = filter_module)
  order by c.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

grant execute on function public.match_chunks(vector, int, text) to authenticated, service_role;

-- ============================================================
-- Step 12.4 — index the MCQ bank into the same knowledge store.
-- A chunk can now come from a dataset file OR a published MCQ.
-- ============================================================
alter table dataset_chunks add column if not exists source_type text default 'dataset'; -- 'dataset' | 'mcq'
alter table dataset_chunks add column if not exists mcq_id int references mcqs(id) on delete cascade;
create index if not exists dataset_chunks_mcq_id_idx on dataset_chunks(mcq_id);

-- ============================================================
-- App settings (key/value) — e.g. the admin-editable AI tutor
-- instructions. Readable by authenticated users (the tutor loads
-- them at request time); only admins can write.
-- ============================================================
create table if not exists app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

alter table app_settings enable row level security;

drop policy if exists "Authenticated read settings" on app_settings;
create policy "Authenticated read settings"
  on app_settings for select using (auth.role() = 'authenticated');

drop policy if exists "Admins manage settings" on app_settings;
create policy "Admins manage settings"
  on app_settings for all using (public.is_admin());
