// RegistrarScreen.jsx — /tree/admin. The Office of the Registrar. Three tabs:
// People, Distinctions, Relationships. /tree/admin/distinctions/:id renders
// the distinction-detail page in place of the tab content.
//
// Gated by <AdminRoute>; this component assumes the visitor is authorized.

import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import * as Tree from '../lib/tree.js';
import Avatar from './Avatar.jsx';
import PeoplePicker from './PeoplePicker.jsx';
import RegistrarPersonForm from './RegistrarPersonForm.jsx';
import RegistrarDistinctionForm from './RegistrarDistinctionForm.jsx';

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

const TABS = [
  { id: 'people',        label: 'People' },
  { id: 'distinctions',  label: 'Labels' },
  { id: 'relationships', label: 'Relationships' },
];

// ---------------------------------------------------------------------------
// Typed-confirmation modal
// ---------------------------------------------------------------------------
function ExciseModal({ open, label, expected, onConfirm, onClose }) {
  const [text, setText] = React.useState('');
  React.useEffect(() => { if (!open) setText(''); }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const matches = text.trim() === expected.trim();

  return (
    <div className="haregistrar__modal-scrim" onClick={(e) => {
      if (e.target.classList.contains('haregistrar__modal-scrim')) onClose();
    }}>
      <div className="haregistrar__modal haregistrar__modal--confirm" role="dialog" aria-modal="true">
        <header className="haregistrar__modal-head">
          <span className="haregistrar__modal-stamp haregistrar__modal-stamp--warn">Excision</span>
          <button type="button" className="haregistrar__modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <h2 className="haregistrar__modal-title">Type {label} to delete from the Tree.</h2>
        <p className="haregistrar__modal-body">
          This cannot be undone. Cascades to all relationships and label memberships
          on record.
        </p>
        <input
          type="text"
          className="haregistrar__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={expected}
          autoFocus
        />
        <div className="haregistrar__modal-actions">
          <button
            type="button"
            className="haregistrar__btn haregistrar__btn--ghost"
            onClick={onClose}
          >Cancel</button>
          <button
            type="button"
            className="haregistrar__btn haregistrar__btn--danger"
            onClick={onConfirm}
            disabled={!matches}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// People tab
// ---------------------------------------------------------------------------
function PeopleTab({ people, relationships, distinctions, personDistinctionsByPersonId, onChanged, onCreateDistinctionInline, flash, setFlash }) {
  const [sortBy, setSortBy] = React.useState('name'); // 'name' | 'member' | 'dist' | 'recruits'
  const [editing, setEditing] = React.useState(null); // { mode, person? }
  const [excising, setExcising] = React.useState(null); // person row

  const recruitsByPerson = React.useMemo(() => {
    const m = new Map();
    for (const r of relationships) {
      if (r.kind !== 'recruited') continue;
      m.set(r.fromId, (m.get(r.fromId) || 0) + 1);
    }
    return m;
  }, [relationships]);

  const sorted = React.useMemo(() => {
    const rows = [...people];
    rows.sort((a, b) => {
      if (sortBy === 'member') {
        if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      }
      if (sortBy === 'dist') {
        const da = (personDistinctionsByPersonId.get(a.id) || []).length;
        const db = (personDistinctionsByPersonId.get(b.id) || []).length;
        if (da !== db) return db - da;
        return a.displayName.localeCompare(b.displayName);
      }
      if (sortBy === 'recruits') {
        const ra = recruitsByPerson.get(a.id) || 0;
        const rb = recruitsByPerson.get(b.id) || 0;
        if (ra !== rb) return rb - ra;
        return a.displayName.localeCompare(b.displayName);
      }
      return a.displayName.localeCompare(b.displayName);
    });
    return rows;
  }, [people, sortBy, personDistinctionsByPersonId, recruitsByPerson]);

  async function handleConfirmExcise() {
    if (!excising) return;
    const res = await Tree.deletePerson(excising.id);
    if (res.ok) {
      setFlash({ kind: 'ok', text: 'Deleted.' });
      await onChanged();
    } else {
      setFlash({ kind: 'err', text: res.error || 'Could not delete.' });
    }
    setExcising(null);
  }

  return (
    <section className="haregistrar__tab">
      <div className="haregistrar__tab-head">
        <div>
          <div className="haregistrar__tab-title">People on the Tree</div>
          <div className="haregistrar__tab-sub">{people.length} on record · members & non-members.</div>
        </div>
        <button
          type="button"
          className="haregistrar__btn haregistrar__btn--primary"
          onClick={() => setEditing({ mode: 'create' })}
        >+ Add a person</button>
      </div>

      {flash ? (
        <div className={'haregistrar__flash haregistrar__flash--' + flash.kind}>{flash.text}</div>
      ) : null}

      <div className="haregistrar__sortbar">
        <span>Sort by</span>
        {['name', 'member', 'dist', 'recruits'].map((s) => (
          <button
            key={s}
            type="button"
            className={'haregistrar__sortbtn' + (sortBy === s ? ' is-active' : '')}
            onClick={() => setSortBy(s)}
          >
            {s === 'name' ? 'Name' :
             s === 'member' ? 'Member' :
             s === 'dist' ? 'Labels' : 'Recruits'}
          </button>
        ))}
      </div>

      <ul className="haregistrar__table">
        {sorted.map((p) => {
          const distCount = (personDistinctionsByPersonId.get(p.id) || []).length;
          const recCount  = recruitsByPerson.get(p.id) || 0;
          return (
            <li key={p.id} className="haregistrar__trow">
              <Avatar
                name={p.displayName}
                photoUrl={p.photoUrl}
                size={32}
                variant={p.isMember ? 'member' : 'nonmember'}
                className="haregistrar__trow-portrait"
              />
              <div className="haregistrar__trow-body">
                <div className="haregistrar__trow-name">{p.displayName}</div>
                <div className="haregistrar__trow-meta">
                  <span className={'haregistrar__badge' + (p.isMember ? '' : ' haregistrar__badge--quiet')}>
                    {p.isMember ? 'Member' : 'Non-member'}
                  </span>
                  <span>{distCount} label{distCount === 1 ? '' : 's'}</span>
                  <span>{recCount} recruit{recCount === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="haregistrar__trow-actions">
                <button
                  type="button"
                  className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                  onClick={() => setEditing({ mode: 'edit', person: p })}
                >Edit</button>
                <button
                  type="button"
                  className="haregistrar__btn haregistrar__btn--danger haregistrar__btn--small"
                  onClick={() => setExcising(p)}
                >Delete</button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing ? (
        <RegistrarPersonForm
          mode={editing.mode}
          initialPerson={editing.person}
          people={people}
          relationships={relationships}
          distinctions={distinctions}
          personDistinctionsByPersonId={personDistinctionsByPersonId}
          onClose={() => setEditing(null)}
          onSaved={async ({ mode }) => {
            setEditing(null);
            setFlash({ kind: 'ok', text: mode === 'edit' ? 'Updated.' : 'Saved.' });
            await onChanged();
          }}
          onCreateDistinction={onCreateDistinctionInline}
        />
      ) : null}

      <ExciseModal
        open={!!excising}
        label="the person's name"
        expected={excising ? excising.displayName : ''}
        onClose={() => setExcising(null)}
        onConfirm={handleConfirmExcise}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Distinctions tab (list view)
// ---------------------------------------------------------------------------
function DistinctionsTab({ distinctions, onChanged, flash, setFlash, people }) {
  const [editing, setEditing] = React.useState(null); // { mode: 'create' }
  const [excising, setExcising] = React.useState(null); // distinction row

  async function handleConfirmExcise() {
    if (!excising) return;
    const res = await Tree.deleteDistinction(excising.id);
    if (res.ok) {
      setFlash({ kind: 'ok', text: 'Deleted. Members no longer bear this Distinction.' });
      await onChanged();
    } else {
      setFlash({ kind: 'err', text: res.error || 'Could not delete.' });
    }
    setExcising(null);
  }

  return (
    <section className="haregistrar__tab">
      <div className="haregistrar__tab-head">
        <div>
          <div className="haregistrar__tab-title">Labels on the Tree</div>
          <div className="haregistrar__tab-sub">{distinctions.length} authored.</div>
        </div>
        <button
          type="button"
          className="haregistrar__btn haregistrar__btn--primary"
          onClick={() => setEditing({ mode: 'create' })}
        >+ Add a label</button>
      </div>

      {flash ? (
        <div className={'haregistrar__flash haregistrar__flash--' + flash.kind}>{flash.text}</div>
      ) : null}

      <ul className="haregistrar__table">
        {distinctions.map((d) => (
          <li key={d.id} className="haregistrar__trow">
            <span
              className="haregistrar__trow-chip"
              style={{ '--chip-color': d.color || 'var(--baa-blue)' }}
              aria-hidden="true"
            >
              {d.icon ? <span>{d.icon}</span> : null}
              <span>{d.shortName}</span>
            </span>
            <div className="haregistrar__trow-body">
              <div className="haregistrar__trow-name">{d.name}</div>
              <div className="haregistrar__trow-meta">
                <span>{(d.members || []).length} member{(d.members || []).length === 1 ? '' : 's'}</span>
                {d.description ? (
                  <span className="haregistrar__trow-desc">{d.description}</span>
                ) : null}
              </div>
            </div>
            <div className="haregistrar__trow-actions">
              <Link
                to={`/tree/admin/distinctions/${d.id}`}
                className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
              >View Details</Link>
              <button
                type="button"
                className="haregistrar__btn haregistrar__btn--danger haregistrar__btn--small"
                onClick={() => setExcising(d)}
              >Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <RegistrarDistinctionForm
          mode="create"
          people={people}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setFlash({ kind: 'ok', text: 'Authored.' });
            await onChanged();
          }}
        />
      ) : null}

      <ExciseModal
        open={!!excising}
        label="the distinction's name"
        expected={excising ? excising.name : ''}
        onClose={() => setExcising(null)}
        onConfirm={handleConfirmExcise}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Distinction detail page
// ---------------------------------------------------------------------------
function DistinctionDetail({ distinctionId, distinctions, people, onChanged, flash, setFlash }) {
  const navigate = useNavigate();
  const distinction = distinctions.find((d) => d.id === distinctionId);
  const initialMembers = React.useMemo(
    () => (distinction ? (distinction.members || []) : []),
    [distinction]
  );
  const [selected, setSelected] = React.useState(initialMembers);
  const [editing, setEditing] = React.useState(false);
  const [excising, setExcising] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { setSelected(initialMembers); }, [initialMembers]);

  if (!distinction) {
    return (
      <section className="haregistrar__tab">
        <div className="haregistrar__state">Distinction not found.</div>
        <Link to="/tree/admin?tab=distinctions" className="haregistrar__btn haregistrar__btn--ghost">
          ← Labels
        </Link>
      </section>
    );
  }

  async function handleSaveMembers() {
    setSaving(true);
    const prior = new Set(initialMembers);
    const next = new Set(selected);
    const toAdd = [...next].filter((id) => !prior.has(id));
    const toRemove = [...prior].filter((id) => !next.has(id));
    if (toAdd.length) await Tree.applyDistinction(toAdd, distinction.id);
    if (toRemove.length) await Tree.removeDistinction(toRemove, distinction.id);
    setSaving(false);
    setFlash({
      kind: 'ok',
      text: `Distinction applied to ${toAdd.length} member${toAdd.length === 1 ? '' : 's'}` +
        (toRemove.length ? `; removed from ${toRemove.length}.` : '.'),
    });
    await onChanged();
  }

  async function handleConfirmExcise() {
    const res = await Tree.deleteDistinction(distinction.id);
    setExcising(false);
    if (res.ok) {
      setFlash({ kind: 'ok', text: 'Deleted. Members no longer bear this Label.' });
      await onChanged();
      navigate('/tree/admin?tab=distinctions');
    } else {
      setFlash({ kind: 'err', text: res.error || 'Could not delete.' });
    }
  }

  return (
    <section className="haregistrar__tab">
      <div className="haregistrar__tab-head">
        <div>
          <Link to="/tree/admin?tab=distinctions" className="haregistrar__crumb">
            ← Labels
          </Link>
          <div className="haregistrar__tab-title">{distinction.name}</div>
          <div className="haregistrar__tab-sub">
            <span
              className="haregistrar__trow-chip"
              style={{ '--chip-color': distinction.color || 'var(--baa-blue)' }}
            >
              {distinction.icon ? <span aria-hidden="true">{distinction.icon}</span> : null}
              <span>{distinction.shortName}</span>
            </span>
          </div>
        </div>
        <div className="haregistrar__tab-actions">
          <button
            type="button"
            className="haregistrar__btn haregistrar__btn--ghost"
            onClick={() => setEditing(true)}
          >Edit</button>
          <button
            type="button"
            className="haregistrar__btn haregistrar__btn--danger"
            onClick={() => setExcising(true)}
          >Delete</button>
        </div>
      </div>

      {distinction.description ? (
        <p className="haregistrar__detail-desc">{distinction.description}</p>
      ) : null}

      {flash ? (
        <div className={'haregistrar__flash haregistrar__flash--' + flash.kind}>{flash.text}</div>
      ) : null}

      <div className="haregistrar__detail-section">
        <div className="haregistrar__detail-label">Members</div>
        <p className="haregistrar__hint-quiet">
          Toggle inclusion and save to apply or remove in bulk.
        </p>
        <PeoplePicker
          people={people}
          value={selected}
          onChange={setSelected}
          placeholder="Search members…"
          maxHeight={300}
        />
        <div className="haregistrar__detail-actions">
          <button
            type="button"
            className="haregistrar__btn haregistrar__btn--ghost"
            onClick={() => setSelected(initialMembers)}
            disabled={saving}
          >Undo</button>
          <button
            type="button"
            className="haregistrar__btn haregistrar__btn--primary"
            onClick={handleSaveMembers}
            disabled={saving}
          >{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>

      {editing ? (
        <RegistrarDistinctionForm
          mode="edit"
          initial={distinction}
          people={people}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            setFlash({ kind: 'ok', text: 'Updated.' });
            await onChanged();
          }}
        />
      ) : null}

      <ExciseModal
        open={!!excising}
        label="the distinction's name"
        expected={distinction.name}
        onClose={() => setExcising(false)}
        onConfirm={handleConfirmExcise}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Relationships tab
// ---------------------------------------------------------------------------
function RelationshipsTab({ people, relationships, onChanged, flash, setFlash }) {
  const [filterKind, setFilterKind] = React.useState('all'); // 'all' | 'parent' | 'recruited' | 'strava_dm'
  const [filterPersonId, setFilterPersonId] = React.useState(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // { edgeId, note }
  const [adding, setAdding] = React.useState(null); // { kind, fromId, toId, note } | null

  const peopleById = React.useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const filtered = React.useMemo(() => {
    return relationships.filter((r) => {
      if (filterKind !== 'all' && r.kind !== filterKind) return false;
      if (filterPersonId != null && r.fromId !== filterPersonId && r.toId !== filterPersonId) return false;
      return true;
    });
  }, [relationships, filterKind, filterPersonId]);

  async function handleSaveNote(edge, newNote) {
    const res = await Tree.updateRelationship(edge.id, { note: newNote });
    if (res.ok) {
      setFlash({ kind: 'ok', text: 'Note saved.' });
      await onChanged();
    } else {
      setFlash({ kind: 'err', text: res.error || 'Could not save note.' });
    }
    setEditing(null);
  }

  async function handleDelete(edge) {
    if (edge.kind === 'strava_dm') {
      setFlash({ kind: 'err', text: 'Lateral connections are seeded once and cannot be deleted here.' });
      return;
    }
    const res = await Tree.deleteRelationship(edge.id);
    if (res.ok) {
      setFlash({ kind: 'ok', text: 'Deleted.' });
      await onChanged();
    } else {
      setFlash({ kind: 'err', text: res.error || 'Could not delete.' });
    }
  }

  async function handleAdd() {
    if (!adding || !adding.fromId || !adding.toId) return;
    const res = await Tree.createRelationship({
      fromId: adding.fromId, toId: adding.toId, kind: adding.kind, note: adding.note || null,
    });
    if (res.ok) {
      setFlash({ kind: 'ok', text: 'Inscribed.' });
      await onChanged();
      setAdding(null);
    } else {
      setFlash({ kind: 'err', text: res.error || 'Could not inscribe.' });
    }
  }

  return (
    <section className="haregistrar__tab">
      <div className="haregistrar__tab-head">
        <div>
          <div className="haregistrar__tab-title">Relationships</div>
          <div className="haregistrar__tab-sub">
            {relationships.length} edges on record. Lateral connections are seeded once.
          </div>
        </div>
        <button
          type="button"
          className="haregistrar__btn haregistrar__btn--primary"
          onClick={() => setAdding({ kind: 'recruited', fromId: null, toId: null, note: '' })}
        >+ Add a relationship</button>
      </div>

      {flash ? (
        <div className={'haregistrar__flash haregistrar__flash--' + flash.kind}>{flash.text}</div>
      ) : null}

      <div className="haregistrar__sortbar">
        <span>Filter</span>
        {['all', 'parent', 'recruited', 'strava_dm'].map((k) => (
          <button
            key={k}
            type="button"
            className={'haregistrar__sortbtn' + (filterKind === k ? ' is-active' : '')}
            onClick={() => setFilterKind(k)}
          >
            {k === 'all' ? 'All' : k === 'strava_dm' ? 'Strava DM' : k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
        <button
          type="button"
          className={'haregistrar__sortbtn' + (filterPersonId ? ' is-active' : '')}
          onClick={() => setFilterOpen((v) => !v)}
        >
          {filterPersonId
            ? `Person: ${peopleById.get(filterPersonId)?.displayName || '?'}`
            : 'By person'}
        </button>
        {filterPersonId ? (
          <button
            type="button"
            className="haregistrar__sortbtn"
            onClick={() => setFilterPersonId(null)}
          >Clear</button>
        ) : null}
      </div>

      {filterOpen ? (
        <div className="haregistrar__filter-picker">
          <PeoplePicker
            people={people}
            single
            value={filterPersonId}
            onChange={(id) => { setFilterPersonId(id); setFilterOpen(false); }}
            placeholder="Filter by person…"
          />
        </div>
      ) : null}

      <ul className="haregistrar__table">
        {filtered.length === 0 ? (
          <li className="haregistrar__empty">No edges match this filter.</li>
        ) : filtered.map((r) => {
          const from = peopleById.get(r.fromId);
          const to   = peopleById.get(r.toId);
          const isEditing = editing && editing.edgeId === r.id;
          const isLateral = r.kind === 'strava_dm';
          return (
            <li key={r.id} className="haregistrar__trow haregistrar__trow--edge">
              <span className="haregistrar__edge-pair">
                <span className="haregistrar__edge-name">{from?.displayName || '?'}</span>
                <span className="haregistrar__edge-arrow" aria-hidden="true">→</span>
                <span className="haregistrar__edge-name">{to?.displayName || '?'}</span>
              </span>
              <span className={'haregistrar__badge haregistrar__badge--kind haregistrar__badge--' + r.kind}>
                {r.kind}
                {isLateral ? ' · read-only' : ''}
              </span>
              <div className="haregistrar__edge-note">
                {isEditing ? (
                  <input
                    type="text"
                    className="haregistrar__input haregistrar__input--inline"
                    autoFocus
                    value={editing.note}
                    onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNote(r, editing.note);
                      if (e.key === 'Escape') setEditing(null);
                    }}
                  />
                ) : (
                  <span className="haregistrar__edge-note-text">
                    {r.note || <em className="haregistrar__hint-quiet">no note</em>}
                  </span>
                )}
              </div>
              <div className="haregistrar__trow-actions">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                      onClick={() => setEditing(null)}
                    >Cancel</button>
                    <button
                      type="button"
                      className="haregistrar__btn haregistrar__btn--primary haregistrar__btn--small"
                      onClick={() => handleSaveNote(r, editing.note)}
                    >Save</button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                      onClick={() => setEditing({ edgeId: r.id, note: r.note || '' })}
                    >Add Note</button>
                    {!isLateral ? (
                      <button
                        type="button"
                        className="haregistrar__btn haregistrar__btn--danger haregistrar__btn--small"
                        onClick={() => handleDelete(r)}
                      >Delete</button>
                    ) : null}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="haregistrar__modal-scrim" onClick={(e) => {
          if (e.target.classList.contains('haregistrar__modal-scrim')) setAdding(null);
        }}>
          <div className="haregistrar__modal" role="dialog" aria-modal="true">
            <header className="haregistrar__modal-head">
              <span className="haregistrar__modal-stamp">New Edge</span>
              <button type="button" className="haregistrar__modal-close" onClick={() => setAdding(null)} aria-label="Close">×</button>
            </header>
            <h2 className="haregistrar__modal-title">Inscribe a Relationship</h2>

            <div className="haregistrar__form">
              <div className="haregistrar__field">
                <label className="haregistrar__label"><span>Kind</span></label>
                <div className="haregistrar__sortbar haregistrar__sortbar--inline">
                  {['recruited', 'parent'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={'haregistrar__sortbtn' + (adding.kind === k ? ' is-active' : '')}
                      onClick={() => setAdding({ ...adding, kind: k })}
                    >{k}</button>
                  ))}
                </div>
              </div>

              <div className="haregistrar__field">
                <label className="haregistrar__label">
                  <span>From person</span>
                  <span className="haregistrar__label-hint">Source of the edge.</span>
                </label>
                <PeoplePicker
                  people={people}
                  single
                  value={adding.fromId}
                  onChange={(id) => setAdding({ ...adding, fromId: id })}
                  placeholder="Search for the source…"
                  maxHeight={160}
                />
              </div>

              <div className="haregistrar__field">
                <label className="haregistrar__label">
                  <span>To person</span>
                  <span className="haregistrar__label-hint">Recipient of the edge.</span>
                </label>
                <PeoplePicker
                  people={people}
                  single
                  value={adding.toId}
                  onChange={(id) => setAdding({ ...adding, toId: id })}
                  excludeIds={adding.fromId ? [adding.fromId] : []}
                  placeholder="Search for the recipient…"
                  maxHeight={160}
                />
              </div>

              <div className="haregistrar__field">
                <label className="haregistrar__label"><span>Note (optional)</span></label>
                <input
                  type="text"
                  className="haregistrar__input"
                  value={adding.note}
                  onChange={(e) => setAdding({ ...adding, note: e.target.value })}
                />
              </div>

              <div className="haregistrar__modal-actions">
                <button type="button" className="haregistrar__btn haregistrar__btn--ghost" onClick={() => setAdding(null)}>Cancel</button>
                <button type="button" className="haregistrar__btn haregistrar__btn--primary" onClick={handleAdd} disabled={!adding.fromId || !adding.toId}>Inscribe</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function RegistrarScreen() {
  const { id: distinctionRouteId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { treeBundle, refreshTree } = useAppContext();
  const [flash, setFlash] = React.useState(null);
  // Stacked-modal handle: when the PersonForm wants to author a new distinction
  // inline, it provides a callback that should be called with the new
  // distinction so the picker can auto-select it.
  const [inlineDistinction, setInlineDistinction] = React.useState(null); // { onCreated }

  // Auto-dismiss flash after 4s.
  React.useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const tabParam = searchParams.get('tab') || 'people';
  const activeTab = distinctionRouteId
    ? 'distinction-detail'
    : (TABS.find((t) => t.id === tabParam) ? tabParam : 'people');

  const people = treeBundle ? treeBundle.people : [];
  const relationships = treeBundle ? treeBundle.relationships : [];
  const distinctions  = treeBundle ? treeBundle.distinctions  : [];

  const personDistinctionsByPersonId = React.useMemo(() => {
    const m = new Map();
    for (const d of distinctions) {
      for (const personId of (d.members || [])) {
        if (!m.has(personId)) m.set(personId, []);
        m.get(personId).push(d.id);
      }
    }
    return m;
  }, [distinctions]);

  function setTab(tabId) {
    setSearchParams(tabId === 'people' ? {} : { tab: tabId }, { replace: false });
  }

  if (!treeBundle) {
    return (
      <main className="haregistrar">
        <header className="haregistrar__masthead">
          <Link to="/tree" className="haregistrar__back">
            <span className="haregistrar__back-arrow" aria-hidden="true">←</span>
            <span>Coaching Tree</span>
          </Link>
          <span className="haregistrar__wordmark-text">Office of the Registrar</span>
          <span className="haregistrar__folio-r">Admin</span>
        </header>
        <div className="haregistrar__state">The Registrar is consulting the tree.</div>
      </main>
    );
  }

  return (
    <main className="haregistrar">
      <header className="haregistrar__masthead">
        <Link to="/tree" className="haregistrar__back">
          <span className="haregistrar__back-arrow" aria-hidden="true">←</span>
          <span>Coaching Tree</span>
        </Link>
        <span className="haregistrar__wordmark-text">Office of the Registrar</span>
        <span className="haregistrar__folio-r">Admin</span>
      </header>

      <header className="haregistrar__header">
        <div className="haregistrar__overline haregistrar__rise" {...delay(0)}>
          <span className="haregistrar__overline-tick" aria-hidden="true">§</span>
          <span>Office of the Registrar</span>
        </div>
        <h1 className="haregistrar__title haregistrar__rise" {...delay(120)}>Administration</h1>
        <p className="haregistrar__subtitle haregistrar__rise" {...delay(220)}>
          Creating, editing, and deleting of records.
        </p>
      </header>

      <hr className="haregistrar__rule haregistrar__rule--banner haregistrar__draw" {...delay(320)} />

      {!distinctionRouteId ? (
        <nav className="haregistrar__tabs haregistrar__rise" {...delay(380)}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={'haregistrar__tabbtn' + (activeTab === t.id ? ' is-active' : '')}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </nav>
      ) : null}

      {activeTab === 'people' ? (
        <PeopleTab
          people={people}
          relationships={relationships}
          distinctions={distinctions}
          personDistinctionsByPersonId={personDistinctionsByPersonId}
          flash={flash}
          setFlash={setFlash}
          onChanged={refreshTree}
          onCreateDistinctionInline={(onCreated) => setInlineDistinction({ onCreated })}
        />
      ) : activeTab === 'distinctions' ? (
        <DistinctionsTab
          distinctions={distinctions}
          people={people}
          flash={flash}
          setFlash={setFlash}
          onChanged={refreshTree}
        />
      ) : activeTab === 'relationships' ? (
        <RelationshipsTab
          people={people}
          relationships={relationships}
          flash={flash}
          setFlash={setFlash}
          onChanged={refreshTree}
        />
      ) : activeTab === 'distinction-detail' ? (
        <DistinctionDetail
          distinctionId={distinctionRouteId}
          distinctions={distinctions}
          people={people}
          flash={flash}
          setFlash={setFlash}
          onChanged={refreshTree}
        />
      ) : null}

      {inlineDistinction ? (
        <RegistrarDistinctionForm
          mode="create"
          people={people}
          onClose={() => setInlineDistinction(null)}
          onSaved={async ({ distinction }) => {
            inlineDistinction.onCreated(distinction);
            setInlineDistinction(null);
            setFlash({ kind: 'ok', text: 'Authored.' });
            await refreshTree();
          }}
        />
      ) : null}

      <footer className="haregistrar__foot">
        <span>Office of the Registrar</span>
        <span>Administration</span>
      </footer>
    </main>
  );
}

export default RegistrarScreen;
