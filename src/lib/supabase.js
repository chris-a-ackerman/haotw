import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (url && key) ? createClient(url, key) : null;
export const isLive = () => supabase !== null;

let cachedAuthContext = null;

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    const u = data?.session?.user;
    if (u) cachedAuthContext = { user_id: u.id, email: u.email };
  }).catch(() => {});
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAuthContext = session?.user
      ? { user_id: session.user.id, email: session.user.email }
      : null;
  });
}

export function logSupabaseError(label, err, extra) {
  console.warn(label, { error: err, user: cachedAuthContext, ...(extra || {}) });
}
