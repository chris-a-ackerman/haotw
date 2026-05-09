// ClaimScreen.jsx — post-signup "claim your Hybrid Profile" gate.
// Office of the Records, issuing your designation from a pre-seeded roster.

import React from 'react';
import * as Claims from '../lib/claims.js';
import { HYBRID_PROFILES } from '../lib/claims.js';

const ROMAN = [
  '', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV',
];

function ClaimMasthead({ folio }) {
  return (
    <>
      <header className="haclaim__masthead">
        <div className="haclaim__wordmark">
          <span className="haclaim__wordmark-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10.25" stroke="#1A1A1A" strokeWidth="0.75"/>
              <circle cx="11" cy="11" r="7.75"  stroke="#1A1A1A" strokeWidth="0.5"/>
              <text x="11" y="14.2" textAnchor="middle"
                    fontFamily='"Bodoni Moda", Didot, serif'
                    fontWeight="700" fontSize="9" fill="#003DA5"
                    letterSpacing="-0.02em">H</text>
            </svg>
          </span>
          <span className="haclaim__wordmark-text">Hybrid Athletes</span>
        </div>
        <span className="haclaim__folio">{folio}</span>
      </header>
      <hr className="haclaim__hairline" />
    </>
  );
}

function RecordCard({ name, ordinal }) {
  return (
    <div className="haclaim__record">
      <div className="haclaim__record-ribbon" aria-hidden="true">
        <span>Hybrid Athletes</span>
        <span className="haclaim__record-ribbon-dot" />
        <span>Record No. {ordinal || '—'}</span>
      </div>

      <div className="haclaim__record-frame">
        <span className="haclaim__record-corner haclaim__record-corner--tl" aria-hidden="true" />
        <span className="haclaim__record-corner haclaim__record-corner--tr" aria-hidden="true" />
        <span className="haclaim__record-corner haclaim__record-corner--bl" aria-hidden="true" />
        <span className="haclaim__record-corner haclaim__record-corner--br" aria-hidden="true" />

        <span className="haclaim__record-overline">This certifies that</span>
        <h2 className="haclaim__record-name">{name}</h2>
        <span className="haclaim__record-rule" aria-hidden="true" />
        <span className="haclaim__record-sub">
          is a member in good standing of the Hybrid Athletes,
          eligible for nomination, citation, and weekly determination.
        </span>

        <div className="haclaim__record-seal" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="29.5" fill="none" stroke="#003DA5" strokeWidth="1"/>
            <circle cx="32" cy="32" r="24"   fill="none" stroke="#003DA5" strokeWidth="0.5"/>
            <circle cx="32" cy="32" r="17"   fill="#FFDB00"/>
            <text x="32" y="36" textAnchor="middle"
                  fontFamily='"Bodoni Moda", Didot, serif'
                  fontWeight="800" fontSize="16" fill="#003DA5"
                  letterSpacing="-0.02em">H</text>
            {Array.from({ length: 36 }).map((_, i) => {
              const a = (i / 36) * Math.PI * 2;
              const x1 = 32 + Math.cos(a) * 26;
              const y1 = 32 + Math.sin(a) * 26;
              const x2 = 32 + Math.cos(a) * 28;
              const y2 = 32 + Math.sin(a) * 28;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                           stroke="#003DA5" strokeWidth="0.6" />;
            })}
          </svg>
        </div>
      </div>

      <div className="haclaim__record-footnote">
        <span>Per the Committee</span>
        <span>Unclaimed · Awaiting Designation</span>
      </div>
    </div>
  );
}

function MatchPanel({ candidate, candidateOrdinal, onConfirm, onBrowse, busy }) {
  return (
    <main className="haclaim__main">
      <span className="haclaim__overline haclaim__rise">Possible Match Located</span>
      <h1 className="haclaim__title haclaim__rise" style={{ animationDelay: '60ms' }}>
        The Committee has identified a potential record match.
      </h1>
      <p className="haclaim__lede haclaim__rise" style={{ animationDelay: '140ms' }}>
        Our roster lists an unclaimed designation under a name closely
        resembling yours. Confirm below to take it onto your record.
      </p>

      <div className="haclaim__rise" style={{ animationDelay: '220ms' }}>
        <RecordCard name={candidate} ordinal={candidateOrdinal} />
      </div>

      <button
        type="button"
        className="haclaim__submit"
        onClick={onConfirm}
        disabled={busy}
      >
        <span>{busy ? 'Filing…' : 'Claim This Record'}</span>
        <span className="haclaim__submit-arrow" aria-hidden="true">→</span>
      </button>

      <button
        type="button"
        className="haclaim__ghost"
        onClick={onBrowse}
        disabled={busy}
      >
        Not me — view the full roster
      </button>

      <p className="haclaim__fineprint">
        A designation, once filed, may only be amended by petition
        in writing to the Office of the Records.
      </p>
    </main>
  );
}

function BrowsePanel({
  unclaimedList, selected, onSelect, onConfirm, onBack, busy, hasMatch,
}) {
  const [q, setQ] = React.useState('');
  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return unclaimedList;
    return unclaimedList.filter((p) => p.toLowerCase().includes(needle));
  }, [q, unclaimedList]);

  return (
    <main className="haclaim__main haclaim__main--list">
      {hasMatch && (
        <button type="button" className="haclaim__back" onClick={onBack}>
          <span className="haclaim__back-arrow" aria-hidden="true">←</span>
          <span>Return to suggested match</span>
        </button>
      )}

      <span className="haclaim__overline haclaim__rise">Official Roster</span>
      <h1 className="haclaim__title haclaim__rise" style={{ animationDelay: '60ms' }}>
        Select your designation from the official roster.
      </h1>
      <p className="haclaim__lede haclaim__rise" style={{ animationDelay: '140ms' }}>
        The following names have been entered into the record but
        remain unclaimed. Locate yours and submit for designation.
      </p>

      <div className="haclaim__search haclaim__rise" style={{ animationDelay: '200ms' }}>
        <span className="haclaim__search-mark" aria-hidden="true">⌕</span>
        <input
          type="text"
          className="haclaim__search-input"
          placeholder="Search the roster…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button type="button"
                  className="haclaim__search-clear"
                  onClick={() => setQ('')}
                  aria-label="Clear search">×</button>
        )}
      </div>

      <div className="haclaim__roster-meta">
        <span>Page I of I</span>
        <span>{filtered.length} of {unclaimedList.length} unclaimed</span>
      </div>

      <ul className="haclaim__roster">
        {filtered.length === 0 && (
          <li className="haclaim__roster-empty">
            No designations match that query.
          </li>
        )}
        {filtered.map((p) => {
          const ord = ROMAN[HYBRID_PROFILES.indexOf(p) + 1] || '·';
          const active = p === selected;
          return (
            <li key={p}>
              <button
                type="button"
                className={'haclaim__roster-row' + (active ? ' is-active' : '')}
                onClick={() => onSelect(p)}
              >
                <span className="haclaim__roster-numeral">{ord}</span>
                <span className="haclaim__roster-name">{p}</span>
                <span className="haclaim__roster-status" aria-hidden="true">
                  {active ? '◼' : '○'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="haclaim__sticky">
        <div className="haclaim__sticky-meta">
          {selected
            ? <>
                <span className="haclaim__sticky-overline">Designation Selected</span>
                <span className="haclaim__sticky-name">{selected}</span>
              </>
            : <>
                <span className="haclaim__sticky-overline">No Selection</span>
                <span className="haclaim__sticky-name haclaim__sticky-name--muted">
                  Tap a name above
                </span>
              </>}
        </div>
        <button
          type="button"
          className="haclaim__submit haclaim__submit--compact"
          onClick={onConfirm}
          disabled={!selected || busy}
        >
          <span>{busy ? 'Filing…' : 'Confirm Designation'}</span>
          <span className="haclaim__submit-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}

function ConfirmedPanel({ name }) {
  return (
    <main className="haclaim__main haclaim__main--center">
      <div className="haclaim__confirmed">
        <span className="haclaim__confirmed-stamp" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="56" fill="none" stroke="#003DA5" strokeWidth="2"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="#003DA5" strokeWidth="0.75"/>
            <text x="60" y="56" textAnchor="middle"
                  fontFamily='"Archivo", sans-serif'
                  fontWeight="800" fontSize="9" fill="#003DA5"
                  letterSpacing="2.4">FILED</text>
            <text x="60" y="72" textAnchor="middle"
                  fontFamily='"Archivo", sans-serif'
                  fontWeight="800" fontSize="9" fill="#003DA5"
                  letterSpacing="2.4">{new Date().getFullYear()}</text>
            <line x1="20" y1="60" x2="36" y2="60" stroke="#003DA5" strokeWidth="0.5"/>
            <line x1="84" y1="60" x2="100" y2="60" stroke="#003DA5" strokeWidth="0.5"/>
          </svg>
        </span>
        <span className="haclaim__overline" style={{ marginTop: 12 }}>
          Designation Filed
        </span>
        <h1 className="haclaim__title" style={{ marginTop: 8 }}>
          Identity confirmed.
        </h1>
        <p className="haclaim__lede" style={{ marginTop: 12 }}>
          Welcome to the record, <em>{name}</em>.
        </p>
        <span className="haclaim__confirmed-spinner" aria-hidden="true" />
      </div>
    </main>
  );
}

function ClaimScreen({ session, onClaimed }) {
  const [unclaimedList, setUnclaimed] = React.useState([]);
  const [suggested, setSuggested] = React.useState(null);
  const [step, setStep] = React.useState('match');
  const [selected, setSelected] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [claimedName, setClaimedName] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    Claims.unclaimed().then((list) => {
      if (cancelled) return;
      setUnclaimed(list);
      const m = Claims.match(session && session.name, list);
      setSuggested(m);
      setStep(m ? 'match' : 'browse');
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [session && session.name]);

  const suggestedOrdinal = suggested
    ? (ROMAN[HYBRID_PROFILES.indexOf(suggested) + 1] || '—')
    : null;

  const folio = step === 'match'
    ? 'Profile Designation'
    : step === 'browse'
    ? 'Official Roster'
    : 'Designation Filed';

  const fileClaim = async (profile) => {
    if (!profile || busy) return;
    setBusy(true);
    const r = await Claims.claim(profile, session.email);
    if (!r.ok) {
      setBusy(false);
      console.warn('claim failed', r.error);
      return;
    }
    setClaimedName(profile);
    setStep('confirmed');
    setTimeout(() => {
      setBusy(false);
      onClaimed(profile);
    }, 1700);
  };

  return (
    <div className="haclaim">
      <ClaimMasthead folio={folio} />

      {!loaded && <main className="haclaim__main" />}

      {loaded && step === 'match' && (
        <MatchPanel
          candidate={suggested}
          candidateOrdinal={suggestedOrdinal}
          busy={busy}
          onConfirm={() => fileClaim(suggested)}
          onBrowse={() => { setSelected(null); setStep('browse'); }}
        />
      )}

      {loaded && step === 'browse' && (
        <BrowsePanel
          unclaimedList={unclaimedList}
          selected={selected}
          hasMatch={!!suggested}
          busy={busy}
          onSelect={setSelected}
          onConfirm={() => fileClaim(selected)}
          onBack={() => setStep('match')}
        />
      )}

      {step === 'confirmed' && (
        <ConfirmedPanel name={claimedName} />
      )}

      <div className="haclaim__colophon">
        <span>Office of the Records</span>
        <span>By Designation Only</span>
      </div>
    </div>
  );
}

export default ClaimScreen;
