-- HAOTW initial schema. Apply with `supabase db reset` (local) or via the
-- dashboard SQL editor on a hosted project.
--
-- Tables:
--   profiles         — app metadata for each auth user (name, photo, claim)
--   hybrid_profiles  — the seeded 14-name roster
--   profile_claims   — one auth user ↔ one hybrid_profile
--   determinations   — the official record (one row per determination)
--
-- Storage buckets:
--   certificates — public PNGs of the shareable artifacts
--   avatars      — user-uploaded portraits (currently inlined as data URLs;
--                  this bucket exists so the migration to file uploads is a
--                  one-line client change)

-- ─────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  photo_url text,
  hybrid_profile text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- hybrid_profiles (the roster)
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.hybrid_profiles (
  id serial primary key,
  display_name text not null unique
);

-- ─────────────────────────────────────────────────────────────────────
-- profile_claims
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.profile_claims (
  hybrid_profile_id int primary key references public.hybrid_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_on timestamptz default now()
);
create unique index if not exists profile_claims_user_unique on public.profile_claims(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- determinations
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.determinations (
  id uuid primary key default gen_random_uuid(),
  determination_number int not null unique,
  is_current boolean not null default false,
  winners text[] not null,
  determiner text not null,
  determined_on date not null,
  citation text not null,
  speech text not null,
  certificate_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.hybrid_profiles enable row level security;
alter table public.profile_claims  enable row level security;
alter table public.determinations  enable row level security;

-- profiles: every authed user can read every profile (it's a friend group;
-- the drawer shows other members' names). Each user writes their own row.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = user_id);

-- hybrid_profiles: seeded roster, readable by any authed user
drop policy if exists "hybrid_profiles read" on public.hybrid_profiles;
create policy "hybrid_profiles read" on public.hybrid_profiles
  for select using (auth.role() = 'authenticated');

-- profile_claims: anyone authed can read (the drawer needs to know who's claimed
-- which name); only the claimant can insert/delete their own row.
drop policy if exists "claims read" on public.profile_claims;
create policy "claims read" on public.profile_claims
  for select using (auth.role() = 'authenticated');

drop policy if exists "claims insert self" on public.profile_claims;
create policy "claims insert self" on public.profile_claims
  for insert with check (auth.uid() = user_id);

drop policy if exists "claims delete self" on public.profile_claims;
create policy "claims delete self" on public.profile_claims
  for delete using (auth.uid() = user_id);

-- determinations: any authed member reads; for v1, any authed user can insert
-- (the UI gates this to the current champion; tightening to a SECURITY DEFINER
-- function that verifies "are you the current champion?" is a follow-up).
drop policy if exists "determinations read" on public.determinations;
create policy "determinations read" on public.determinations
  for select using (auth.role() = 'authenticated');

drop policy if exists "determinations insert authed" on public.determinations;
create policy "determinations insert authed" on public.determinations
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "determinations update authed" on public.determinations;
create policy "determinations update authed" on public.determinations
  for update using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────
-- Auto-create a profiles row on signup so the rest of the app can rely
-- on its existence.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'photo', new.raw_user_meta_data->>'avatar_url')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- Storage buckets
-- ─────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('certificates', 'certificates', true),
  ('avatars',      'avatars',      true)
on conflict (id) do nothing;

-- Bucket policies
drop policy if exists "certs read" on storage.objects;
create policy "certs read" on storage.objects
  for select using (bucket_id = 'certificates');

drop policy if exists "certs write authed" on storage.objects;
create policy "certs write authed" on storage.objects
  for insert with check (bucket_id = 'certificates' and auth.role() = 'authenticated');

drop policy if exists "certs update authed" on storage.objects;
create policy "certs update authed" on storage.objects
  for update using (bucket_id = 'certificates' and auth.role() = 'authenticated');

drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars write authed" on storage.objects;
create policy "avatars write authed" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars update authed" on storage.objects;
create policy "avatars update authed" on storage.objects
  for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');
