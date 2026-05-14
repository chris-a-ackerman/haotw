// Hybrid Profile claims. The 14-name roster is the source of truth here —
// the same list lives in supabase/seed.sql so live mode reads identical data.
//
// Public surface (all async):
//   listProfiles()      -> string[]
//   unclaimed()         -> string[]
//   claim(profile)      -> { ok, error? }
//   match(fullName)     -> string | null   (sync — pure heuristic)
//   transferEmail(o,n)  -> void   (no-op when live; auth handles email moves)
//   reset()             -> void   (dev fallback; removes the localStorage key)

import { supabase, isLive, logSupabaseError } from './supabase.js';
import { setHybridProfile } from './auth.js';

export const HYBRID_PROFILES = [
  'Chris Ackerman', 'Jake Bernhardt',  'Caleb Shulman', 'Will Clifford',
  'Ryan Dombroski', 'Paul Flanagan',   'Logan Liljeberg','Long Tran',
  'Ed Coleman',     'Hank McGreen',    'Josh Beasley',  'Dan Lignos',
  'Franco Nieto',   'James Helf',
];

const STORAGE_CLAIMS = 'haotw.claims';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_CLAIMS) || '{}'); }
  catch { return {}; }
}
function saveLocal(c) { localStorage.setItem(STORAGE_CLAIMS, JSON.stringify(c)); }

export async function listProfiles() {
  if (!isLive()) return [...HYBRID_PROFILES];
  const { data, error } = await supabase
    .from('hybrid_profiles')
    .select('display_name')
    .order('id', { ascending: true });
  if (error) {
    logSupabaseError('listProfiles failed, falling back to constant', error);
    return [...HYBRID_PROFILES];
  }
  return data.map(r => r.display_name);
}

// Roster with the claimant's portrait attached when available. Used by the
// Issue screen so the recipient grid shows real faces instead of initials.
export async function listProfilesWithPhotos() {
  if (!isLive()) {
    const claims = loadLocal();
    let users = [];
    try { users = JSON.parse(localStorage.getItem('haotw.users') || '[]'); }
    catch {}
    const photoByEmail = new Map(
      users.map(u => [(u.email || '').toLowerCase(), u.photo || null])
    );
    return HYBRID_PROFILES.map(name => {
      const claim = claims[name];
      const photoUrl = claim
        ? photoByEmail.get((claim.email || '').toLowerCase()) || null
        : null;
      return { name, photoUrl };
    });
  }
  const [{ data: profiles, error: pErr },
         { data: claims,   error: cErr },
         { data: rows,     error: rErr }] = await Promise.all([
    supabase.from('hybrid_profiles').select('id, display_name').order('id'),
    supabase.from('profile_claims').select('hybrid_profile_id, user_id'),
    supabase.from('profiles').select('user_id, photo_url'),
  ]);
  if (pErr || cErr || rErr) {
    logSupabaseError('listProfilesWithPhotos failed, falling back to constant',
      pErr || cErr || rErr);
    return HYBRID_PROFILES.map(name => ({ name, photoUrl: null }));
  }
  const photoByUser = new Map((rows || []).map(r => [r.user_id, r.photo_url]));
  const userByProfileId = new Map(
    (claims || []).map(c => [c.hybrid_profile_id, c.user_id])
  );
  return (profiles || []).map(p => ({
    name: p.display_name,
    photoUrl: photoByUser.get(userByProfileId.get(p.id)) || null,
  }));
}

export async function unclaimed() {
  if (!isLive()) {
    const c = loadLocal();
    return HYBRID_PROFILES.filter((p) => !c[p]);
  }
  // Anti-join: profiles minus those with a claim row.
  const [{ data: profiles, error: pErr },
         { data: claims,   error: cErr }] = await Promise.all([
    supabase.from('hybrid_profiles').select('id, display_name').order('id'),
    supabase.from('profile_claims').select('hybrid_profile_id'),
  ]);
  if (pErr || cErr) {
    // Fall back to the full roster so the ClaimScreen can still render and the
    // user can attempt a claim. Claims.claim() surfaces a PK conflict if they
    // pick a name that's already taken.
    logSupabaseError('unclaimed() failed, falling back to constant', pErr || cErr);
    return [...HYBRID_PROFILES];
  }
  const claimed = new Set((claims || []).map(r => r.hybrid_profile_id));
  return (profiles || [])
    .filter(p => !claimed.has(p.id))
    .map(p => p.display_name);
}

export async function claim(profile, email) {
  if (!isLive()) {
    const c = loadLocal();
    c[profile] = { email, claimedOn: new Date().toISOString() };
    saveLocal(c);
    return { ok: true };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };
  const { data: row, error: lookupErr } = await supabase
    .from('hybrid_profiles')
    .select('id')
    .eq('display_name', profile)
    .single();
  if (lookupErr || !row) return { ok: false, error: 'Profile not found.' };
  const { error } = await supabase
    .from('profile_claims')
    .insert({ hybrid_profile_id: row.id, user_id: user.id });
  if (error) return { ok: false, error: error.message };
  await setHybridProfile(profile);
  return { ok: true };
}

export function reset() {
  if (!isLive()) {
    localStorage.removeItem(STORAGE_CLAIMS);
    return;
  }
  console.warn('claims.reset() is a no-op in live mode. Truncate profile_claims via SQL.');
}

export function transferEmail(oldEmail, newEmail) {
  if (isLive()) return; // claims keyed on user_id, not email — no work needed
  if (!oldEmail || !newEmail || oldEmail === newEmail) return;
  const c = loadLocal();
  let dirty = false;
  for (const k of Object.keys(c)) {
    const rec = c[k];
    if (rec && rec.email && rec.email.toLowerCase() === oldEmail.toLowerCase()) {
      c[k] = { ...rec, email: newEmail };
      dirty = true;
    }
  }
  if (dirty) saveLocal(c);
}

// Heuristic name match — pure function, identical to the prototype. Caller
// must pass an already-resolved unclaimed list so this stays sync.
export function match(fullName, unclaimedList) {
  const tokens = (s) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z\s'-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3);

  const userTokens = tokens(fullName);
  if (userTokens.length === 0) return null;
  const userLast = userTokens[userTokens.length - 1];
  const userSet  = new Set(userTokens);

  let best = null;
  let bestScore = 0;
  for (const p of unclaimedList) {
    const pTokens = tokens(p);
    const pLast = pTokens[pTokens.length - 1];
    let score = 0;
    for (const t of pTokens) if (userSet.has(t)) score += 1;
    if (pLast && pLast === userLast) score += 2;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 2 ? best : null;
}
