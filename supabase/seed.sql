-- Seed the Hybrid Profiles roster. Same 14 names that lived in the original
-- ClaimScreen.jsx constant, in original order. Slug is computed inline so
-- the seed works against either schema state — migration 0004 sets slug
-- NOT NULL after backfilling existing rows, but a fresh-DB seed inserts
-- before the backfill UPDATE can find anything.
insert into public.hybrid_profiles (display_name, slug) values
  ('Chris Ackerman',  'chris-ackerman'),
  ('Jake Bernhardt',  'jake-bernhardt'),
  ('Caleb Shulman',   'caleb-shulman'),
  ('Will Clifford',   'will-clifford'),
  ('Ryan Dombroski',  'ryan-dombroski'),
  ('Paul Flanagan',   'paul-flanagan'),
  ('Logan Liljeberg', 'logan-liljeberg'),
  ('Long Tran',       'long-tran'),
  ('Ed Coleman',      'ed-coleman'),
  ('Hank McGreen',    'hank-mcgreen'),
  ('Josh Beasley',    'josh-beasley'),
  ('Dan Lignos',      'dan-lignos'),
  ('Franco Nieto',    'franco-nieto'),
  ('James Helf',      'james-helf')
on conflict (display_name) do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- Coaching Tree seed (depends on migration 0004)
-- Re-runnable: every insert uses ON CONFLICT … DO NOTHING and every cross-
-- table insert resolves ids by lookup at run time.
-- ─────────────────────────────────────────────────────────────────────

-- Non-member identities (the four mothers). These rows participate in the
-- Coaching Tree only and never appear on /stats. Slug is computed inline to
-- satisfy the NOT NULL constraint that migration 0004 set on hybrid_profiles.
insert into public.hybrid_profiles (display_name, is_member, slug) values
  ('Linda Liljeberg',   false, 'linda-liljeberg'),
  ('Laura Dombroski',   false, 'laura-dombroski'),
  ('Allison Bernhardt', false, 'allison-bernhardt'),
  ('Linda Flanagan',    false, 'linda-flanagan')
on conflict (display_name) do nothing;

-- Slug backfill for the existing 14-name roster, in case the migration's
-- backfill ran before any seeds existed.
update public.hybrid_profiles
   set slug = regexp_replace(
                lower(regexp_replace(display_name, '[^a-zA-Z0-9]+', '-', 'g')),
                '(^-|-$)', '', 'g')
 where slug is null;

-- Distinctions (six labels, BAA blue default; the Registrar may amend after).
insert into public.distinctions (name, short_name, icon, color, description) values
  ('Troubled Soles Run Club — Franklin, MA',          'Troubled Soles',           '🏃‍♀️', '#003DA5', 'Members of the Troubled Soles Run Club in Franklin, Massachusetts.'),
  ('Disciple of the Troubled Soles Coaching Tree',    'Troubled Soles Disciple',  '🏃',  '#003DA5', 'Members of the Hybrid Athletes raised in the TSRC coaching tradition.'),
  ('Attended Boston College',                         'BC',                       '🦅',  '#003DA5', 'Members who attended Boston College.'),
  ('Currently at MIT Sloan',                          'MIT Sloan',                '🏛️', '#003DA5', 'Members currently enrolled at MIT Sloan School of Management.'),
  ('2024 Sugarloaf Marathon Finisher',                'Sugarloaf ''24 · Finisher','🔺',  '#003DA5', 'Completed the 2024 Sugarloaf Marathon.'),
  ('2024 Sugarloaf Marathon Participant',             'Sugarloaf ''24 · Participant','🔻','#003DA5','Started the 2024 Sugarloaf Marathon.')
on conflict (name) do nothing;

-- Person ↔ Distinction memberships.
insert into public.person_distinctions (person_id, distinction_id)
select hp.id, d.id
  from public.hybrid_profiles hp, public.distinctions d
 where (d.name, hp.display_name) in (
        ('Troubled Soles Run Club — Franklin, MA',       'Linda Liljeberg'),
        ('Troubled Soles Run Club — Franklin, MA',       'Laura Dombroski'),
        ('Troubled Soles Run Club — Franklin, MA',       'Allison Bernhardt'),
        ('Disciple of the Troubled Soles Coaching Tree', 'Ryan Dombroski'),
        ('Disciple of the Troubled Soles Coaching Tree', 'Logan Liljeberg'),
        ('Attended Boston College',                      'Jake Bernhardt'),
        ('Attended Boston College',                      'James Helf'),
        ('Attended Boston College',                      'Paul Flanagan'),
        ('Attended Boston College',                      'Franco Nieto'),
        ('Attended Boston College',                      'Dan Lignos'),
        ('Currently at MIT Sloan',                       'Jake Bernhardt'),
        ('Currently at MIT Sloan',                       'Chris Ackerman'),
        ('Currently at MIT Sloan',                       'Josh Beasley'),
        ('Currently at MIT Sloan',                       'Ed Coleman'),
        ('Currently at MIT Sloan',                       'Paul Flanagan'),
        ('2024 Sugarloaf Marathon Finisher',             'Jake Bernhardt'),
        ('2024 Sugarloaf Marathon Finisher',             'Paul Flanagan'),
        ('2024 Sugarloaf Marathon Participant',          'Ed Coleman'),
        ('2024 Sugarloaf Marathon Participant',          'Long Tran'),
        ('2024 Sugarloaf Marathon Participant',          'Caleb Shulman'),
        ('2024 Sugarloaf Marathon Participant',          'Hank McGreen'),
        ('2024 Sugarloaf Marathon Participant',          'Will Clifford')
       )
on conflict do nothing;

-- Parent edges (4): mother → child.
insert into public.relationships (from_person, to_person, kind, note)
select f.id, t.id, 'parent', null
  from public.hybrid_profiles f, public.hybrid_profiles t
 where (f.display_name, t.display_name) in (
        ('Linda Liljeberg',   'Logan Liljeberg'),
        ('Laura Dombroski',   'Ryan Dombroski'),
        ('Allison Bernhardt', 'Jake Bernhardt'),
        ('Linda Flanagan',    'Paul Flanagan')
       )
on conflict (from_person, to_person, kind) do nothing;

-- Recruited edges (11): member → member.
insert into public.relationships (from_person, to_person, kind, note)
select f.id, t.id, 'recruited', null
  from public.hybrid_profiles f, public.hybrid_profiles t
 where (f.display_name, t.display_name) in (
        ('Jake Bernhardt', 'Chris Ackerman'),
        ('Jake Bernhardt', 'Josh Beasley'),
        ('Jake Bernhardt', 'Ed Coleman'),
        ('Jake Bernhardt', 'James Helf'),
        ('Paul Flanagan',  'Franco Nieto'),
        ('Paul Flanagan',  'Long Tran'),
        ('Paul Flanagan',  'Caleb Shulman'),
        ('Long Tran',      'Hank McGreen'),
        ('Long Tran',      'Will Clifford'),
        ('Long Tran',      'Dan Lignos'),
        ('Will Clifford',  'Clem Carranza')
       )
on conflict (from_person, to_person, kind) do nothing;

-- Clem Carranza is referenced as a recruit of Will Clifford in the PDF but is
-- not on the canonical 14-name roster. Insert as a member so the recruited
-- edge above resolves; the Registrar may amend later.
insert into public.hybrid_profiles (display_name, is_member, slug) values
  ('Clem Carranza', true, 'clem-carranza')
on conflict (display_name) do nothing;

-- Re-run the recruited Will → Clem insert now that Clem exists. (The first
-- pass silently dropped that row because the JOIN had no Clem id to find.)
insert into public.relationships (from_person, to_person, kind, note)
select f.id, t.id, 'recruited', null
  from public.hybrid_profiles f, public.hybrid_profiles t
 where f.display_name = 'Will Clifford' and t.display_name = 'Clem Carranza'
on conflict (from_person, to_person, kind) do nothing;

-- Lateral connection: the single strava_dm edge that fused the Flanagan and
-- Bernhardt sub-trees. Direction matters — Paul initiated.
insert into public.relationships (from_person, to_person, kind, note)
select f.id, t.id, 'strava_dm', 'Inbound to Bernhardt from Flanagan via Strava DM'
  from public.hybrid_profiles f, public.hybrid_profiles t
 where f.display_name = 'Paul Flanagan' and t.display_name = 'Jake Bernhardt'
on conflict (from_person, to_person, kind) do nothing;
