// Coaching Tree service. Mirrors the dual-mode pattern in claims.js / records.js:
// when Supabase env vars are unset, the entire feature runs out of localStorage
// against seeded constants below. Live mode hits the relationships /
// distinctions / person_distinctions tables added in migration 0004.
//
// People in the tree are unified — both members (the 14-name roster from
// claims.js) and the four non-member mothers live in hybrid_profiles, separated
// only by is_member. Members appear on /stats and can be claimed by accounts;
// non-members appear only here.

import { supabase, isLive, logSupabaseError } from './supabase.js';
import { HYBRID_PROFILES, listProfilesWithPhotos } from './claims.js';
import { slugify } from './certificate.js';

export { slugify };

// ─────────────────────────────────────────────────────────────────────
// Dev admin gate
// ─────────────────────────────────────────────────────────────────────
// In live mode admin status comes from profiles.is_admin (surfaced as
// session.isAdmin by auth.js). In dev mode we don't have that column, so we
// grant admin to Jake Bernhardt's claim OR to a developer email allowlist.
// Mirrors the spirit of ADMIN_EMAILS in AdminBackfill.jsx but for the tree
// admin surface specifically.
export const DEV_ADMIN_EMAILS = ['chris.ackerman02@gmail.com'];

export function isAdmin(session) {
  if (!session) return false;
  if (isLive()) return !!session.isAdmin;
  if (session.hybridProfile === 'Jake Bernhardt') return true;
  if (session.email && DEV_ADMIN_EMAILS.includes(session.email.toLowerCase())) {
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────
// Seed constants (used to populate localStorage on first read and to seed
// supabase/seed.sql; if either changes, update both)
// ─────────────────────────────────────────────────────────────────────
export const NON_MEMBERS = [
  { displayName: 'Linda Liljeberg',   note: 'Mother of Logan Liljeberg.' },
  { displayName: 'Laura Dombroski',   note: 'Mother of Ryan Dombroski.' },
  { displayName: 'Allison Bernhardt', note: 'Mother of Jake Bernhardt.' },
  { displayName: 'Linda Flanagan',    note: 'Mother of Paul Flanagan.' },
];

const BAA_BLUE = '#003DA5';

export const DEFAULT_DISTINCTIONS = [
  {
    name: 'Troubled Soles Run Club — Franklin, MA',
    shortName: 'Troubled Soles',
    icon: '🏃‍♀️',
    color: BAA_BLUE,
    description: 'Members of the Troubled Soles Run Club in Franklin, Massachusetts.',
    members: ['Linda Liljeberg', 'Laura Dombroski', 'Allison Bernhardt'],
  },
  {
    name: 'Disciple of the Troubled Soles Coaching Tree',
    shortName: 'Troubled Soles Disciple',
    icon: '🏃',
    color: BAA_BLUE,
    description: 'Members of the Hybrid Athletes raised in the TSRC coaching tradition.',
    members: ['Ryan Dombroski', 'Logan Liljeberg'],
  },
  {
    name: 'Attended Boston College',
    shortName: 'BC',
    icon: '🦅',
    color: BAA_BLUE,
    description: 'Members who attended Boston College.',
    members: ['Jake Bernhardt', 'James Helf', 'Paul Flanagan', 'Franco Nieto', 'Dan Lignos'],
  },
  {
    name: 'Currently at MIT Sloan',
    shortName: 'MIT Sloan',
    icon: '🏛️',
    color: BAA_BLUE,
    description: 'Members currently enrolled at MIT Sloan School of Management.',
    members: ['Jake Bernhardt', 'Chris Ackerman', 'Josh Beasley', 'Ed Coleman', 'Paul Flanagan'],
  },
  {
    name: '2024 Sugarloaf Marathon Finisher',
    shortName: "Sugarloaf '24 · Finisher",
    icon: '🔺',
    color: BAA_BLUE,
    description: 'Completed the 2024 Sugarloaf Marathon.',
    members: ['Jake Bernhardt', 'Paul Flanagan'],
  },
  {
    name: '2024 Sugarloaf Marathon Participant',
    shortName: "Sugarloaf '24 · Participant",
    icon: '🔻',
    color: BAA_BLUE,
    description: 'Started the 2024 Sugarloaf Marathon.',
    members: ['Ed Coleman', 'Long Tran', 'Caleb Shulman', 'Hank McGreen', 'Will Clifford'],
  },
];

export const DEFAULT_RELATIONSHIPS = [
  // Parent edges
  { from: 'Linda Liljeberg',   to: 'Logan Liljeberg', kind: 'parent' },
  { from: 'Laura Dombroski',   to: 'Ryan Dombroski',  kind: 'parent' },
  { from: 'Allison Bernhardt', to: 'Jake Bernhardt',  kind: 'parent' },
  { from: 'Linda Flanagan',    to: 'Paul Flanagan',   kind: 'parent' },
  // Recruited edges
  { from: 'Jake Bernhardt', to: 'Chris Ackerman', kind: 'recruited' },
  { from: 'Jake Bernhardt', to: 'Josh Beasley',   kind: 'recruited' },
  { from: 'Jake Bernhardt', to: 'Ed Coleman',     kind: 'recruited' },
  { from: 'Jake Bernhardt', to: 'James Helf',     kind: 'recruited' },
  { from: 'Paul Flanagan',  to: 'Franco Nieto',   kind: 'recruited' },
  { from: 'Paul Flanagan',  to: 'Long Tran',      kind: 'recruited' },
  { from: 'Paul Flanagan',  to: 'Caleb Shulman',  kind: 'recruited' },
  { from: 'Long Tran',      to: 'Hank McGreen',   kind: 'recruited' },
  { from: 'Long Tran',      to: 'Will Clifford',  kind: 'recruited' },
  { from: 'Long Tran',      to: 'Dan Lignos',     kind: 'recruited' },
  { from: 'Will Clifford',  to: 'Clem Carranza',  kind: 'recruited' },
  // Lateral connection (read-only on direction; only note is editable in admin)
  {
    from: 'Paul Flanagan',
    to: 'Jake Bernhardt',
    kind: 'strava_dm',
    note: 'Inbound to Bernhardt from Flanagan via Strava DM',
  },
];

// Clem is recruited by Will but isn't on the 14-name roster. Seed as a member
// of the tree only — the spec keeps him in the tree even though he's not on
// /stats (members.is_member=true means he could be claimed in principle).
const EXTRA_MEMBERS = ['Clem Carranza'];

// ─────────────────────────────────────────────────────────────────────
// localStorage layer
// ─────────────────────────────────────────────────────────────────────
const STORAGE_PEOPLE        = 'haotw.tree.people';
const STORAGE_RELATIONSHIPS = 'haotw.tree.relationships';
const STORAGE_DISTINCTIONS  = 'haotw.tree.distinctions';
const STORAGE_PERSON_DIST   = 'haotw.tree.personDistinctions';

function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch { return fallback; }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedLocal() {
  const peopleSeed = readJSON(STORAGE_PEOPLE, null);
  if (peopleSeed != null) return; // already seeded

  let nextId = 1;
  const people = [];
  for (const name of HYBRID_PROFILES) {
    people.push({
      id: nextId++,
      displayName: name,
      slug: slugify(name),
      isMember: true,
      photoUrl: null,
    });
  }
  for (const name of EXTRA_MEMBERS) {
    people.push({
      id: nextId++,
      displayName: name,
      slug: slugify(name),
      isMember: true,
      photoUrl: null,
    });
  }
  for (const m of NON_MEMBERS) {
    people.push({
      id: nextId++,
      displayName: m.displayName,
      slug: slugify(m.displayName),
      isMember: false,
      photoUrl: null,
    });
  }
  const byName = new Map(people.map((p) => [p.displayName, p]));

  const distinctions = DEFAULT_DISTINCTIONS.map((d) => ({
    id: uid(),
    name: d.name,
    shortName: d.shortName,
    icon: d.icon,
    color: d.color,
    description: d.description,
  }));
  const distByName = new Map(distinctions.map((d) => [d.name, d]));

  const personDistinctions = [];
  for (const seed of DEFAULT_DISTINCTIONS) {
    const d = distByName.get(seed.name);
    for (const memberName of seed.members) {
      const p = byName.get(memberName);
      if (p && d) personDistinctions.push({ personId: p.id, distinctionId: d.id });
    }
  }

  const relationships = [];
  for (const r of DEFAULT_RELATIONSHIPS) {
    const f = byName.get(r.from);
    const t = byName.get(r.to);
    if (!f || !t) continue;
    relationships.push({
      id: uid(),
      fromId: f.id,
      toId: t.id,
      kind: r.kind,
      note: r.note || null,
      createdAt: new Date().toISOString(),
    });
  }

  writeJSON(STORAGE_PEOPLE, people);
  writeJSON(STORAGE_RELATIONSHIPS, relationships);
  writeJSON(STORAGE_DISTINCTIONS, distinctions);
  writeJSON(STORAGE_PERSON_DIST, personDistinctions);
}

function loadPeopleLocal() {
  seedLocal();
  return readJSON(STORAGE_PEOPLE, []) || [];
}
function loadRelationshipsLocal() {
  seedLocal();
  return readJSON(STORAGE_RELATIONSHIPS, []) || [];
}
function loadDistinctionsLocal() {
  seedLocal();
  return readJSON(STORAGE_DISTINCTIONS, []) || [];
}
function loadPersonDistinctionsLocal() {
  seedLocal();
  return readJSON(STORAGE_PERSON_DIST, []) || [];
}

function savePeopleLocal(rows)        { writeJSON(STORAGE_PEOPLE, rows); }
function saveRelationshipsLocal(rows) { writeJSON(STORAGE_RELATIONSHIPS, rows); }
function saveDistinctionsLocal(rows)  { writeJSON(STORAGE_DISTINCTIONS, rows); }
function savePersonDistinctionsLocal(rows) { writeJSON(STORAGE_PERSON_DIST, rows); }

// ─────────────────────────────────────────────────────────────────────
// Read API
// ─────────────────────────────────────────────────────────────────────

// Resolve effective photo for a person: hybrid_profiles.photo_url is the
// canonical source for non-members and the fallback for members; if a member
// has been claimed and the claimant uploaded a portrait, prefer that.
function applyClaimPhotos(people, claimRoster) {
  if (!claimRoster) return people;
  const byName = new Map(claimRoster.map((c) => [c.name, c]));
  return people.map((p) => {
    if (!p.isMember) return p;
    const c = byName.get(p.displayName);
    const claimedPhoto = c ? c.photoUrl : null;
    return { ...p, photoUrl: claimedPhoto || p.photoUrl || null };
  });
}

export async function listPeople() {
  if (!isLive()) {
    const claimRoster = await listProfilesWithPhotos();
    const people = loadPeopleLocal();
    const pds = loadPersonDistinctionsLocal();
    const dists = loadDistinctionsLocal();
    const distById = new Map(dists.map((d) => [d.id, d]));
    const withDist = people.map((p) => ({
      ...p,
      distinctions: pds
        .filter((row) => row.personId === p.id)
        .map((row) => distById.get(row.distinctionId))
        .filter(Boolean),
    }));
    return applyClaimPhotos(withDist, claimRoster);
  }

  const [
    { data: peopleRows, error: pErr },
    { data: pdRows,     error: pdErr },
    { data: distRows,   error: dErr },
    claimRoster,
  ] = await Promise.all([
    supabase.from('hybrid_profiles')
      .select('id, display_name, slug, is_member, photo_url')
      .order('id'),
    supabase.from('person_distinctions')
      .select('person_id, distinction_id'),
    supabase.from('distinctions')
      .select('id, name, short_name, icon, color, description'),
    listProfilesWithPhotos(),
  ]);
  if (pErr || pdErr || dErr) {
    logSupabaseError('listPeople failed', pErr || pdErr || dErr);
    return [];
  }
  const distById = new Map((distRows || []).map((d) => [d.id, {
    id: d.id, name: d.name, shortName: d.short_name,
    icon: d.icon, color: d.color, description: d.description,
  }]));
  const byPerson = new Map();
  for (const row of (pdRows || [])) {
    if (!byPerson.has(row.person_id)) byPerson.set(row.person_id, []);
    const d = distById.get(row.distinction_id);
    if (d) byPerson.get(row.person_id).push(d);
  }
  const people = (peopleRows || []).map((p) => ({
    id: p.id,
    displayName: p.display_name,
    slug: p.slug,
    isMember: p.is_member,
    photoUrl: p.photo_url || null,
    distinctions: byPerson.get(p.id) || [],
  }));
  return applyClaimPhotos(people, claimRoster);
}

export async function listRelationships() {
  if (!isLive()) {
    return loadRelationshipsLocal().slice();
  }
  const { data, error } = await supabase
    .from('relationships')
    .select('id, from_person, to_person, kind, note, created_at')
    .order('created_at', { ascending: true });
  if (error) { logSupabaseError('listRelationships failed', error); return []; }
  return (data || []).map((r) => ({
    id: r.id, fromId: r.from_person, toId: r.to_person,
    kind: r.kind, note: r.note || null, createdAt: r.created_at,
  }));
}

export async function listDistinctions() {
  if (!isLive()) {
    const dists = loadDistinctionsLocal();
    const pds = loadPersonDistinctionsLocal();
    return dists.map((d) => ({
      ...d,
      members: pds.filter((row) => row.distinctionId === d.id).map((row) => row.personId),
    }));
  }
  const [{ data: dists, error: dErr }, { data: pds, error: pdErr }] = await Promise.all([
    supabase.from('distinctions')
      .select('id, name, short_name, icon, color, description, created_at')
      .order('created_at', { ascending: true }),
    supabase.from('person_distinctions').select('person_id, distinction_id'),
  ]);
  if (dErr || pdErr) {
    logSupabaseError('listDistinctions failed', dErr || pdErr);
    return [];
  }
  const byDist = new Map();
  for (const row of (pds || [])) {
    if (!byDist.has(row.distinction_id)) byDist.set(row.distinction_id, []);
    byDist.get(row.distinction_id).push(row.person_id);
  }
  return (dists || []).map((d) => ({
    id: d.id, name: d.name, shortName: d.short_name,
    icon: d.icon, color: d.color, description: d.description,
    members: byDist.get(d.id) || [],
  }));
}

export async function getTree() {
  const [people, relationships, distinctions] = await Promise.all([
    listPeople(), listRelationships(), listDistinctions(),
  ]);
  return { people, relationships, distinctions };
}

export async function personBySlug(slug) {
  const tree = await getTree();
  const person = tree.people.find((p) => p.slug === slug);
  if (!person) return null;

  const byId = new Map(tree.people.map((p) => [p.id, p]));
  const inbound = tree.relationships.filter((r) => r.toId === person.id);
  const outbound = tree.relationships.filter((r) => r.fromId === person.id);

  const parentEdge = inbound.find((r) => r.kind === 'parent');
  const recruiterEdge = inbound.find((r) => r.kind === 'recruited');
  const upstream = {
    parent:    parentEdge    ? byId.get(parentEdge.fromId)    || null : null,
    recruiter: recruiterEdge ? byId.get(recruiterEdge.fromId) || null : null,
  };

  const downstream = outbound
    .filter((r) => r.kind === 'recruited')
    .map((r) => byId.get(r.toId))
    .filter(Boolean);

  const lateral = [
    ...inbound.filter((r) => r.kind === 'strava_dm').map((r) => ({
      otherPerson: byId.get(r.fromId),
      direction: 'inbound',
      note: r.note,
      edge: r,
    })),
    ...outbound.filter((r) => r.kind === 'strava_dm').map((r) => ({
      otherPerson: byId.get(r.toId),
      direction: 'outbound',
      note: r.note,
      edge: r,
    })),
  ].filter((x) => x.otherPerson);

  return { person, upstream, downstream, lateral };
}

// ─────────────────────────────────────────────────────────────────────
// Write API (admin)
// ─────────────────────────────────────────────────────────────────────
function makeResult(ok, extra) {
  return Object.assign({ ok }, extra || {});
}

export async function createPerson({ displayName, isMember = true, photoUrl = null }) {
  const trimmed = (displayName || '').trim();
  if (!trimmed) return makeResult(false, { error: 'Display name is required.' });
  const slug = slugify(trimmed);

  if (!isLive()) {
    const rows = loadPeopleLocal();
    if (rows.some((r) => r.displayName === trimmed)) {
      return makeResult(false, { error: 'A person with that name already exists.' });
    }
    if (rows.some((r) => r.slug === slug)) {
      return makeResult(false, { error: 'A person with a conflicting slug already exists.' });
    }
    const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
    const row = { id: nextId, displayName: trimmed, slug, isMember: !!isMember, photoUrl: photoUrl || null };
    rows.push(row);
    savePeopleLocal(rows);
    return makeResult(true, { person: row });
  }
  const { data, error } = await supabase.from('hybrid_profiles')
    .insert({ display_name: trimmed, slug, is_member: !!isMember, photo_url: photoUrl || null })
    .select('id, display_name, slug, is_member, photo_url')
    .single();
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { person: {
    id: data.id, displayName: data.display_name, slug: data.slug,
    isMember: data.is_member, photoUrl: data.photo_url || null,
  } });
}

export async function updatePerson(id, patch) {
  const next = {};
  if (patch.displayName !== undefined) next.displayName = (patch.displayName || '').trim();
  if (patch.isMember !== undefined)    next.isMember = !!patch.isMember;
  if (patch.photoUrl !== undefined)    next.photoUrl = patch.photoUrl || null;
  if (next.displayName !== undefined) {
    if (!next.displayName) return makeResult(false, { error: 'Display name is required.' });
    next.slug = slugify(next.displayName);
  }

  if (!isLive()) {
    const rows = loadPeopleLocal();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return makeResult(false, { error: 'Person not found.' });
    if (next.displayName !== undefined &&
        rows.some((r) => r.id !== id && r.displayName === next.displayName)) {
      return makeResult(false, { error: 'A person with that name already exists.' });
    }
    rows[idx] = { ...rows[idx], ...next };
    savePeopleLocal(rows);
    return makeResult(true, { person: rows[idx] });
  }
  const payload = {};
  if (next.displayName !== undefined) payload.display_name = next.displayName;
  if (next.slug !== undefined)        payload.slug         = next.slug;
  if (next.isMember !== undefined)    payload.is_member    = next.isMember;
  if (next.photoUrl !== undefined)    payload.photo_url    = next.photoUrl;
  const { data, error } = await supabase.from('hybrid_profiles')
    .update(payload).eq('id', id)
    .select('id, display_name, slug, is_member, photo_url').single();
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { person: {
    id: data.id, displayName: data.display_name, slug: data.slug,
    isMember: data.is_member, photoUrl: data.photo_url || null,
  } });
}

export async function deletePerson(id) {
  if (!isLive()) {
    const rows = loadPeopleLocal().filter((r) => r.id !== id);
    savePeopleLocal(rows);
    const rels = loadRelationshipsLocal().filter((r) => r.fromId !== id && r.toId !== id);
    saveRelationshipsLocal(rels);
    const pds = loadPersonDistinctionsLocal().filter((r) => r.personId !== id);
    savePersonDistinctionsLocal(pds);
    return makeResult(true);
  }
  const { error } = await supabase.from('hybrid_profiles').delete().eq('id', id);
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true);
}

export async function createRelationship({ fromId, toId, kind, note }) {
  if (!fromId || !toId) return makeResult(false, { error: 'Both endpoints are required.' });
  if (fromId === toId) return makeResult(false, { error: 'A relationship cannot loop on itself.' });
  if (!['recruited', 'parent', 'strava_dm'].includes(kind)) {
    return makeResult(false, { error: 'Unknown relationship kind.' });
  }

  if (!isLive()) {
    const rows = loadRelationshipsLocal();
    if (rows.some((r) => r.fromId === fromId && r.toId === toId && r.kind === kind)) {
      return makeResult(false, { error: 'That relationship already exists.' });
    }
    const row = { id: uid(), fromId, toId, kind, note: note || null, createdAt: new Date().toISOString() };
    rows.push(row);
    saveRelationshipsLocal(rows);
    return makeResult(true, { relationship: row });
  }
  const { data, error } = await supabase.from('relationships')
    .insert({ from_person: fromId, to_person: toId, kind, note: note || null })
    .select('id, from_person, to_person, kind, note, created_at').single();
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { relationship: {
    id: data.id, fromId: data.from_person, toId: data.to_person,
    kind: data.kind, note: data.note || null, createdAt: data.created_at,
  } });
}

export async function updateRelationship(id, patch) {
  // strava_dm kind/direction are immutable — only note may change.
  if (!isLive()) {
    const rows = loadRelationshipsLocal();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return makeResult(false, { error: 'Relationship not found.' });
    const existing = rows[idx];
    if (existing.kind === 'strava_dm' &&
        (patch.kind !== undefined || patch.fromId !== undefined || patch.toId !== undefined)) {
      return makeResult(false, { error: 'Lateral connections are immutable except for notes.' });
    }
    if (patch.note !== undefined) existing.note = patch.note || null;
    if (existing.kind !== 'strava_dm') {
      if (patch.kind !== undefined)   existing.kind   = patch.kind;
      if (patch.fromId !== undefined) existing.fromId = patch.fromId;
      if (patch.toId !== undefined)   existing.toId   = patch.toId;
    }
    rows[idx] = existing;
    saveRelationshipsLocal(rows);
    return makeResult(true, { relationship: existing });
  }
  // Fetch first to enforce the lateral-immutable rule client-side.
  const { data: existing, error: e0 } = await supabase
    .from('relationships').select('kind').eq('id', id).single();
  if (e0) return makeResult(false, { error: e0.message });
  const payload = {};
  if (patch.note !== undefined) payload.note = patch.note || null;
  if (existing.kind !== 'strava_dm') {
    if (patch.kind   !== undefined) payload.kind        = patch.kind;
    if (patch.fromId !== undefined) payload.from_person = patch.fromId;
    if (patch.toId   !== undefined) payload.to_person   = patch.toId;
  } else if (patch.kind !== undefined || patch.fromId !== undefined || patch.toId !== undefined) {
    return makeResult(false, { error: 'Lateral connections are immutable except for notes.' });
  }
  const { data, error } = await supabase.from('relationships')
    .update(payload).eq('id', id)
    .select('id, from_person, to_person, kind, note, created_at').single();
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { relationship: {
    id: data.id, fromId: data.from_person, toId: data.to_person,
    kind: data.kind, note: data.note || null, createdAt: data.created_at,
  } });
}

export async function deleteRelationship(id) {
  if (!isLive()) {
    saveRelationshipsLocal(loadRelationshipsLocal().filter((r) => r.id !== id));
    return makeResult(true);
  }
  const { error } = await supabase.from('relationships').delete().eq('id', id);
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true);
}

export async function createDistinction({ name, shortName, icon, color, description }) {
  const trimmedName = (name || '').trim();
  const trimmedShort = (shortName || '').trim();
  if (!trimmedName)  return makeResult(false, { error: 'Name is required.' });
  if (!trimmedShort) return makeResult(false, { error: 'Short name is required.' });

  if (!isLive()) {
    const rows = loadDistinctionsLocal();
    if (rows.some((r) => r.name === trimmedName)) {
      return makeResult(false, { error: 'A distinction with that name already exists.' });
    }
    const row = {
      id: uid(),
      name: trimmedName,
      shortName: trimmedShort,
      icon: icon || null,
      color: color || BAA_BLUE,
      description: description || null,
    };
    rows.push(row);
    saveDistinctionsLocal(rows);
    return makeResult(true, { distinction: row });
  }
  const { data, error } = await supabase.from('distinctions')
    .insert({
      name: trimmedName,
      short_name: trimmedShort,
      icon: icon || null,
      color: color || BAA_BLUE,
      description: description || null,
    })
    .select('id, name, short_name, icon, color, description').single();
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { distinction: {
    id: data.id, name: data.name, shortName: data.short_name,
    icon: data.icon, color: data.color, description: data.description,
  } });
}

export async function updateDistinction(id, patch) {
  const next = {};
  if (patch.name        !== undefined) next.name        = (patch.name || '').trim();
  if (patch.shortName   !== undefined) next.shortName   = (patch.shortName || '').trim();
  if (patch.icon        !== undefined) next.icon        = patch.icon || null;
  if (patch.color       !== undefined) next.color       = patch.color || BAA_BLUE;
  if (patch.description !== undefined) next.description = patch.description || null;
  if (next.name === '')      return makeResult(false, { error: 'Name is required.' });
  if (next.shortName === '') return makeResult(false, { error: 'Short name is required.' });

  if (!isLive()) {
    const rows = loadDistinctionsLocal();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return makeResult(false, { error: 'Distinction not found.' });
    if (next.name !== undefined && rows.some((r) => r.id !== id && r.name === next.name)) {
      return makeResult(false, { error: 'A distinction with that name already exists.' });
    }
    rows[idx] = { ...rows[idx], ...next };
    saveDistinctionsLocal(rows);
    return makeResult(true, { distinction: rows[idx] });
  }
  const payload = {};
  if (next.name        !== undefined) payload.name        = next.name;
  if (next.shortName   !== undefined) payload.short_name  = next.shortName;
  if (next.icon        !== undefined) payload.icon        = next.icon;
  if (next.color       !== undefined) payload.color       = next.color;
  if (next.description !== undefined) payload.description = next.description;
  const { data, error } = await supabase.from('distinctions')
    .update(payload).eq('id', id)
    .select('id, name, short_name, icon, color, description').single();
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { distinction: {
    id: data.id, name: data.name, shortName: data.short_name,
    icon: data.icon, color: data.color, description: data.description,
  } });
}

export async function deleteDistinction(id) {
  if (!isLive()) {
    saveDistinctionsLocal(loadDistinctionsLocal().filter((r) => r.id !== id));
    savePersonDistinctionsLocal(loadPersonDistinctionsLocal().filter((r) => r.distinctionId !== id));
    return makeResult(true);
  }
  const { error } = await supabase.from('distinctions').delete().eq('id', id);
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true);
}

// Bulk apply/remove. Both accept arrays of personIds; existing memberships are
// silently no-op'd on apply and silently skipped on remove.
export async function applyDistinction(personIds, distinctionId) {
  const ids = Array.from(new Set((personIds || []).filter(Boolean)));
  if (!ids.length) return makeResult(true, { applied: 0 });

  if (!isLive()) {
    const rows = loadPersonDistinctionsLocal();
    const existing = new Set(rows
      .filter((r) => r.distinctionId === distinctionId)
      .map((r) => r.personId));
    let added = 0;
    for (const personId of ids) {
      if (existing.has(personId)) continue;
      rows.push({ personId, distinctionId });
      added++;
    }
    savePersonDistinctionsLocal(rows);
    return makeResult(true, { applied: added });
  }
  const payload = ids.map((personId) => ({ person_id: personId, distinction_id: distinctionId }));
  // upsert with onConflict for the composite PK keeps re-applies idempotent.
  const { error } = await supabase.from('person_distinctions')
    .upsert(payload, { onConflict: 'person_id,distinction_id', ignoreDuplicates: true });
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { applied: ids.length });
}

export async function removeDistinction(personIds, distinctionId) {
  const ids = Array.from(new Set((personIds || []).filter(Boolean)));
  if (!ids.length) return makeResult(true, { removed: 0 });

  if (!isLive()) {
    const before = loadPersonDistinctionsLocal();
    const toRemove = new Set(ids);
    const after = before.filter((r) =>
      !(r.distinctionId === distinctionId && toRemove.has(r.personId)));
    savePersonDistinctionsLocal(after);
    return makeResult(true, { removed: before.length - after.length });
  }
  const { error, count } = await supabase.from('person_distinctions')
    .delete({ count: 'exact' })
    .eq('distinction_id', distinctionId).in('person_id', ids);
  if (error) return makeResult(false, { error: error.message });
  return makeResult(true, { removed: count || 0 });
}

// Used by the masthead subtitle "Most recent entry: <date>" — max created_at
// across the three tables. Returns ISO string or null.
export async function lastInscriptionAt() {
  if (!isLive()) {
    const rels = loadRelationshipsLocal();
    let max = null;
    for (const r of rels) {
      if (r.createdAt && (!max || r.createdAt > max)) max = r.createdAt;
    }
    return max;
  }
  const queries = await Promise.all([
    supabase.from('relationships').select('created_at').order('created_at', { ascending: false }).limit(1),
    supabase.from('distinctions').select('created_at').order('created_at', { ascending: false }).limit(1),
  ]);
  let max = null;
  for (const q of queries) {
    const t = q.data && q.data[0] && q.data[0].created_at;
    if (t && (!max || t > max)) max = t;
  }
  return max;
}
