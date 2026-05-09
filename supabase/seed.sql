-- Seed the Hybrid Profiles roster. Same 14 names that lived in the original
-- ClaimScreen.jsx constant, in original order.
insert into public.hybrid_profiles (display_name) values
  ('Chris Ackerman'),
  ('Jake Bernhardt'),
  ('Caleb Shulman'),
  ('Will Clifford'),
  ('Ryan Dombroski'),
  ('Paul Flanagan'),
  ('Logan Liljeberg'),
  ('Long Tran'),
  ('Ed Coleman'),
  ('Hank McGreen'),
  ('Josh Beasley'),
  ('Dan Lignos'),
  ('Franco Nieto'),
  ('James Helf')
on conflict (display_name) do nothing;
