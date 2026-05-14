// AccountSheet.jsx — modal opened from the hamburger drawer's profile row.
// Lets the member amend particulars, manage portrait, and claim a Hybrid
// Profile if not yet claimed.

import React from 'react';
import * as Auth from '../lib/auth.js';
import * as Claims from '../lib/claims.js';
import { HYBRID_PROFILES } from '../lib/claims.js';

const ROMAN_NUMERALS = [
  '', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV',
];

function isValidUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
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

function ParticularsPanel({ session, onUpdated }) {
  const [name, setName]               = React.useState(session.name || '');
  const [email, setEmail]             = React.useState(session.email || '');
  const [stravaUrl, setStravaUrl]     = React.useState(session.stravaUrl || '');
  const [achievement, setAchievement] = React.useState(session.achievement || '');
  const [currentPassword, setCurrent] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [error, setError]             = React.useState(null);
  const [filed, setFiled]             = React.useState(null);
  const [busy, setBusy]               = React.useState(false);

  React.useEffect(() => {
    setName(session.name || '');
    setEmail(session.email || '');
    setStravaUrl(session.stravaUrl || '');
    setAchievement(session.achievement || '');
  }, [session.name, session.email, session.stravaUrl, session.achievement]);

  const dirty =
    (name || '').trim()        !== (session.name        || '').trim() ||
    (email || '').trim()       !== (session.email       || '').trim() ||
    (stravaUrl || '').trim()   !== (session.stravaUrl   || '').trim() ||
    (achievement || '').trim() !== (session.achievement || '').trim() ||
    !!newPassword;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setFiled(null);
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('New passphrase must be at least 6 characters.');
      return;
    }
    const strava = stravaUrl.trim();
    if (strava && !isValidUrl(strava)) {
      setError('Strava link must be a full URL.');
      return;
    }
    if (!currentPassword) {
      setError('Confirm your current passphrase to file changes.');
      return;
    }
    setBusy(true);
    const r = await Auth.updateUser({
      oldEmail: session.email,
      name: name.trim(),
      email: email.trim(),
      password: newPassword || undefined,
      currentPassword,
      stravaUrl: strava,
      achievement: achievement.trim(),
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    if (email.trim() !== session.email) {
      Claims.transferEmail(session.email, email.trim());
    }
    onUpdated(r.session);
    setCurrent('');
    setNewPassword('');
    setFiled('Particulars amended on the record.');
  };

  return (
    <form className="haaccount__form" onSubmit={submit} noValidate>
      <span className="haaccount__section-overline">§ I · Particulars on file</span>

      <div className="haaccount__field">
        <label className="haaccount__label" htmlFor="acct-name">
          <span>Name in Full</span>
        </label>
        <input
          id="acct-name"
          type="text"
          autoComplete="name"
          className="haaccount__input"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null); setFiled(null); }}
        />
      </div>

      <div className="haaccount__field">
        <label className="haaccount__label" htmlFor="acct-email">
          <span>Email of Record</span>
        </label>
        <input
          id="acct-email"
          type="email"
          autoComplete="email"
          className={'haaccount__input' + (error && /email/i.test(error) ? ' is-error' : '')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); setFiled(null); }}
        />
      </div>

      <div className="haaccount__field">
        <label className="haaccount__label" htmlFor="acct-strava">
          <span>Strava Particulars</span>
          <span className="haaccount__label-hint">optional</span>
        </label>
        <input
          id="acct-strava"
          type="url"
          inputMode="url"
          autoComplete="url"
          className={'haaccount__input' + (error && /strava/i.test(error) ? ' is-error' : '')}
          value={stravaUrl}
          onChange={(e) => { setStravaUrl(e.target.value); setError(null); setFiled(null); }}
          placeholder="https://www.strava.com/athletes/…"
        />
      </div>

      <div className="haaccount__field">
        <label className="haaccount__label" htmlFor="acct-achievement">
          <span>Achievement of Note</span>
          <span className="haaccount__label-hint">optional</span>
        </label>
        <input
          id="acct-achievement"
          type="text"
          maxLength={140}
          className="haaccount__input"
          value={achievement}
          onChange={(e) => { setAchievement(e.target.value); setError(null); setFiled(null); }}
          placeholder="Boston Marathon, sub-3 hours"
        />
      </div>

      <div className="haaccount__field">
        <label className="haaccount__label" htmlFor="acct-newpass">
          <span>New Passphrase</span>
          <span className="haaccount__label-hint">leave blank to keep current</span>
        </label>
        <input
          id="acct-newpass"
          type="password"
          autoComplete="new-password"
          className="haaccount__input"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(null); setFiled(null); }}
          placeholder="••••••••"
        />
      </div>

      <div className="haaccount__field">
        <label className="haaccount__label" htmlFor="acct-curpass">
          <span>Current Passphrase</span>
          <span className="haaccount__label-hint">required to file changes</span>
        </label>
        <input
          id="acct-curpass"
          type="password"
          autoComplete="current-password"
          className={'haaccount__input' + (error && /passphrase/i.test(error) ? ' is-error' : '')}
          value={currentPassword}
          onChange={(e) => { setCurrent(e.target.value); setError(null); setFiled(null); }}
          placeholder="••••••••"
        />
      </div>

      {error && <span className="haaccount__error">{error}</span>}
      {filed && <span className="haaccount__filed">{filed}</span>}

      <button
        type="submit"
        className="haaccount__submit"
        disabled={!dirty || busy}
      >
        <span>{busy ? 'Filing…' : 'File Amendments'}</span>
        <span className="haaccount__submit-arrow" aria-hidden="true">→</span>
      </button>
    </form>
  );
}

function ClaimPanel({ session, onClaimed }) {
  const profile = session.hybridProfile;

  if (profile) {
    const ord = ROMAN_NUMERALS[HYBRID_PROFILES.indexOf(profile) + 1] || '·';
    return (
      <div className="haaccount__claim-filed">
        <span className="haaccount__section-overline">§ II · Hybrid Profile</span>
        <div className="haaccount__claim-row">
          <span className="haaccount__claim-numeral">{ord}</span>
          <span className="haaccount__claim-name">{profile}</span>
          <span className="haaccount__claim-status">Claimed · Filed</span>
        </div>
        <p className="haaccount__claim-note">
          A designation, once filed, may only be amended by petition
          in writing to the Office of the Records.
        </p>
      </div>
    );
  }

  const [unclaimedList, setUnclaimed] = React.useState([]);
  const [suggested, setSuggested] = React.useState(null);
  const [q, setQ] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    Claims.unclaimed().then((list) => {
      if (cancelled) return;
      setUnclaimed(list);
      const m = Claims.match(session.name, list);
      setSuggested(m);
      setSelected(m || null);
    });
    return () => { cancelled = true; };
  }, [session.name]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return unclaimedList;
    return unclaimedList.filter((p) => p.toLowerCase().includes(needle));
  }, [q, unclaimedList]);

  const fileClaim = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const r = await Claims.claim(selected, session.email);
    if (!r.ok) {
      setBusy(false);
      console.warn('claim failed', r.error);
      return;
    }
    setTimeout(() => {
      onClaimed(selected);
      setBusy(false);
    }, 320);
  };

  return (
    <div className="haaccount__claim">
      <span className="haaccount__section-overline">§ II · Hybrid Profile</span>
      <p className="haaccount__claim-lede">
        You have not yet claimed a designation from the official roster.
        Locate yours below and file the claim onto your record.
      </p>

      {suggested && (
        <div className="haaccount__claim-suggest">
          <span className="haaccount__claim-suggest-l">
            Suggested match
          </span>
          <span className="haaccount__claim-suggest-r">
            {suggested}
          </span>
        </div>
      )}

      <div className="haaccount__search">
        <span className="haaccount__search-mark" aria-hidden="true">⌕</span>
        <input
          type="text"
          className="haaccount__search-input"
          placeholder="Search the roster…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button type="button"
                  className="haaccount__search-clear"
                  onClick={() => setQ('')}
                  aria-label="Clear search">×</button>
        )}
      </div>

      <ul className="haaccount__roster">
        {filtered.length === 0 && (
          <li className="haaccount__roster-empty">
            No designations match that query.
          </li>
        )}
        {filtered.map((p) => {
          const ord = ROMAN_NUMERALS[HYBRID_PROFILES.indexOf(p) + 1] || '·';
          const active = p === selected;
          return (
            <li key={p}>
              <button
                type="button"
                className={'haaccount__roster-row' + (active ? ' is-active' : '')}
                onClick={() => setSelected(p)}
              >
                <span className="haaccount__roster-numeral">{ord}</span>
                <span className="haaccount__roster-name">{p}</span>
                <span className="haaccount__roster-status" aria-hidden="true">
                  {active ? '◼' : '○'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="haaccount__submit"
        onClick={fileClaim}
        disabled={!selected || busy}
      >
        <span>{busy ? 'Filing…' : 'Claim Designation'}</span>
        <span className="haaccount__submit-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function PortraitControl({ session, onUpdated }) {
  const fileRef = React.useRef(null);
  const [error, setError] = React.useState(null);
  const [filed, setFiled] = React.useState(false);
  const initial = (session.name || session.email || '·')[0].toUpperCase();

  React.useEffect(() => {
    if (!filed) return;
    const t = setTimeout(() => setFiled(false), 1800);
    return () => clearTimeout(t);
  }, [filed]);

  const onPick = () => {
    setError(null);
    if (fileRef.current) fileRef.current.click();
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      setError('Portrait must be an image file.');
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError('Portrait must be under 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError('Could not read that file.');
    reader.onload = async () => {
      const r = await Auth.updatePhoto({
        email: session.email,
        photo: reader.result,
      });
      if (!r.ok) { setError(r.error || 'Could not file portrait.'); return; }
      onUpdated(r.session);
      setFiled(true);
    };
    reader.readAsDataURL(f);
  };

  const strike = async () => {
    setError(null);
    const r = await Auth.updatePhoto({ email: session.email, photo: null });
    if (!r.ok) { setError(r.error || 'Could not strike portrait.'); return; }
    onUpdated(r.session);
    setFiled(true);
  };

  return (
    <div className="haaccount__portrait">
      <button
        type="button"
        className="haaccount__hero-disc haaccount__hero-disc--button"
        onClick={onPick}
        aria-label={session.photo ? 'Replace portrait' : 'Affix portrait'}
      >
        {session.photo
          ? <img src={session.photo} alt="" />
          : <span aria-hidden="true">{initial}</span>}
        <span className="haaccount__portrait-overlay" aria-hidden="true">
          <span className="haaccount__portrait-overlay-mark">⎙</span>
          <span className="haaccount__portrait-overlay-text">
            {session.photo ? 'Replace' : 'Affix'}
          </span>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="haaccount__portrait-file"
        onChange={onFile}
      />
      <div className="haaccount__portrait-actions">
        <button
          type="button"
          className="haaccount__portrait-link"
          onClick={onPick}
        >
          {session.photo ? 'Replace portrait' : 'Affix portrait'}
        </button>
        {session.photo && (
          <>
            <span className="haaccount__portrait-sep" aria-hidden="true">·</span>
            <button
              type="button"
              className="haaccount__portrait-link haaccount__portrait-link--strike"
              onClick={strike}
            >
              Strike from record
            </button>
          </>
        )}
        {error && <span className="haaccount__portrait-error">{error}</span>}
        {filed && !error && (
          <span className="haaccount__portrait-filed">Portrait filed.</span>
        )}
      </div>
    </div>
  );
}

function AccountSheet({ open, session, onClose, onSessionChange, onClaim }) {
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

  if (!session) return null;

  return (
    <>
      <div
        className={'haaccount__scrim' + (open ? ' is-open' : '')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={'haaccount' + (open ? ' is-open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        aria-hidden={!open}
      >
        <div className="haaccount__banner" aria-hidden="true" />

        <header className="haaccount__head">
          <span className="haaccount__office">Office of the Records · Account</span>
          <button
            type="button"
            className="haaccount__close"
            onClick={onClose}
            aria-label="Close account"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <hr className="haaccount__rule" />

        <div className="haaccount__scroll">
          <div className="haaccount__hero">
            <PortraitControl
              session={session}
              onUpdated={onSessionChange}
            />
            <div className="haaccount__hero-meta">
              <span className="haaccount__hero-overline">Member of Record</span>
              <span className="haaccount__hero-name">{session.name || 'Unnamed Member'}</span>
              <span className="haaccount__hero-email">{session.email}</span>
              {session.achievement && (
                <span className="haaccount__hero-achievement">{session.achievement}</span>
              )}
              {session.stravaUrl && (
                <a
                  className="haaccount__hero-strava"
                  href={session.stravaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Strava · {stravaHandle(session.stravaUrl)}
                </a>
              )}
              {session.hybridProfile && (
                <span className="haaccount__hero-tag">
                  Hybrid Profile · <em>{session.hybridProfile}</em>
                </span>
              )}
              {!session.hybridProfile && (
                <span className="haaccount__hero-tag haaccount__hero-tag--unclaimed">
                  Hybrid Profile · Unclaimed
                </span>
              )}
            </div>
          </div>

          <ParticularsPanel
            session={session}
            onUpdated={onSessionChange}
          />

          <hr className="haaccount__rule haaccount__rule--soft" />

          <ClaimPanel
            session={session}
            onClaimed={onClaim}
          />

          <div className="haaccount__foot">
            <span>Filed by the Member · Witnessed by the Committee</span>
            <span>No. CXLVII</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AccountSheet;
