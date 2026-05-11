// StatsScreen.jsx — Membership Statistics. Race-results table for a friend group.
// Institutional. Deadpan. The 0 is commentary enough.

import React from 'react';
import { motion } from 'framer-motion';
import { loadStats } from '../lib/stats.js';

function formatLong(date) {
  return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function formatShort(date) {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

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
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    loadStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .catch((err) => { console.warn('loadStats failed', err); });
    return () => { cancelled = true; };
  }, []);

  const today = new Date();
  const todayLong = formatLong(today);
  const todayShort = formatShort(today);

  const leader = stats?.leader;
  const members = stats?.members ?? [];
  const notable = stats?.notable;

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
          Performance record, current through {todayLong}.
        </Rise>
      </header>

      <hr className="hastat__rule hastat__rule--hair" />

      {stats && (
        <>
          <section className="hastat__leader">
            {leader ? (
              <>
                <Rise delay={320} as="div" className="hastat__leader-label">
                  <span className="hastat__leader-label-rank">No. 1</span>
                  <span>Leading the Record</span>
                </Rise>
                <Rise delay={380} as="h2" className="hastat__leader-name">
                  {leader.name}
                </Rise>
                <Rise delay={440} as="div" className="hastat__leader-stats">
                  <span>
                    <span className="hastat__leader-wins">{leader.wins}</span>
                    <span className="hastat__leader-wins-unit">wins</span>
                  </span>
                </Rise>
              </>
            ) : (
              <Rise delay={320} as="p" className="hastat__leader-label">
                <span>No determinations on the record yet.</span>
              </Rise>
            )}
          </section>

          <hr className="hastat__rule hastat__rule--hair" />

          <div className="hastat__table-wrap">
            <div className="hastat__section-head">
              <span className="hastat__section-head-l">All Members</span>
              <span className="hastat__section-head-r">{members.length} entries</span>
            </div>

            <table className="hastat__table">
              <thead className="hastat__thead">
                <tr>
                  <th className="col-name" scope="col">Name</th>
                  <th className="col-wins" scope="col">Wins</th>
                  <th className="col-last" scope="col">Last Crowned</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <Row key={`${m.name}-${i}`} m={m} i={i} />
                ))}
              </tbody>
            </table>
          </div>

          <Rise
            delay={420 + members.length * 50 + 80}
            as="aside"
            className="hastat__notable"
          >
            <div className="hastat__notable-head">
              <span className="hastat__notable-title">Notable Statistics</span>
              <span className="hastat__notable-folio">Appendix A</span>
            </div>
            <ul className="hastat__notable-list">
              <li className="hastat__notable-item">
                <div className="hastat__notable-label">Co-Determinations Issued</div>
                <div className="hastat__notable-value">
                  <span className="hastat__notable-value-em">{notable.coDeterminations}</span>
                  {' '}
                  <span className="hastat__notable-value-paren">(historic)</span>
                </div>
              </li>
            </ul>
          </Rise>
        </>
      )}

      <div className="hastat__colophon">
        <span>The Committee</span>
        <span>Hybrid Athlete of the Week</span>
        <span>{todayShort}</span>
      </div>
    </div>
  );
}

export default StatsScreen;
