// App.jsx — session/auth shell. Loads the auth session, subscribes to changes,
// caches the determinations list, derives champion status, and renders the
// route tree under AppProvider. Individual screens read shared state via
// useAppContext().

import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import * as Auth from './lib/auth.js';
import { listDeterminations } from './lib/records.js';
import { listProfilesWithPhotos } from './lib/claims.js';
import { getTree, isAdmin as computeIsAdmin } from './lib/tree.js';

import { AppProvider } from './context/AppContext.jsx';
import AuthGate from './components/AuthGate.jsx';
import AppLayout from './components/AppLayout.jsx';
import ChampionRoute from './components/ChampionRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

import HomeScreen from './components/HomeScreen.jsx';
import RecordScreen from './components/RecordScreen.jsx';
import StatsScreen from './components/StatsScreen.jsx';
import IssueScreen from './components/IssueScreen.jsx';
import NoticeScreen from './components/NoticeScreen.jsx';
import CertificateScreen from './components/CertificateScreen.jsx';
import AdminBackfill from './components/AdminBackfill.jsx';
import TreeScreen from './components/TreeScreen.jsx';
import LineageScreen from './components/LineageScreen.jsx';
import RegistrarScreen from './components/RegistrarScreen.jsx';

function App() {
  const [authReady, setAuthReady] = React.useState(false);
  const [session, setSession] = React.useState(null);
  const [recoveryMode, setRecoveryMode] = React.useState(false);
  const [determinations, setDeterminations] = React.useState([]);
  const [claimSkipped, setClaimSkipped] = React.useState(false);
  const [treeBundle, setTreeBundle] = React.useState(null);
  const [roster, setRoster] = React.useState(null);
  const location = useLocation();

  const refreshDeterminations = React.useCallback(async () => {
    try {
      setDeterminations(await listDeterminations());
    } catch (err) {
      console.warn('listDeterminations() failed:', err);
    }
  }, []);

  const refreshTree = React.useCallback(async () => {
    try {
      setTreeBundle(await getTree());
    } catch (err) {
      console.warn('getTree() failed:', err);
    }
  }, []);

  const refreshRoster = React.useCallback(async () => {
    try {
      setRoster(await listProfilesWithPhotos());
    } catch (err) {
      console.warn('listProfilesWithPhotos() failed:', err);
    }
  }, []);

  // Initial session load + auth state subscription. Subscription matters for
  // OAuth: Google sign-in redirects away and back, and Supabase fires the
  // SIGNED_IN event on return.
  React.useEffect(() => {
    let cancelled = false;
    Auth.loadSession()
      .then((s) => {
        if (cancelled) return;
        setSession(s);
        setAuthReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Auth.loadSession() failed; starting unauthenticated.', err);
        setSession(null);
        setAuthReady(true);
      });
    const sub = Auth.onAuthStateChange((s, event) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      setSession(s);
      setAuthReady(true);
    });
    return () => { cancelled = true; sub.unsubscribe(); };
  }, []);

  // Load the official record once the user is signed in, and again whenever
  // they land on home or certificate views — that's how a freshly filed
  // determination propagates back without a manual reload. Effects key on
  // user_id, not session identity, so token-refresh events don't re-fire them.
  const userId = session?.user_id || null;
  React.useEffect(() => {
    if (!userId) return;
    refreshDeterminations();
  }, [userId, refreshDeterminations]);
  React.useEffect(() => {
    if (!userId) return;
    if (location.pathname !== '/' && !location.pathname.startsWith('/certificate')) return;
    refreshDeterminations();
  }, [location.pathname, userId, refreshDeterminations]);

  // Load the coaching tree once on sign-in, and again when navigating into any
  // /tree route — that lets the admin surface push fresh writes into the read
  // views without a manual reload.
  React.useEffect(() => {
    if (!userId) return;
    refreshTree();
  }, [userId, refreshTree]);
  React.useEffect(() => {
    if (!userId) return;
    if (!location.pathname.startsWith('/tree')) return;
    refreshTree();
  }, [location.pathname, userId, refreshTree]);

  // Roster (14-name member list with claim/photo/strava/achievement) is read
  // by IssueScreen, StatsScreen, and HybridProfileSheet. Hoisted here so each
  // screen reads from context instead of refetching on mount.
  React.useEffect(() => {
    if (!userId) return;
    refreshRoster();
  }, [userId, refreshRoster]);

  const onSignOut = React.useCallback(async () => {
    await Auth.signOut();
    setRecoveryMode(false);
    setClaimSkipped(false);
    setSession(null);
    setTreeBundle(null);
    setRoster(null);
  }, []);

  const onClaimed = React.useCallback((profile) => {
    setSession((prev) => (prev ? { ...prev, hybridProfile: profile } : prev));
    setClaimSkipped(false);
  }, []);

  const latestDetermination = determinations[0] || null;
  const isChampion = !!(
    session &&
    session.hybridProfile &&
    latestDetermination &&
    latestDetermination.winners.includes(session.hybridProfile)
  );
  const isAdmin = computeIsAdmin(session);

  const contextValue = {
    authReady,
    session,
    setSession,
    recoveryMode,
    setRecoveryMode,
    claimSkipped,
    setClaimSkipped,
    determinations,
    refreshDeterminations,
    latestDetermination,
    isChampion,
    isAdmin,
    treeBundle,
    refreshTree,
    roster,
    refreshRoster,
    onSignOut,
    onClaimed,
  };

  return (
    <AppProvider value={contextValue}>
      <Routes>
        {/* Standalone certificate (latest, no chrome). Outside AuthGate so a
            shared link works without prompting for sign-in first. */}
        <Route path="/certificate" element={<CertificateScreen />} />

        <Route element={<AuthGate><AppLayout /></AuthGate>}>
          <Route index element={<HomeScreen />} />
          <Route path="archive" element={<RecordScreen />} />
          <Route path="stats" element={<StatsScreen />} />
          <Route path="notice" element={<NoticeScreen />} />
          <Route path="admin/backfill" element={<AdminBackfill />} />
          <Route path="certificate/:number" element={<CertificateScreen />} />
          <Route path="tree" element={<TreeScreen />} />
          <Route path="tree/:slug" element={<LineageScreen />} />
          <Route element={<AdminRoute />}>
            <Route path="tree/admin" element={<RegistrarScreen />} />
            <Route path="tree/admin/distinctions/:id" element={<RegistrarScreen />} />
          </Route>
          <Route element={<ChampionRoute />}>
            <Route path="issue" element={<IssueScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

export default App;
