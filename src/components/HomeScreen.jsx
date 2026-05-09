// HomeScreen.jsx — Hybrid Athlete of the Week, web home view.
// Institutional. Deadpan. The document arrives, it does not announce itself.
// Entrance: CSS-driven fade-up, staggered with custom-property delays.

import React from 'react';
import { Certificate } from './Certificate.jsx';

const data = {
  week: 14,
  champion: { name: 'Theodore J. Clifford', town: 'Brookline, Mass.' },
  crownedBy: 'Marcus A. Devlin',
  crownedOn: 'April 28, 2026',
  issuedAt: '18:42 EDT',
  filedAt: 'Filed at Boston, Mass.',
  citation: [
    'After a dominant performance and 6-minute PR at Boston, Mr. Clifford took his exceptionally good looks and Adidas Adios Pros to London, where he dropped a casual sub-3 marathon 6 days after Boston while making a quick pit stop at the loo.',
    'Arguably this is even more impressive than his day in Boston. The Committee, having reviewed corroborating chat logs and one (1) screenshot of a finish-line photo, finds the effort sufficient to merit recognition under the Hybrid standard, and so confers this Determination.',
  ],
  viewerIsHolder: true,
};

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

const HOME_CERT = {
  org:        'Hybrid Athletes',
  title:      'Hybrid Athlete of the Week',
  weekLabel:  'Week 14 · April 28, 2026',
  recipients: ['Mr. T. J. Clifford'],
  body:
    'Mr. Clifford completed the 2026 London Marathon in 2:58:41, six days ' +
    'following a 6-minute personal record at the 130th Boston Athletic ' +
    'Federation Marathon. A gastrointestinal episode was noted and ' +
    'resolved mid-race. The determination stands.',
  determinedBy: 'Marcus A. Devlin',
  est:         'Est. 2023',
};

function HomeScreen({ isChampion = data.viewerIsHolder }) {
  const viewerIsHolder = isChampion;

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
          <span className="hahome__folio-l">May 8</span>
          <span className="hahome__folio-c">The Committee</span>
          <span className="hahome__folio-r" aria-hidden="true"></span>
        </div>
      </header>

      <main className="hahome__main">
        <a href="record.html" className="hahome__weekbadge hahome__weekbadge--link hahome__rise" {...delay(440)}>
          <span className="hahome__weekbadge-tick" aria-hidden="true">§</span>
          <span>Week 14</span>
          <span className="hahome__weekbadge-dot" aria-hidden="true">·</span>
          <span>Official Record</span>
          <span className="hahome__weekbadge-arrow" aria-hidden="true">→</span>
        </a>

        <div className="hahome__inre hahome__rise" {...delay(580)}>Current HAOTW</div>

        <h1 className="hahome__name hahome__rise" {...delay(640)}>
          {data.champion.name}
        </h1>

        <div className="hahome__byline hahome__rise" {...delay(860)}>
          <span>Crowned by {data.crownedBy.split(' ')[0]}</span>
          <span className="hahome__byline-dot" aria-hidden="true">·</span>
          <span>{data.crownedOn}</span>
        </div>

        <figure className="hahome__cert hahome__rise" {...delay(940)}>
          <div className="hahome__cert-overline">
            <span>Certificate of Determination</span>
            <span className="hahome__cert-overline-r">No. CXLVII</span>
          </div>
          <div className="hahome__cert-stage" aria-label="Certificate of Determination, framed">
            <div className="hahome__cert-shrink">
              <Certificate data={HOME_CERT} />
            </div>
          </div>
          <figcaption className="hahome__cert-cap">
            Issued under seal by The Committee &middot; affixed for public viewing
          </figcaption>
        </figure>

        <hr className="hahome__rule hahome__rule--soft hahome__draw" {...delay(1000)} />

        <div className="hahome__attest hahome__rise" {...delay(1440)}>
          <div className="hahome__attest-row">
            <span className="hahome__attest-l">Witnessed</span>
            <span className="hahome__attest-r">D. Okafor &middot; in person</span>
          </div>
          <div className="hahome__attest-row">
            <span className="hahome__attest-l">Filed</span>
            <span className="hahome__attest-r">{data.filedAt} &middot; {data.issuedAt}</span>
          </div>
          <div className="hahome__attest-row">
            <span className="hahome__attest-l">Determination</span>
            <span className="hahome__attest-r">No. CXLVII &middot; affirmed</span>
          </div>
        </div>

        {viewerIsHolder && (
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
        <span>May 8</span>
      </div>
    </div>
  );
}

export default HomeScreen;
