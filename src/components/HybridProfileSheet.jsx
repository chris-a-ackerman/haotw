// HybridProfileSheet.jsx — read-only right-side drawer that opens when a
// Stats leaderboard row is clicked. Mirrors AccountSheet's shell with its
// own class prefix (haprofile__) so the two drawers can co-exist without
// fighting over z-index or body-overflow restoration.
//
// Shows the clicked hybrid's portrait, name, strava handle, notable
// achievement, and every Determination they've won. Clicking a win fires
// the same payload flow as RecordScreen's "View & Share Certificate" CTA.

import React from 'react';
import { listProfilesWithPhotos } from '../lib/claims.js';

const ROMAN_NUMERALS = [
  '', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV',
  'XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV',
];

function toRoman(n) {
  if (n == null || n < 1) return '';
  if (n < ROMAN_NUMERALS.length) return ROMAN_NUMERALS[n];
  // Fallback for unexpectedly large numbers; matches the shape of the table.
  return String(n);
}

function stravaHandle(url) {
  try {
    const u = new URL(url);
    const tail = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop();
    return tail || u.hostname.replace(/^www\./, '');
  } catch {
    return 'Profile';
  }
}

function joinNames(winners) {
  if (!winners || winners.length === 0) return '';
  if (winners.length === 1) return winners[0];
  return winners.join(' · ');
}

function HybridProfileSheet({ open, hybridName, determinations, onClose, onViewCertificate }) {
  const [roster, setRoster] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    listProfilesWithPhotos()
      .then((rows) => { if (!cancelled) setRoster(rows); })
      .catch((err) => { console.warn('listProfilesWithPhotos failed', err); });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const profile = React.useMemo(() => {
    if (!hybridName || !roster) return null;
    return roster.find((p) => p.name === hybridName) || null;
  }, [hybridName, roster]);

  const wins = React.useMemo(() => {
    if (!hybridName || !determinations) return [];
    return determinations.filter((d) => (d.winners || []).includes(hybridName));
  }, [hybridName, determinations]);

  // Identify the profile as "claimed" by whether we found photo/strava/
  // achievement on the joined row. A hybrid in the roster with no claimant
  // returns the row with all three fields null.
  const isClaimed = !!(profile && (profile.photoUrl || profile.stravaUrl || profile.achievement));
  const initial = (hybridName || '·')[0].toUpperCase();

  return (
    <>
      <div
        className={'haprofile__scrim' + (open ? ' is-open' : '')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={'haprofile' + (open ? ' is-open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={hybridName ? `Hybrid profile: ${hybridName}` : 'Hybrid profile'}
        aria-hidden={!open}
      >
        <div className="haprofile__banner" aria-hidden="true" />

        <header className="haprofile__head">
          <span className="haprofile__office">Office of the Records · Hybrid</span>
          <button
            type="button"
            className="haprofile__close"
            onClick={onClose}
            aria-label="Close hybrid profile"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <hr className="haprofile__rule" />

        {hybridName && (
          <div className="haprofile__scroll">
            <div className="haprofile__hero">
              <span className="haprofile__hero-disc" aria-hidden="true">
                {profile && profile.photoUrl
                  ? <img src={profile.photoUrl} alt="" />
                  : <span>{initial}</span>}
              </span>
              <div className="haprofile__hero-meta">
                <span className="haprofile__hero-overline">Member of Record</span>
                <span className="haprofile__hero-name">{hybridName}</span>
                {isClaimed && profile && profile.achievement && (
                  <span className="haprofile__hero-achievement">{profile.achievement}</span>
                )}
                {isClaimed && profile && profile.stravaUrl && (
                  <a
                    className="haprofile__hero-strava"
                    href={profile.stravaUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Strava · {stravaHandle(profile.stravaUrl)}
                  </a>
                )}
                {!isClaimed && (
                  <span className="haprofile__hero-tag haprofile__hero-tag--unclaimed">
                    Hybrid Profile · Unclaimed
                  </span>
                )}
              </div>
            </div>

            <span className="haprofile__section-overline">
              Determinations on the Record
            </span>

            {wins.length === 0 ? (
              <p className="haprofile__empty">
                No determinations on the record for this hybrid.
              </p>
            ) : (
              <ol className="haprofile__wins">
                {wins.map((d) => {
                  const co = (d.winners || []).length > 1;
                  return (
                    <li key={d.determinationNumber} className="haprofile__wins-item">
                      <button
                        type="button"
                        className="haprofile__wins-row"
                        onClick={() => onViewCertificate(d)}
                      >
                        <span className="haprofile__wins-numeral">
                          {toRoman(d.determinationNumber)}
                        </span>
                        <span className="haprofile__wins-body">
                          <span className="haprofile__wins-head">
                            <span className="haprofile__wins-no">
                              No. {d.determinationNumber}
                            </span>
                            <span className="haprofile__wins-dot" aria-hidden="true">·</span>
                            <span className="haprofile__wins-date">{d.determinedOn}</span>
                            {co && (
                              <span className="haprofile__wins-co">Co-Determination</span>
                            )}
                          </span>
                          <span className="haprofile__wins-names">{joinNames(d.winners)}</span>
                        </span>
                        <span className="haprofile__wins-arrow" aria-hidden="true">→</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="haprofile__foot">
              <span>Filed by the Committee</span>
              <span>{wins.length} {wins.length === 1 ? 'determination' : 'determinations'}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default HybridProfileSheet;
