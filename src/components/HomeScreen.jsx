// HomeScreen.jsx — Hybrid Athlete of the Week, web home view.
// Institutional. Deadpan. The document arrives, it does not announce itself.
// Entrance: CSS-driven fade-up, staggered with custom-property delays.

import React from 'react';
import { Certificate } from './Certificate.jsx';

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

function formatFiledDate(value) {
  if (!value) return '';
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d))
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return value;
}

function HomeScreen({ isChampion = false, determination, determinationNo }) {
  if (!determination) {
    return (
      <div className="hahome">
        <main className="hahome__main">
          <div className="hahome__inre">Awaiting first Determination</div>
        </main>
      </div>
    );
  }

  const cert = {
    org:        'Hybrid Athletes',
    title:      determination.winners.length > 1 ? 'Hybrid Athletes of the Week' : 'Hybrid Athlete of the Week',
    weekLabel:  `No. ${determination.determinationNumber} · ${determination.determinedOn}`,
    determinationNumber: determination.determinationNumber,
    recipients: determination.winners,
    body:       determination.citation,
    determinedBy: determination.determiner,
    est:        'Est. 2023',
  };

  const determinerFirst = (determination.determiner || '').split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

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

        <div className="hahome__folio hahome__rise" {...delay(300)}>
          <span className="hahome__folio-l">{today}</span>
          <span className="hahome__folio-c">The Committee</span>
          <span className="hahome__folio-r" aria-hidden="true"></span>
        </div>
      </header>

      <main className="hahome__main">
        <a href="record.html" className="hahome__weekbadge hahome__weekbadge--link hahome__rise" {...delay(440)}>
          <span>Official Record</span>
          <span className="hahome__weekbadge-arrow" aria-hidden="true">→</span>
        </a>

        <div className="hahome__inre hahome__rise" {...delay(580)}>Current HAOTW</div>

        <h1 className="hahome__name hahome__rise" {...delay(640)}>
          {determination.winners.join(' · ')}
        </h1>

        <div className="hahome__byline hahome__rise" {...delay(860)}>
          <span>Crowned by {determinerFirst}</span>
          <span className="hahome__byline-dot" aria-hidden="true">·</span>
          <span>{determination.determinedOn}</span>
        </div>

        <a
          href="/?view=certificate"
          target="_blank"
          rel="noopener noreferrer"
          className="hahome__cert-link"
          aria-label="Open certificate in a new tab"
        >
          <figure className="hahome__cert hahome__rise" {...delay(940)}>
            <div className="hahome__cert-overline">
              <span>Certificate of Determination</span>
              <span className="hahome__cert-overline-r">No. {determinationNo ?? '—'}</span>
            </div>
            <div className="hahome__cert-stage" aria-label="Certificate of Determination, framed">
              <div className="hahome__cert-shrink">
                <Certificate data={cert} />
              </div>
            </div>
            <figcaption className="hahome__cert-cap">
              Issued under seal by The Committee &middot; affixed for public viewing
            </figcaption>
          </figure>
        </a>

        <hr className="hahome__rule hahome__rule--soft hahome__draw" {...delay(1000)} />

        <div className="hahome__attest hahome__rise" {...delay(1440)}>
          <div className="hahome__attest-row">
            <span className="hahome__attest-l">Filed</span>
            <span className="hahome__attest-r">{formatFiledDate(determination.determinedOn)}</span>
          </div>
        </div>

        {isChampion && (
          <a href="issue.html" className="hahome__issue hahome__rise" {...delay(1620)}>
            <span className="hahome__issue-label">Choose the next HAOTW</span>
            <span className="hahome__issue-arrow" aria-hidden="true">→</span>
          </a>
        )}
      </main>

      <hr className="hahome__rule hahome__rule--bottom hahome__draw" {...delay(1700)} />

      <div className="hahome__colophon">
        <span>The Committee</span>
        <span>Hybrid Athlete of the Week</span>
        <span>{today}</span>
      </div>
    </div>
  );
}

export default HomeScreen;
