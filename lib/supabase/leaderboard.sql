-- ============================================================
-- MEDENPOCHE — Weekly leaderboard (gamification)
-- Run this in the Supabase SQL editor. Idempotent.
-- Computes the weekly XP ranking LIVE from mcq_attempts (no extra
-- storage, no reset job — the week window moves with now()).
-- XP matches lib/gamification: correct = 10, wrong = 4.
-- SECURITY DEFINER so authenticated students can read the ranking
-- (names + XP only) without read access to other users' attempts.
-- Display = prénom + initiale du nom (privacy-safe for minors).
-- ============================================================
create or replace function public.weekly_leaderboard(p_limit int default 100)
returns table (
  rank bigint,
  user_id uuid,
  display text,
  filiere text,
  xp bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with week_xp as (
    select a.user_id,
           sum(case when a.is_correct then 10 else 4 end)::bigint as xp
    from mcq_attempts a
    where a.created_at >= date_trunc('week', now())
    group by a.user_id
  )
  select
    row_number() over (order by w.xp desc, p.created_at asc) as rank,
    w.user_id,
    coalesce(nullif(trim(p.prenom), ''), split_part(coalesce(p.full_name, ''), ' ', 1), 'Élève')
      || case when coalesce(trim(p.nom), '') <> '' then ' ' || upper(left(trim(p.nom), 1)) || '.' else '' end
      as display,
    p.filiere,
    w.xp
  from week_xp w
  join profiles p on p.id = w.user_id
  where coalesce(p.is_admin, false) = false   -- students only
  order by w.xp desc, p.created_at asc
  limit greatest(1, least(p_limit, 500));
$$;

grant execute on function public.weekly_leaderboard(int) to authenticated, service_role;
