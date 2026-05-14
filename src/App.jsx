// App.jsx — wires every screen into a single cohesive app with shared state,
// hamburger nav, and link interception. Intra-app anchors (href="*.html") are
// translated to view changes by a single document-level delegate, so each
// screen keeps the friendly anchor markup it was originally drawn with.

import React from 'react';
import * as Auth from './lib/auth.js';
import { listDeterminations } from './lib/records.js';
import HomeScreen from './components/HomeScreen.jsx';
import RecordScreen from './components/RecordScreen.jsx';
import StatsScreen from './components/StatsScreen.jsx';
import IssueScreen from './components/IssueScreen.jsx';
import NoticeScreen from './components/NoticeScreen.jsx';
import ClaimScreen from './components/ClaimScreen.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import AccountSheet from './components/AccountSheet.jsx';
import { CertificateShare } from './components/Certificate.jsx';
import AdminBackfill from './components/AdminBackfill.jsx';

const HREF_TO_VIEW = {
  'index.html':       'home',
  'record.html':      'archive',
  'stats.html':       'stats',
  'issue.html':       'crown',
  'certificate.html': 'certificate',
  'notice.html':      'notice',
  'admin-backfill.html': 'admin-backfill',
};

const NAV_ITEMS_BASE = [
  { id: 'home',    label: 'Current Champion',     numeral: 'I'  },
  { id: 'archive', label: 'Official Record',      numeral: 'II' },
  { id: 'stats',   label: 'Hybrids',               numeral: 'III'},
];
const NAV_ITEM_CROWN = { id: 'crown', label: 'Issue Determination', numeral: 'IV' };

function HamburgerButton({ onOpen }) {
  return (
    <button
      type="button"
      className="happs-hamburger"
      onClick={onOpen}
      aria-label="Open menu"
    >
      <span className="happs-hamburger-tick" aria-hidden="true">§</span>
      <span className="happs-hamburger-rules" aria-hidden="true">
        <span /><span /><span />
      </span>
    </button>
  );
}

function HamburgerDrawer({ open, onClose, currentView, onNavigate, isChampion, session, onSignOut, onOpenAccount }) {
  const items = isChampion ? [...NAV_ITEMS_BASE, NAV_ITEM_CROWN] : NAV_ITEMS_BASE;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={'happs-scrim' + (open ? ' is-open' : '')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={'happs-drawer' + (open ? ' is-open' : '')}
        aria-hidden={!open}
        role="dialog"
        aria-label="Menu"
      >
        <div className="happs-drawer-banner" aria-hidden="true" />
        <div className="happs-drawer-head">
          <span className="happs-drawer-office">Office of the Committee</span>
          <button
            type="button"
            className="happs-drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <hr className="happs-drawer-rule" />
        <div className="happs-drawer-overline">Index of Sections</div>
        <ul className="happs-drawer-list">
          {items.map((it) => {
            const active = currentView === it.id ||
                          (it.id === 'home' && currentView === 'award-detail');
            return (
              <li key={it.id} className="happs-drawer-row">
                <button
                  type="button"
                  className={'happs-drawer-item' + (active ? ' is-active' : '')}
                  onClick={() => { onNavigate(it.id); onClose(); }}
                >
                  <span className="happs-drawer-numeral">{it.numeral}</span>
                  <span className="happs-drawer-label">{it.label}</span>
                  <span className="happs-drawer-arrow" aria-hidden="true">
                    {active ? '■' : '→'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {session && (
          <div className="happs-drawer-account">
            <button
              type="button"
              className="happs-drawer-account-row"
              onClick={() => { onOpenAccount(); onClose(); }}
              aria-label="Open account particulars"
            >
              <span className="happs-drawer-account-disc" aria-hidden="true">
                {session.photo
                  ? <img src={session.photo} alt="" />
                  : (session.name || session.email || '·')[0].toUpperCase()}
              </span>
              <span className="happs-drawer-account-meta">
                <span className="happs-drawer-account-name">{session.name || 'Member'}</span>
                <span className="happs-drawer-account-email">{session.email}</span>
                <span className="happs-drawer-account-hint">
                  {session.hybridProfile
                    ? <>Edit particulars <span aria-hidden="true">→</span></>
                    : <>Edit · Claim Hybrid Profile <span aria-hidden="true">→</span></>}
                </span>
              </span>
              <span className="happs-drawer-account-arrow" aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="happs-drawer-signout"
              onClick={() => { onSignOut(); onClose(); }}
            >
              Sign out
            </button>
          </div>
        )}
        <div className="happs-drawer-foot">
          <span>The Committee</span>
          <span>May 8</span>
        </div>
      </aside>
    </>
  );
}

function ExitConfirmModal({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="haissue__modal-scrim" role="dialog" aria-modal="true">
      <div className="haissue__modal" role="document">
        <div className="haissue__modal-stamp">Confirm Exit</div>
        <div className="haissue__modal-title">Exit?</div>
        <p className="haissue__modal-body">
          Your progress on this Determination will not be retained.
          The recipient, speech, and drafted certificate language will be
          discarded.
        </p>
        <p className="haissue__modal-body haissue__modal-body--quiet">
          Proceed?
        </p>
        <div className="haissue__modal-actions">
          <button
            type="button"
            className="haissue__btn haissue__btn--ghost"
            onClick={onCancel}
          >
            Continue Drafting
          </button>
          <button
            type="button"
            className="haissue__btn haissue__btn--primary"
            onClick={onConfirm}
          >
            Exit Without Filing
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  // A new tab opened with ?view=certificate boots straight into the standalone
  // certificate view. `standalone` then sticks for the life of the tab so the
  // chrome (hamburger, Return link) stays hidden even if the user navigates.
  const initialView = React.useMemo(() => {
    if (typeof window === 'undefined') return 'home';
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'certificate' ? 'certificate' : 'home';
  }, []);
  const [view, setView] = React.useState(initialView);
  const [standalone] = React.useState(initialView === 'certificate');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [exitConfirm, setExitConfirm] = React.useState(false);
  const [authReady, setAuthReady] = React.useState(false);
  const [session, setSession] = React.useState(null);
  const [recoveryMode, setRecoveryMode] = React.useState(false);
  const [certPayload, setCertPayload] = React.useState(null);
  const [determinations, setDeterminations] = React.useState([]);
  // Lets a signed-in user without a hybrid_profile claim still reach the rest
  // of the app — used either when ClaimScreen's roster fetch fails or when
  // the user simply wants to defer. Resets on sign-in / sign-out so they're
  // nudged to claim each fresh session.
  const [claimSkipped, setClaimSkipped] = React.useState(false);

  const refreshDeterminations = React.useCallback(async () => {
    try {
      setDeterminations(await listDeterminations());
    } catch (err) {
      console.warn('listDeterminations() failed:', err);
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
        console.error('Auth.loadSession() failed:', err);
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

  const onAuthed = React.useCallback((s) => {
    setRecoveryMode(false);
    setClaimSkipped(false);
    setSession(s);
    setView('home');
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  const onClaimed = React.useCallback((profile) => {
    setSession((prev) => prev ? { ...prev, hybridProfile: profile } : prev);
    setClaimSkipped(false);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  const onSkipClaim = React.useCallback(() => {
    setClaimSkipped(true);
    setView('home');
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  const onSignOut = React.useCallback(async () => {
    await Auth.signOut();
    setRecoveryMode(false);
    setClaimSkipped(false);
    setSession(null);
  }, []);

  // Load the official record once the user is signed in, and again whenever
  // they land on the home view — that's how a freshly filed determination
  // propagates back to the masthead without a manual reload.
  React.useEffect(() => {
    if (!session) return;
    refreshDeterminations();
  }, [session, refreshDeterminations]);
  React.useEffect(() => {
    if (!session) return;
    if (view !== 'home' && view !== 'certificate') return;
    refreshDeterminations();
  }, [view, session, refreshDeterminations]);

  const latestDetermination = determinations[0] || null;
  const isChampion = !!(
    session &&
    session.hybridProfile &&
    latestDetermination &&
    latestDetermination.winners.includes(session.hybridProfile)
  );

  const navigate = React.useCallback((next) => {
    setView(next);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  React.useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const href = a.getAttribute('href');
      if (!href) return;
      const clean = href.replace(/^\.\//, '').split('?')[0].split('#')[0];
      const target = HREF_TO_VIEW[clean];
      if (!target) return;
      e.preventDefault();
      if (target === 'crown' && !isChampion) return;
      navigate(target);
      setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [isChampion, navigate]);

  // Auth gate
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

  // Render
  let screen = null;
  if (view === 'home')         screen = <HomeScreen isChampion={isChampion} determination={latestDetermination} determinationNo={determinations.length} />;
  else if (view === 'archive') screen = (
    <RecordScreen
      onViewCertificate={(entry) => {
        const folioLabel = `No. ${entry.determinationNumber} · ${entry.determinedOn}`;
        setCertPayload({
          data: {
            org:        'Hybrid Athletes',
            title:      entry.winners.length > 1 ? 'Hybrid Athletes of the Week' : 'Hybrid Athlete of the Week',
            weekLabel:  folioLabel,
            determinationNumber: entry.determinationNumber,
            recipients: entry.winners,
            body:       entry.citation,
            determinedBy: entry.determiner,
            est:        'Est. 2023',
          },
          speech: entry.speech,
        });
        navigate('certificate');
      }}
    />
  );
  else if (view === 'stats')   screen = <StatsScreen />;
  else if (view === 'crown')   screen = <IssueScreen issuer={session} />;
  else if (view === 'certificate' && standalone) {
    if (!latestDetermination) {
      screen = (
        <div className="hahome">
          <main className="hahome__main">
            <div className="hahome__inre">Awaiting first Determination</div>
          </main>
        </div>
      );
    } else {
      const standaloneCert = {
        org:        'Hybrid Athletes',
        title:      latestDetermination.winners.length > 1 ? 'Hybrid Athletes of the Week' : 'Hybrid Athlete of the Week',
        weekLabel:  `No. ${latestDetermination.determinationNumber} · ${latestDetermination.determinedOn}`,
        determinationNumber: latestDetermination.determinationNumber,
        recipients: latestDetermination.winners,
        body:       latestDetermination.citation,
        determinedBy: latestDetermination.determiner,
        est:        'Est. 2023',
      };
      screen = (
        <div className="hahome">
          <header className="hahome__masthead">
            <div className="hahome__wordmark">
              <span className="hahome__wordmark-text">Hybrid Athletes</span>
            </div>
            <hr className="hahome__rule hahome__rule--top" />
          </header>
          <main className="hahome__main">
            <CertificateShare
              data={standaloneCert}
              speech={latestDetermination.speech || undefined}
            />
          </main>
        </div>
      );
    }
  }
  else if (view === 'certificate') {
    screen = (
      <div className="hahome">
        <header className="hahome__masthead">
          <div className="hahome__wordmark">
            <span className="hahome__wordmark-text">Hybrid Athletes</span>
          </div>
          <hr className="hahome__rule hahome__rule--top" />
          <div className="hahome__folio" style={{ paddingTop: 6 }}>
            <a href={certPayload ? "record.html" : "index.html"} className="haissue__back">
              <span className="haissue__back-arrow" aria-hidden="true">←</span>
              <span>Return</span>
            </a>
            <span className="hahome__folio-c">Determination · Issued</span>
            <span>No. CXLVII</span>
          </div>
        </header>
        <main className="hahome__main">
          <CertificateShare
            data={certPayload ? certPayload.data : undefined}
            speech={certPayload ? certPayload.speech : undefined}
          />
        </main>
      </div>
    );
  }
  else if (view === 'notice')  screen = <NoticeScreen isChampion={isChampion} />;
  else if (view === 'admin-backfill') screen = <AdminBackfill session={session} />;

  return (
    <>
      {screen}

      {!standalone && (
        <>
          <HamburgerButton onOpen={() => setMenuOpen(true)} />

          <HamburgerDrawer
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            currentView={view}
            isChampion={isChampion}
            onNavigate={navigate}
            session={session}
            onSignOut={onSignOut}
            onOpenAccount={() => setAccountOpen(true)}
          />
        </>
      )}

      <AccountSheet
        open={accountOpen}
        session={session}
        onClose={() => setAccountOpen(false)}
        onSessionChange={(next) => setSession(next)}
        onClaim={(profile) => onClaimed(profile)}
      />

      <ExitConfirmModal
        open={exitConfirm}
        onCancel={() => setExitConfirm(false)}
        onConfirm={() => { setExitConfirm(false); navigate('home'); }}
      />
    </>
  );
}

export default App;
