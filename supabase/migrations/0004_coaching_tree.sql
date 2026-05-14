-- Coaching Tree: extends hybrid_profiles with non-member identities and a
-- slug for /tree/:slug routes; adds three new tables (relationships,
-- distinctions, person_distinctions); promotes profiles.is_admin from a
-- hardcoded email allowlist (ADMIN_EMAILS in AdminBackfill.jsx) to a DB flag.
--
-- RLS: every new table is readable by any authed member, but writes are gated
-- by a SECURITY DEFINER is_admin() helper so the Registrar role can be granted
-- via DB seed without exposing self-promotion to the client.

-- ─────────────────────────────────────────────────────────────────────
-- Extend hybrid_profiles
-- ─────────────────────────────────────────────────────────────────────
alter table public.hybrid_profiles
  add column if not exists is_member boolean not null default true,
  add column if not exists photo_url text,
  add column if not exists slug      text;

-- Backfill slugs for existing rows (matches src/lib/certificate.js#slugify).
update public.hybrid_profiles
  set slug = lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g'))
  where slug is null;
update public.hybrid_profiles
  set slug = regexp_replace(slug, '(^-|-$)', '', 'g')
  where slug ~ '(^-|-$)';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'hybrid_profiles_slug_unique'
  ) then
    alter table public.hybrid_profiles
      add constraint hybrid_profiles_slug_unique unique (slug);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- relationships (typed edges in the coaching graph)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.relationships (
  id           uuid primary key default gen_random_uuid(),
  from_person  int  not null references public.hybrid_profiles(id) on delete cascade,
  to_person    int  not null references public.hybrid_profiles(id) on delete cascade,
  kind         text not null check (kind in ('recruited','parent','strava_dm')),
  note         text,
  created_at   timestamptz default now(),
  unique (from_person, to_person, kind),
  check (from_person <> to_person)
);
create index if not exists relationships_to_idx   on public.relationships(to_person);
create index if not exists relationships_from_idx on public.relationships(from_person);

-- ─────────────────────────────────────────────────────────────────────
-- distinctions (many-to-many labels)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.distinctions (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  short_name  text not null,
  icon        text,
  color       text,
  description text,
  created_at  timestamptz default now()
);

create table if not exists public.person_distinctions (
  person_id      int  not null references public.hybrid_profiles(id) on delete cascade,
  distinction_id uuid not null references public.distinctions(id) on delete cascade,
  primary key (person_id, distinction_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- profiles.is_admin (the Registrar role)
-- ─────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ─────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────
alter table public.relationships         enable row level security;
alter table public.distinctions          enable row level security;
alter table public.person_distinctions   enable row level security;

drop policy if exists "relationships read"        on public.relationships;
create policy "relationships read" on public.relationships
  for select using (auth.role() = 'authenticated');

drop policy if exists "distinctions read"         on public.distinctions;
create policy "distinctions read" on public.distinctions
  for select using (auth.role() = 'authenticated');

drop policy if exists "person_distinctions read"  on public.person_distinctions;
create policy "person_distinctions read" on public.person_distinctions
  for select using (auth.role() = 'authenticated');

-- is_admin() — SECURITY DEFINER so it can read profiles.is_admin even when
-- the caller's row-visibility doesn't include it. STABLE makes it safe to
-- call inline from policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where user_id = auth.uid()), false);
$$;

drop policy if exists "relationships admin write" on public.relationships;
create policy "relationships admin write" on public.relationships
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "distinctions admin write" on public.distinctions;
create policy "distinctions admin write" on public.distinctions
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "person_distinctions admin write" on public.person_distinctions;
create policy "person_distinctions admin write" on public.person_distinctions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- hybrid_profiles previously had only a read policy. Add an admin-write policy
-- so the Registrar can Inscribe/Amend/Excise from the admin surface.
drop policy if exists "hybrid_profiles admin write" on public.hybrid_profiles;
create policy "hybrid_profiles admin write" on public.hybrid_profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- profiles.is_admin is intentionally NOT self-promotable. The existing
-- "profiles self update" policy lets a user update their own row; we keep
-- that, but the only path to flipping is_admin is via the service role
-- (this migration, or a future migration / SQL editor session).

-- ─────────────────────────────────────────────────────────────────────
-- Bootstrap the Registrar role to whoever has claimed Jake Bernhardt.
-- Idempotent: re-runs are no-ops once is_admin is already true.
-- ─────────────────────────────────────────────────────────────────────
update public.profiles
   set is_admin = true
 where hybrid_profile = 'Jake Bernhardt'
   and is_admin = false;
