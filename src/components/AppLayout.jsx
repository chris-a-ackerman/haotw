// AppLayout.jsx — global chrome rendered around every chromed route:
// hamburger button, navigation drawer, AccountSheet. Reads session and champion
// status from AppContext. Standalone routes (e.g. /certificate latest) skip
// this layout entirely.

import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import AccountSheet from './AccountSheet.jsx';

const NAV_ITEMS_BASE = [
  { id: 'home',    path: '/',        label: 'Current Champion',     numeral: 'I'  },
  { id: 'archive', path: '/archive', label: 'Official Record',      numeral: 'II' },
  { id: 'stats',   path: '/stats',   label: 'Hybrids',               numeral: 'III'},
];
const NAV_ITEM_CROWN = { id: 'crown', path: '/issue',       label: 'Issue Determination',     numeral: 'IV' };
const NAV_ITEM_TREE  = { id: 'tree',  path: '/tree',        label: 'Coaching Tree',           numeral: 'V'  };
const NAV_ITEM_ADMIN = { id: 'admin', path: '/tree/admin',  label: 'Office of the Registrar', numeral: 'VI' };

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

function HamburgerDrawer({ open, onClose, isChampion, isAdmin, session, onSignOut, onOpenAccount }) {
  // Numeral order: I/II/III base, IV champion crown (conditional), V coaching
  // tree (always), VI registrar (conditional). Insert IV before V so the
  // numbering reads cleanly when both conditionals are present.
  const items = [
    ...NAV_ITEMS_BASE,
    ...(isChampion ? [NAV_ITEM_CROWN] : []),
    NAV_ITEM_TREE,
    ...(isAdmin ? [NAV_ITEM_ADMIN] : []),
  ];
  const navigate = useNavigate();
  const location = useLocation();

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
            const active = location.pathname === it.path ||
                          (it.path === '/' && location.pathname.startsWith('/certificate'));
            return (
              <li key={it.id} className="happs-drawer-row">
                <button
                  type="button"
                  className={'happs-drawer-item' + (active ? ' is-active' : '')}
                  onClick={() => {
                    navigate(it.path);
                    onClose();
                    requestAnimationFrame(() => window.scrollTo(0, 0));
                  }}
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

function AppLayout() {
  const { session, isChampion, isAdmin, onSignOut, setSession, onClaimed } = useAppContext();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);

  return (
    <>
      <Outlet />

      <HamburgerButton onOpen={() => setMenuOpen(true)} />

      <HamburgerDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isChampion={isChampion}
        isAdmin={isAdmin}
        session={session}
        onSignOut={onSignOut}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <AccountSheet
        open={accountOpen}
        session={session}
        onClose={() => setAccountOpen(false)}
        onSessionChange={(next) => setSession(next)}
        onClaim={(profile) => onClaimed(profile)}
      />
    </>
  );
}

export default AppLayout;
