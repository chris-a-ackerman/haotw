// RecordScreen.jsx — The Official Record. All determinations, in chronological reverse.
// Two layers: the certificate language (deadpan, what went on the graphic),
// and the full original speech (the writer's voice, the real record).

import React from 'react';
import { listDeterminations } from '../lib/records.js';

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

function Speech({ text }) {
  const paras = text.split('\n\n');
  return (
    <div className="harec__speech">
      <div className="harec__speech-head">
        <span>The Original Speech</span>
        <span className="harec__speech-folio">Verbatim</span>
      </div>
      {paras.map((p, i) => (
        <p
          key={i}
          className={
            'harec__speech-p' + (i === 0 ? ' harec__speech-p--lede' : '')
          }
        >
          {p}
        </p>
      ))}
    </div>
  );
}

function Entry({ entry, expanded, onToggle, onViewCertificate, riseDelay }) {
  const winnerLine = entry.winners.length === 1
    ? entry.winners[0]
    : entry.winners.join(' · ');

  return (
    <li
      className={
        'harec__entry harec__rise' +
        (entry.current ? ' is-current' : '') +
        (expanded ? ' is-expanded' : '')
      }
      style={{ animationDelay: `${riseDelay}ms` }}
    >
      <div className="harec__entry-head">
        <span className={'harec__week' + (entry.current ? ' is-current' : '')}>
          {entry.current ? 'Current Determination' : `Week ${String(entry.week).padStart(2, '0')}`}
        </span>
        {entry.coDetermination && (
          <span className="harec__co">Co-Determination</span>
        )}
      </div>

      <h2 className="harec__name">{winnerLine}</h2>

      <div className="harec__by">
        <span>Determined by {entry.determiner}</span>
        <span className="harec__by-dot" aria-hidden="true">·</span>
        <span>{entry.determinedOn}</span>
      </div>

      <p className={'harec__cite' + (expanded ? ' is-open' : '')}>
        {entry.citation}
      </p>

      <button
        type="button"
        className="harec__more"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Close full speech' : 'Read full speech'}</span>
        <span className="harec__more-arrow" aria-hidden="true">
          {expanded ? '↑' : '→'}
        </span>
      </button>

      <div
        className={'harec__speech-grid' + (expanded ? ' is-open' : '')}
        aria-hidden={!expanded}
      >
        <div className="harec__speech-grid-inner">
          <Speech text={entry.speech} />
          <button
            type="button"
            className="harec__cert-cta"
            onClick={(e) => { e.stopPropagation(); onViewCertificate && onViewCertificate(entry); }}
          >
            <span className="harec__cert-cta-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2.5" y="3.5" width="17" height="15" stroke="currentColor" strokeWidth="0.75"/>
                <rect x="4.25" y="5.25" width="13.5" height="11.5" stroke="currentColor" strokeWidth="0.4"/>
                <line x1="6" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="0.5"/>
                <line x1="6" y1="11.5" x2="13" y2="11.5" stroke="currentColor" strokeWidth="0.5"/>
                <line x1="6" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="0.5"/>
              </svg>
            </span>
            <span className="harec__cert-cta-body">
              <span className="harec__cert-cta-l">View &amp; Share Certificate</span>
              <span className="harec__cert-cta-meta">PNG of record · speech · download or share</span>
            </span>
            <span className="harec__cert-cta-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </li>
  );
}

function RecordScreen({ onViewCertificate }) {
  const [openWeek, setOpenWeek] = React.useState(null);
  const [records, setRecords] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    listDeterminations().then((rows) => {
      if (!cancelled) setRecords(rows);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="harec">
      <div className="harec__masthead harec__rise" {...delay(0)}>
        <a href="index.html" className="harec__back">
          <span className="harec__back-arrow" aria-hidden="true">←</span>
          <span>Return</span>
        </a>
        <div className="harec__wordmark">
          <span className="harec__wordmark-text">Hybrid Athletes</span>
        </div>
      </div>

      <hr className="harec__rule harec__rule--top harec__draw" {...delay(120)} />

      <header className="harec__header">
        <div className="harec__overline harec__rise" {...delay(220)}>
          <span className="harec__overline-tick" aria-hidden="true">§</span>
          <span>The Committee</span>
        </div>
        <h1 className="harec__title harec__rise" {...delay(300)}>Official Record</h1>
        <p className="harec__subtitle harec__rise" {...delay(420)}>
          All determinations. Permanent. Indelible.
        </p>
        <div className="harec__meta-row harec__rise" {...delay(520)}>
          <span>Determinations 1–{records.length || 10}</span>
          <span className="harec__meta-dot" aria-hidden="true">·</span>
          <span>May 8</span>
        </div>
      </header>

      <hr className="harec__rule harec__rule--banner harec__draw" {...delay(620)} />

      <ol className="harec__list">
        {records.map((r, i) => (
          <Entry
            key={r.week}
            entry={r}
            expanded={openWeek === r.week}
            onToggle={() =>
              setOpenWeek((cur) => (cur === r.week ? null : r.week))
            }
            onViewCertificate={onViewCertificate}
            riseDelay={720 + i * 80}
          />
        ))}
      </ol>

      <div className="harec__endmark harec__rise" {...delay(720 + records.length * 80 + 40)}>
        <span aria-hidden="true">❦</span>
        <span>End of Record</span>
        <span aria-hidden="true">❦</span>
      </div>

      <div className="harec__colophon">
        <span>The Committee</span>
        <span>Hybrid Athlete of the Week</span>
        <span>May 8</span>
      </div>
    </div>
  );
}

export default RecordScreen;
