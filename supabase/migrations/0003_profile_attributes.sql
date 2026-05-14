-- Add optional per-user profile attributes: Strava URL and a free-text
-- athletic achievement. Both are nullable; existing rows are untouched.

alter table public.profiles
  add column if not exists strava_url text,
  add column if not exists achievement text;

-- Refresh handle_new_user so the trigger that auto-creates a profiles row on
-- signup also forwards the new metadata keys when the client supplies them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, photo_url, strava_url, achievement)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'photo', new.raw_user_meta_data->>'avatar_url'),
    nullif(new.raw_user_meta_data->>'strava_url', ''),
    nullif(new.raw_user_meta_data->>'achievement', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
