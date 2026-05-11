// Auth service. Single async surface, two implementations:
//   - localStorage fallback when Supabase env vars are unset (dev demos)
//   - Supabase auth + a `profiles` row for app metadata when live
//
// Public surface (all return Promises):
//   loadSession()                         -> Session | null
//   signIn({email,password})              -> {ok, session?, error?}
//   signUp({name,email,password,photo})   -> {ok, session?, error?}
//   signInWithGoogle()                    -> {ok, session?, error?}
//   requestPasswordReset({email})         -> {ok, error?, devReset?}
//   completePasswordReset({email,password}) -> {ok, session?, error?}
//   signOut()                             -> void
//   updateUser({oldEmail,name,email,password,currentPassword})
//                                         -> {ok, session?, error?}
//   updatePhoto({email,photo})            -> {ok, session?, error?}
//   onAuthStateChange(cb)                 -> {unsubscribe}  (sync)
//
// Session shape (mirrors original prototype, plus user_id when live):
//   { email, name, photo, hybridProfile?, provider?, user_id? }

import { supabase, isLive } from './supabase.js';

const STORAGE_USERS   = 'haotw.users';
const STORAGE_SESSION = 'haotw.session';

/* ---------------- localStorage helpers ------------------------------- */
function loadUsersLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]'); }
  catch { return []; }
}
function saveUsersLocal(u) { localStorage.setItem(STORAGE_USERS, JSON.stringify(u)); }
function loadSessionLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SESSION) || 'null'); }
  catch { return null; }
}
function saveSessionLocal(s) {
  if (s) localStorage.setItem(STORAGE_SESSION, JSON.stringify(s));
  else   localStorage.removeItem(STORAGE_SESSION);
}

/* ---------------- session adapters ----------------------------------- */
// Supabase user → app session. Reads name/photo from user_metadata, then
// falls back to a profiles row (loaded by caller and merged in below).
function sessionFromUser(user, profile) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    user_id: user.id,
    email:   user.email,
    name:    (profile && profile.name) || meta.name || meta.full_name || '',
    photo:   (profile && profile.photo_url) || meta.photo || meta.avatar_url || null,
    provider: user.app_metadata && user.app_metadata.provider,
    hybridProfile: profile && profile.hybrid_profile,
  };
}

async function fetchProfile(userId) {
  if (!isLive() || !userId) return null;
  // Race the query against a short timeout as defensive cover for a flaky
  // network. Falling back to null routes the user to ClaimScreen, which is
  // recoverable; hanging the auth gate is not.
  const query = supabase
    .from('profiles')
    .select('name, photo_url, hybrid_profile')
    .eq('user_id', userId)
    .maybeSingle();
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      console.warn('profile fetch timed out after 2000ms');
      resolve({ data: null, error: { code: 'TIMEOUT' } });
    }, 2000);
  });
  const { data, error } = await Promise.race([query, timeout]);
  clearTimeout(timer);
  if (error && error.code !== 'PGRST116' && error.code !== 'TIMEOUT') {
    // PGRST116 = no rows; that's fine for new users.
    console.warn('profile fetch failed', error);
  }
  return data;
}

async function upsertProfile(userId, patch) {
  if (!isLive() || !userId) return;
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  if (error) console.warn('profile upsert failed', error);
}

/* ---------------- public API ----------------------------------------- */
export async function loadSession() {
  if (!isLive()) return loadSessionLocal();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const profile = await fetchProfile(session.user.id);
  return sessionFromUser(session.user, profile);
}

export async function signIn({ email, password }) {
  if (!isLive()) {
    const users = loadUsersLocal();
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) {
      return { ok: false, error: 'Email or password not on file.' };
    }
    const session = { email: u.email, name: u.name, photo: u.photo };
    saveSessionLocal(session);
    return { ok: true, session };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: 'Email or password not on file.' };
  const profile = await fetchProfile(data.user.id);
  return { ok: true, session: sessionFromUser(data.user, profile) };
}

export async function signUp({ name, email, password, photo }) {
  if (!isLive()) {
    const users = loadUsersLocal();
    if (users.some(x => x.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    const user = { name, email, password, photo: photo || null };
    users.push(user);
    saveUsersLocal(users);
    const session = { email, name, photo: photo || null };
    saveSessionLocal(session);
    return { ok: true, session };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, photo: photo || null } },
  });
  if (error) {
    const msg = /already registered|already exists/i.test(error.message)
      ? 'An account with that email already exists.'
      : error.message;
    return { ok: false, error: msg };
  }
  if (data.user) {
    await upsertProfile(data.user.id, { name, photo_url: photo || null });
  }
  const profile = await fetchProfile(data.user && data.user.id);
  return { ok: true, session: sessionFromUser(data.user, profile) };
}

// Dev mode short-circuits the email step: if the address is on file we return
// devReset: true so the UI can advance to set-passphrase inline. We don't
// leak existence either way — the wording stays "if on file".
export async function requestPasswordReset({ email }) {
  const addr = (email || '').trim();
  if (!addr) return { ok: false, error: 'An email of record is required.' };

  if (!isLive()) {
    const users = loadUsersLocal();
    const found = users.some((u) => u.email.toLowerCase() === addr.toLowerCase());
    return { ok: true, devReset: found };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(addr, {
    redirectTo: window.location.origin,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Live mode relies on Supabase's recovery session (established when the user
// follows the email link). Dev mode looks the user up by email.
export async function completePasswordReset({ email, password }) {
  if (!password || password.length < 6) {
    return { ok: false, error: 'Passphrase must be at least 6 characters.' };
  }
  if (!isLive()) {
    const users = loadUsersLocal();
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === (email || '').toLowerCase()
    );
    if (idx < 0) return { ok: false, error: 'That email is no longer on file.' };
    users[idx] = { ...users[idx], password };
    saveUsersLocal(users);
    const session = {
      email: users[idx].email,
      name:  users[idx].name,
      photo: users[idx].photo,
    };
    saveSessionLocal(session);
    return { ok: true, session };
  }
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  const profile = await fetchProfile(data.user && data.user.id);
  return { ok: true, session: sessionFromUser(data.user, profile) };
}

export async function signInWithGoogle() {
  if (!isLive()) {
    const session = {
      email: 'theo.clifford@gmail.com',
      name: 'Theodore J. Clifford',
      photo: null,
      provider: 'google',
    };
    saveSessionLocal(session);
    return { ok: true, session };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: null };
}

export async function signOut() {
  if (!isLive()) {
    saveSessionLocal(null);
    return;
  }
  await supabase.auth.signOut();
}

export async function updateUser({ oldEmail, name, email, password, currentPassword }) {
  if (!isLive()) {
    const users = loadUsersLocal();
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === (oldEmail || '').toLowerCase()
    );
    let user = idx >= 0 ? users[idx] : null;
    const isLocalUser = !!user;

    if (isLocalUser) {
      if (currentPassword == null || user.password !== currentPassword) {
        return { ok: false, error: 'Current passphrase does not match.' };
      }
    }
    const nextEmail = (email || (user && user.email) || oldEmail || '').trim();
    if (
      nextEmail.toLowerCase() !== (oldEmail || '').toLowerCase() &&
      users.some((u) => u.email.toLowerCase() === nextEmail.toLowerCase())
    ) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    const nextUser = {
      name:     (name != null ? name : (user ? user.name : '')) || '',
      email:    nextEmail,
      password: password || (user ? user.password : ''),
      photo:    user ? user.photo : null,
    };
    if (isLocalUser) users[idx] = nextUser;
    else users.push(nextUser);
    saveUsersLocal(users);

    const prev = loadSessionLocal() || {};
    const session = { ...prev, name: nextUser.name, email: nextUser.email, photo: nextUser.photo };
    saveSessionLocal(session);
    return { ok: true, session };
  }

  // Live mode: re-auth current pw via signInWithPassword (Supabase has no
  // explicit "verify password" — sign-in with the current pw is the standard
  // pattern), then update email/password/metadata.
  if (currentPassword) {
    const reauth = await supabase.auth.signInWithPassword({ email: oldEmail, password: currentPassword });
    if (reauth.error) return { ok: false, error: 'Current passphrase does not match.' };
  }
  const updates = {};
  if (email && email !== oldEmail) updates.email = email;
  if (password) updates.password = password;
  if (name != null) updates.data = { name };
  const { data, error } = await supabase.auth.updateUser(updates);
  if (error) {
    const msg = /already (registered|in use|taken)/i.test(error.message)
      ? 'An account with that email already exists.'
      : error.message;
    return { ok: false, error: msg };
  }
  if (data.user && name != null) {
    await upsertProfile(data.user.id, { name });
  }
  const profile = await fetchProfile(data.user && data.user.id);
  return { ok: true, session: sessionFromUser(data.user, profile) };
}

export async function updatePhoto({ email, photo }) {
  if (!isLive()) {
    const users = loadUsersLocal();
    const idx = users.findIndex(
      (u) => u.email.toLowerCase() === (email || '').toLowerCase()
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], photo: photo || null };
      saveUsersLocal(users);
    }
    const prev = loadSessionLocal() || {};
    const session = { ...prev, photo: photo || null };
    saveSessionLocal(session);
    return { ok: true, session };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };
  await upsertProfile(user.id, { photo_url: photo || null });
  await supabase.auth.updateUser({ data: { photo: photo || null } });
  const profile = await fetchProfile(user.id);
  return { ok: true, session: sessionFromUser(user, profile) };
}

export function onAuthStateChange(callback) {
  if (!isLive()) return { unsubscribe: () => {} };
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (!session) { callback(null, event); return; }
    // Defer the profile fetch out of the callback — supabase-js holds an
    // internal auth lock while running onAuthStateChange callbacks, and any
    // Supabase query awaited from inside the callback deadlocks on that lock.
    setTimeout(async () => {
      const profile = await fetchProfile(session.user.id);
      callback(sessionFromUser(session.user, profile), event);
    }, 0);
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}

// Internal helpers exposed for the claims service so it can store a chosen
// hybrid_profile back onto the active user's profile row.
export async function setHybridProfile(profileName) {
  if (!isLive()) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await upsertProfile(user.id, { hybrid_profile: profileName });
}
