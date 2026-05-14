// NoticeScreen.jsx — overdue determination. Replaces home content with a
// formal notice. Tone escalates with days overdue. Same masthead/nav as Home.
// Entrance: CSS-driven, re-keyed on state change so it replays.

import React from 'react';
import { Link } from 'react-router-dom';
import { listDeterminations } from '../lib/records.js';
import { useAppContext } from '../context/AppContext.jsx';

const NOTICE_DATA = {
  champion: { name: 'Theodore J. Clifford', short: 'Mr. T. J. Clifford' },
  filedAt: 'Boston, Mass.',
  signed: { name: 'Marcus A. Devlin', title: 'Clerk of the Committee' },
  membership: { short: 'The Membership' },
};

const statesFor = (numberLabel) => ({
  1: {
    overline: 'Determination Pending',
    title: 'Determination Pending',
    stamp: { label: 'Overdue · 1 day', tone: '' },
    counter: { label: '01 day past deadline', tone: '' },
    titleTone: '',
    body: (
      <>
        This office has not received a determination for{' '}
        <strong>No. {numberLabel}</strong>. The Committee respectfully requests
        that the reigning champion fulfill their obligations at their
        earliest convenience.
      </>
    ),
    signoff: 'Respectfully,',
  },
  3: {
    overline: 'Notice of Delinquency',
    title: 'Notice of Delinquency',
    stamp: { label: 'Delinquent · 3 days', tone: 'warn' },
    counter: { label: '03 days past deadline', tone: 'warn' },
    titleTone: '',
    body: (
      <>
        The record for <strong>No. {numberLabel}</strong> remains incomplete.
        The reigning champion has yet to discharge their obligations
        to the membership. The Committee notes this with increasing
        concern.
      </>
    ),
    signoff: 'In the interest of the record,',
  },
  5: {
    overline: `Formal Notice — No. ${numberLabel}`,
    title: `Formal Notice — No. ${numberLabel}`,
    stamp: { label: 'On Record · 5+ days', tone: 'err' },
    counter: { label: '05 days past deadline', tone: 'err' },
    titleTone: 'err',
    body: (
      <>
        The Committee has noted, with considerable disappointment, the
        continued absence of a determination for <strong>No. {numberLabel}</strong>.
        The membership is aware. The record will reflect the delay.
        This is not a good look.
      </>
    ),
    signoff: 'For the record,',
  },
});

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

const rise = (cls, n) => ({
  className: `${cls} hahome__rise`,
  style: { animationDelay: `${120 + n * 80}ms` },
});

function Seal({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20.5" fill="none" stroke="#003DA5" strokeWidth="0.6" />
      <circle cx="22" cy="22" r="16.5" fill="none" stroke="#003DA5" strokeWidth="0.4" />
      <text x="22" y="18" textAnchor="middle"
            fontFamily='"Bodoni Moda", Didot, serif' fontWeight="700" fontSize="6"
            fill="#003DA5" letterSpacing="0.14em">THE</text>
      <text x="22" y="26" textAnchor="middle"
            fontFamily='"Bodoni Moda", Didot, serif' fontWeight="700" fontSize="7.5"
            fill="#003DA5" letterSpacing="0.04em">CMTE</text>
      <text x="22" y="33" textAnchor="middle"
            fontFamily='"Archivo", sans-serif' fontWeight="700" fontSize="3.6"
            fill="#003DA5" letterSpacing="0.18em">May 8</text>
    </svg>
  );
}

function Letter({ daysKey, isChampion, number }) {
  const numberLabel = number ?? '—';
  const s = statesFor(numberLabel)[daysKey];
  const isErr = s.titleTone === 'err';

  return (
    <div
      key={daysKey}
      className={
        'hanotice__letter hanotice__rise-letter' +
        (isErr ? ' hanotice__letter--err' : '')
      }
    >
      <div className="hanotice__banner" aria-hidden="true" />

      <span
        className={
          'hanotice__stamp' +
          (s.stamp.tone === 'warn' ? ' hanotice__stamp--warn' : '') +
          (s.stamp.tone === 'err'  ? ' hanotice__stamp--err'  : '')
        }
        aria-hidden="true"
      >
        <span className="hanotice__stamp-tick" />
        {s.stamp.label}
      </span>

      <div {...rise('hanotice__head', 0)}>
        <span className="hanotice__seal"><Seal /></span>
        <span className="hanotice__office">Office of the Committee</span>
        <span className="hanotice__office-sub">Hybrid Athlete of the Week</span>
      </div>

      <hr className="hanotice__rule" />

      <div {...rise('hanotice__meta', 1)}>
        <div className="hanotice__meta-row">
          <span className="hanotice__meta-l">In re</span>
          <span className="hanotice__meta-r">No. {numberLabel} · May 8</span>
        </div>
        <div className="hanotice__meta-row">
          <span className="hanotice__meta-l">Recipient</span>
          <span className="hanotice__meta-r">
            {isChampion ? NOTICE_DATA.champion.short : NOTICE_DATA.membership.short}
          </span>
        </div>
        <div className="hanotice__meta-row">
          <span className="hanotice__meta-l">Filed</span>
          <span className="hanotice__meta-r">{NOTICE_DATA.filedAt}</span>
        </div>
        <div className="hanotice__meta-row">
          <span className="hanotice__meta-l">Ref. No.</span>
          <span className="hanotice__meta-r">N-D{numberLabel}-{String(daysKey).padStart(2, '0')}</span>
        </div>
      </div>

      <div {...rise('hanotice__title-block', 2)}>
        <div className="hanotice__overline">By order of the Committee</div>
        <h1 className={'hanotice__title' + (isErr ? ' hanotice__title--err' : '')}>
          {s.title}
        </h1>
      </div>

      <p {...rise('hanotice__body', 3)}>{s.body}</p>

      <div {...rise('hanotice__signoff', 4)}>
        {s.signoff}
        <span className="hanotice__signoff-name">{NOTICE_DATA.signed.name}</span>
        <span className="hanotice__signoff-title">{NOTICE_DATA.signed.title}</span>
      </div>

      {isChampion ? (
        <div className="hahome__rise" style={{ animationDelay: '520ms' }}>
          <Link to="/issue" className="hanotice__cta">
            <span>Issue Determination</span>
            <span className="hanotice__cta-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="hahome__rise hanotice__await" style={{ animationDelay: '520ms' }}>
          <span className="hanotice__await-dot" aria-hidden="true" />
          <span className="hanotice__await-l">Awaiting Determination</span>
          <span className="hanotice__await-r">
            The Committee will notify the membership when filed.
          </span>
        </div>
      )}

      <div className="hanotice__foot">
        <span>The Committee · May 8</span>
        <span
          className={
            'hanotice__counter' +
            (s.counter.tone === 'warn' ? ' hanotice__counter--warn' : '') +
            (s.counter.tone === 'err'  ? ' hanotice__counter--err'  : '')
          }
        >
          {s.counter.label}
        </span>
      </div>
    </div>
  );
}

function NoticeScreen() {
  const { isChampion } = useAppContext();
  const [days, setDays] = React.useState(1);
  const [pendingDeterminationNumber, setPendingDeterminationNumber] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    listDeterminations().then(records => {
      if (cancelled) return;
      setPendingDeterminationNumber(records.length ? records[0].determinationNumber + 1 : 1);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="hahome">
      <header className="hahome__masthead">
        <div className="hahome__wordmark hahome__rise" {...delay(0)}>
          <span className="hahome__wordmark-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10.25" stroke="#1A1A1A" strokeWidth="0.75"/>
              <circle cx="11" cy="11" r="7.75" stroke="#1A1A1A" strokeWidth="0.5"/>
              <text x="11" y="14.2" textAnchor="middle"
                    fontFamily='"Bodoni Moda", Didot, serif'
                    fontWeight="700" fontSize="9" fill="#003DA5"
                    letterSpacing="-0.02em">H</text>
            </svg>
          </span>
          <span className="hahome__wordmark-text">Hybrid Athletes</span>
        </div>

        <hr className="hahome__rule hahome__rule--top hahome__draw" {...delay(180)} />

        <div className="hahome__folio hahome__rise" {...delay(280)}>
          <span className="hahome__folio-l">May 8</span>
          <span className="hahome__folio-c">The Committee</span>
          <span className="hahome__folio-r" aria-hidden="true"></span>
        </div>
      </header>

      <main className="hahome__main hanotice__main">
        <div className="hanotice__demobar" role="group" aria-label="Demo: days overdue">
          <span className="hanotice__demobar-l">Demo · Days Overdue</span>
          <span className="hanotice__demobar-seg">
            {[1, 3, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={'hanotice__demobar-btn' + (days === n ? ' is-active' : '')}
                onClick={() => setDays(n)}
                aria-pressed={days === n}
              >
                {n} {n === 1 ? 'day' : 'days'}
              </button>
            ))}
          </span>
        </div>

        <Letter daysKey={days} isChampion={isChampion} number={pendingDeterminationNumber} />

        <p className="hanotice__notebelow">
          {isChampion
            ? 'A copy has been entered into the Register.'
            : 'Posted to the Register · viewable to all members.'}
        </p>
      </main>

      <hr className="hahome__rule hahome__rule--bottom hahome__draw" {...delay(1700)} />

      <div className="hahome__colophon">
        <span>The Committee</span>
        <span>Notice · No. {pendingDeterminationNumber ?? '—'}</span>
        <span>May 8</span>
      </div>
    </div>
  );
}

export default NoticeScreen;
