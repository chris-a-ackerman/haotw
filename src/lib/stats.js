// Membership statistics — pure aggregation over the roster + the official
// record. No backend of its own; identical behavior in dev (localStorage) and
// live (Supabase) modes because both upstream services return the same shape.

import { listProfiles } from './claims.js';
import { listDeterminations } from './records.js';

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatShortDate(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit' });
}

function monthRange(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) return '';
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return start.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }
  const startStr = start.toLocaleString('en-US', { month: 'short' });
  const endStr = end.toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  if (sameYear) return `${startStr}–${endStr}`;
  const startWithYear = start.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  return `${startWithYear}–${endStr}`;
}

function computeMember(name, determinations) {
  let wins = 0;
  let streak = 0;
  let streakBroken = false;
  let lastCrowned = '—';
  let lastCrownedDate = null;

  // determinations are sorted by week descending — perfect for both
  // "current streak" (walk from the front, stop at first miss) and
  // "last crowned" (first hit wins).
  for (const d of determinations) {
    const winnerHere = (d.winners || []).includes(name);
    if (winnerHere) {
      wins += 1;
      if (!streakBroken) streak += 1;
      if (!lastCrownedDate) {
        lastCrownedDate = parseDate(d.determinedOn);
        lastCrowned = formatShortDate(d.determinedOn);
      }
    } else {
      streakBroken = true;
    }
  }

  return { name, wins, streak, lastCrowned, _lastCrownedDate: lastCrownedDate };
}

function pickLeader(members) {
  const ranked = members
    .filter((m) => m.wins > 0)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.streak !== a.streak) return b.streak - a.streak;
      const ad = a._lastCrownedDate ? a._lastCrownedDate.getTime() : 0;
      const bd = b._lastCrownedDate ? b._lastCrownedDate.getTime() : 0;
      return bd - ad;
    });
  if (ranked.length === 0) return null;
  const top = ranked[0];
  return {
    name: top.name,
    wins: top.wins,
    streak: top.streak,
    lastCrowned: top.lastCrowned,
  };
}

function rankMembers(members) {
  return members
    .slice()
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return a.name.localeCompare(b.name);
    })
    .map(({ _lastCrownedDate, ...rest }) => rest);
}

function computeLongestStreak(profiles, determinations) {
  // Walk determinations ascending so consecutive runs accumulate naturally.
  const ascending = determinations.slice().sort((a, b) => a.determinationNumber - b.determinationNumber);
  if (ascending.length === 0) return null;

  let best = null; // { who, weeks, startValue, endValue }
  const running = new Map(); // name -> { count, startIdx }

  for (let i = 0; i < ascending.length; i += 1) {
    const d = ascending[i];
    const winnersHere = new Set(d.winners || []);
    for (const name of profiles) {
      if (winnersHere.has(name)) {
        const prev = running.get(name);
        const next = prev ? { count: prev.count + 1, startIdx: prev.startIdx } : { count: 1, startIdx: i };
        running.set(name, next);
        if (!best || next.count > best.weeks) {
          best = {
            who: name,
            weeks: next.count,
            startValue: ascending[next.startIdx].determinedOn,
            endValue: d.determinedOn,
          };
        }
      } else {
        running.delete(name);
      }
    }
  }

  if (!best || best.weeks < 2) return null;
  return {
    who: best.who,
    weeks: best.weeks,
    when: monthRange(best.startValue, best.endValue),
  };
}

export async function loadStats() {
  const [profiles, determinations] = await Promise.all([
    listProfiles(),
    listDeterminations(),
  ]);

  const memberRows = profiles.map((name) => computeMember(name, determinations));
  const leader = pickLeader(memberRows);
  const members = rankMembers(memberRows);
  const longestStreak = computeLongestStreak(profiles, determinations);
  const coDeterminations = determinations.filter(
    (d) => (d.winners || []).length > 1,
  ).length;

  return {
    leader,
    members,
    notable: { longestStreak, coDeterminations },
  };
}
