// StatsScreen.jsx — Membership Statistics. Race-results table for a friend group.
// Institutional. Deadpan. The 0 is commentary enough; the days count is commentary enough.

import React from 'react';
import { motion } from 'framer-motion';

const LEADER = {
  rank: 1,
  name: 'Will Clifford',
  wins: 7,
  streak: 2,
  lastCrowned: 'May 05',
};

const MEMBERS = [
  { rank: 1,  name: 'C. Ackerman',    wins: 1, streak: 0, lastCrowned: 'Mar 31' },
  { rank: 2,  name: 'J. Beasley',     wins: 1, streak: 0, lastCrowned: 'Feb 24' },
  { rank: 3,  name: 'J. Bernhardt',   wins: 1, streak: 0, lastCrowned: 'Mar 24' },
  { rank: 4,  name: 'W. Clifford',    wins: 7, streak: 2, lastCrowned: 'May 05' },
  { rank: 5,  name: 'E. Coleman',     wins: 2, streak: 0, lastCrowned: 'Apr 28' },
  { rank: 6,  name: 'R. Dombroski',   wins: 4, streak: 0, lastCrowned: 'Apr 21' },
  { rank: 7,  name: 'P. Flanagan',    wins: 2, streak: 0, lastCrowned: 'Apr 14' },
  { rank: 8,  name: 'J. Helf',        wins: 0, streak: 0, lastCrowned: '—' },
  { rank: 9,  name: 'D. Lignos',      wins: 1, streak: 0, lastCrowned: 'Feb 17' },
  { rank: 10, name: 'L. Liljeberg',   wins: 1, streak: 0, lastCrowned: 'Mar 10' },
  { rank: 11, name: 'H. McGreen',     wins: 2, streak: 0, lastCrowned: 'Apr 07' },
  { rank: 12, name: 'F. Nieto',       wins: 1, streak: 0, lastCrowned: 'Feb 10' },
  { rank: 13, name: 'C. Shulman',     wins: 3, streak: 0, lastCrowned: 'Mar 17' },
  { rank: 14, name: 'L. Tran',        wins: 1, streak: 0, lastCrowned: 'Mar 03' },
];

const NOTABLE = {
  longestStreak: { who: 'W. Clifford', weeks: 3, when: 'Feb–Mar 2026' },
  coDeterminations: 2,
  mostDays:        { who: 'J. Helf', days: 228 },
};

function Row({ m, i }) {
  return (
    <motion.tr
      className="hastat__row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.42 + i * 0.05,
        duration: 0.42,
        ease: [0.2, 0.0, 0.0, 1.0],
      }}
    >
      <td className="hastat__name">{m.name}</td>
      <td className={'hastat__wins' + (m.wins === 0 ? ' hastat__wins--zero' : '')}>
        {m.wins}
      </td>
      <td className={'hastat__strk' + (m.streak === 0 ? ' hastat__strk--zero' : '')}>
        {m.streak > 0 ? <span className="hastat__strk-em">{m.streak}w</span> : '—'}
      </td>
      <td className="hastat__last">{m.lastCrowned}</td>
    </motion.tr>
  );
}

function Rise({ delay, children, as = 'div', className = '', ...rest }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay / 1000,
        duration: 0.5,
        ease: [0.2, 0.0, 0.0, 1.0],
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

function StatsScreen() {
  return (
    <div className="hastat">
      <div className="hastat__masthead">
        <a href="index.html" className="hastat__back">
          <span className="hastat__back-arrow" aria-hidden="true">←</span>
          <span>Return</span>
        </a>
        <span className="hastat__wordmark-text">Hybrid Athletes</span>
      </div>

      <hr className="hastat__rule hastat__rule--top" />

      <header className="hastat__header">
        <Rise delay={60} as="div" className="hastat__overline">
          <span className="hastat__overline-tick" aria-hidden="true">§</span>
          <span>The Committee</span>
        </Rise>
        <Rise delay={140} as="h1" className="hastat__title">
          Hybrids
        </Rise>
        <Rise delay={240} as="p" className="hastat__subtitle">
          Performance record, current through May 9, 2026.
        </Rise>
      </header>

      <hr className="hastat__rule hastat__rule--hair" />

      <section className="hastat__leader">
        <Rise delay={320} as="div" className="hastat__leader-label">
          <span className="hastat__leader-label-rank">No. 1</span>
          <span>Leading the Record</span>
        </Rise>
        <Rise delay={380} as="h2" className="hastat__leader-name">
          {LEADER.name}
        </Rise>
        <Rise delay={440} as="div" className="hastat__leader-stats">
          <span>
            <span className="hastat__leader-wins">{LEADER.wins}</span>
            <span className="hastat__leader-wins-unit">wins</span>
          </span>
          {LEADER.streak > 0 && (
            <span className="hastat__streak">
              <span className="hastat__streak-tick" aria-hidden="true">§</span>
              <span>Current streak: {LEADER.streak} weeks</span>
            </span>
          )}
        </Rise>
      </section>

      <hr className="hastat__rule hastat__rule--hair" />

      <div className="hastat__table-wrap">
        <div className="hastat__section-head">
          <span className="hastat__section-head-l">All Members</span>
          <span className="hastat__section-head-r">{MEMBERS.length} entries</span>
        </div>

        <table className="hastat__table">
          <thead className="hastat__thead">
            <tr>
              <th className="col-name" scope="col">Name</th>
              <th className="col-wins" scope="col">Wins</th>
              <th className="col-strk" scope="col">Streak</th>
              <th className="col-last" scope="col">Last Crowned</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m, i) => (
              <Row key={`${m.name}-${i}`} m={m} i={i} />
            ))}
          </tbody>
        </table>
      </div>

      <Rise
        delay={420 + MEMBERS.length * 50 + 80}
        as="aside"
        className="hastat__notable"
      >
        <div className="hastat__notable-head">
          <span className="hastat__notable-title">Notable Statistics</span>
          <span className="hastat__notable-folio">Appendix A</span>
        </div>
        <ul className="hastat__notable-list">
          <li className="hastat__notable-item">
            <div className="hastat__notable-label">Longest Streak</div>
            <div className="hastat__notable-value">
              {NOTABLE.longestStreak.who}
              {' · '}
              <span className="hastat__notable-value-em">
                {NOTABLE.longestStreak.weeks} consecutive weeks
              </span>
              {' '}
              <span className="hastat__notable-value-paren">
                ({NOTABLE.longestStreak.when})
              </span>
            </div>
          </li>
          <li className="hastat__notable-item">
            <div className="hastat__notable-label">Co-Determinations Issued</div>
            <div className="hastat__notable-value">
              <span className="hastat__notable-value-em">{NOTABLE.coDeterminations}</span>
              {' '}
              <span className="hastat__notable-value-paren">(historic)</span>
            </div>
          </li>
          <li className="hastat__notable-item">
            <div className="hastat__notable-label">Most Days Since Last Crown</div>
            <div className="hastat__notable-value">
              {NOTABLE.mostDays.who}
              {' · '}
              <span className="hastat__notable-value-em">{NOTABLE.mostDays.days} days</span>
            </div>
          </li>
        </ul>
      </Rise>

      <div className="hastat__colophon">
        <span>The Committee</span>
        <span>Hybrid Athlete of the Week</span>
        <span>May 9</span>
      </div>
    </div>
  );
}

export default StatsScreen;
