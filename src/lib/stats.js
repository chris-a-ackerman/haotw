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

function computeMember(name, determinations) {
  let wins = 0;
  let lastCrowned = '—';
  let lastCrownedDate = null;

  for (const d of determinations) {
    if ((d.winners || []).includes(name)) {
      wins += 1;
      if (!lastCrownedDate) {
        lastCrownedDate = parseDate(d.determinedOn);
        lastCrowned = formatShortDate(d.determinedOn);
      }
    }
  }

  return { name, wins, lastCrowned, _lastCrownedDate: lastCrownedDate };
}

function pickLeader(members) {
  const ranked = members
    .filter((m) => m.wins > 0)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      const ad = a._lastCrownedDate ? a._lastCrownedDate.getTime() : 0;
      const bd = b._lastCrownedDate ? b._lastCrownedDate.getTime() : 0;
      return bd - ad;
    });
  if (ranked.length === 0) return null;
  const top = ranked[0];
  return {
    name: top.name,
    wins: top.wins,
    lastCrowned: top.lastCrowned,
  };
}

function rankMembers(members) {
  return members
    .slice()
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    })
    .map(({ _lastCrownedDate, ...rest }) => rest);
}

export async function loadStats() {
  const [profiles, determinations] = await Promise.all([
    listProfiles(),
    listDeterminations(),
  ]);

  const memberRows = profiles.map((name) => computeMember(name, determinations));
  const leader = pickLeader(memberRows);
  const members = rankMembers(memberRows);
  const coDeterminations = determinations.filter(
    (d) => (d.winners || []).length > 1,
  ).length;

  return {
    leader,
    members,
    notable: { coDeterminations },
  };
}
