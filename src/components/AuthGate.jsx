// AuthGate.jsx — pre-screen gates: auth loading, password recovery, sign-in,
// and hybrid-profile claim. Renders children once a session is established
// and either claimed or skipped.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import AuthScreen from './AuthScreen.jsx';
import ClaimScreen from './ClaimScreen.jsx';

function AuthGate({ children }) {
  const {
    authReady,
    session,
    setSession,
    recoveryMode,
    setRecoveryMode,
    claimSkipped,
    setClaimSkipped,
  } = useAppContext();
  const navigate = useNavigate();

  const onAuthed = React.useCallback((s) => {
    setRecoveryMode(false);
    setClaimSkipped(false);
    setSession(s);
    navigate('/');
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [navigate, setRecoveryMode, setClaimSkipped, setSession]);

  const onClaimed = React.useCallback((profile) => {
    setSession((prev) => (prev ? { ...prev, hybridProfile: profile } : prev));
    setClaimSkipped(false);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [setSession, setClaimSkipped]);

  const onSkipClaim = React.useCallback(() => {
    setClaimSkipped(true);
    navigate('/');
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [navigate, setClaimSkipped]);

  if (!authReady) {
    return <div className="haauth" aria-busy="true" />;
  }
  if (recoveryMode) {
    return <AuthScreen onAuthed={onAuthed} initialStep="reset" />;
  }
  if (!session) {
    return <AuthScreen onAuthed={onAuthed} />;
  }
  if (!session.hybridProfile && !claimSkipped) {
    return <ClaimScreen session={session} onClaimed={onClaimed} onSkip={onSkipClaim} />;
  }

  return children;
}

export default AuthGate;
