// RegistrarPersonForm.jsx — modal form to Inscribe or Amend a person.
// Used by the Registrar's People tab. Fields:
//   - Display name (required)
//   - Is member toggle
//   - Photo URL (optional; URL-only in v1, mirroring the Distinction icon stance)
//   - Distinctions (multi-select against existing labels; "+ New Distinction"
//     opens DistinctionForm in a stacked modal without losing form state)
//   - Inbound relationships: (kind, from_person) rows, kind in {parent, recruited}
//   - Outbound recruited relationships: (to_person) rows, kind fixed to recruited
//
// On submit: creates/updates the person, then sequentially applies the edge
// and distinction diffs against the existing edges/memberships.

import React from 'react';
import * as Tree from '../lib/tree.js';
import PeoplePicker from './PeoplePicker.jsx';

function FieldRow({ label, hint, children, error }) {
  return (
    <div className="haregistrar__field">
      <label className="haregistrar__label">
        <span>{label}</span>
        {hint ? <span className="haregistrar__label-hint">{hint}</span> : null}
      </label>
      {children}
      {error ? <div className="haregistrar__error">{error}</div> : null}
    </div>
  );
}

function relsToInbound(relationships, personId) {
  return relationships
    .filter((r) => r.toId === personId && (r.kind === 'parent' || r.kind === 'recruited'))
    .map((r) => ({ fromId: r.fromId, kind: r.kind, edgeId: r.id }));
}
function relsToOutbound(relationships, personId) {
  return relationships
    .filter((r) => r.fromId === personId && r.kind === 'recruited')
    .map((r) => ({ toId: r.toId, kind: 'recruited', edgeId: r.id }));
}

function RegistrarPersonForm({
  mode,                 // 'create' | 'edit'
  initialPerson,        // person row (edit only)
  people,
  relationships,
  distinctions,
  personDistinctionsByPersonId, // Map<personId, distinctionId[]>
  onClose,
  onSaved,
  onCreateDistinction,  // opens DistinctionForm stacked
}) {
  const editing = mode === 'edit' && initialPerson;
  const [displayName, setDisplayName] = React.useState(editing ? initialPerson.displayName : '');
  const [isMember, setIsMember] = React.useState(editing ? initialPerson.isMember : true);
  const [photoUrl, setPhotoUrl] = React.useState(editing ? (initialPerson.photoUrl || '') : '');
  const [selectedDistinctionIds, setSelectedDistinctionIds] = React.useState(
    editing ? (personDistinctionsByPersonId.get(initialPerson.id) || []) : []
  );
  const [inbound, setInbound] = React.useState(
    editing ? relsToInbound(relationships, initialPerson.id) : []
  );
  const [outbound, setOutbound] = React.useState(
    editing ? relsToOutbound(relationships, initialPerson.id) : []
  );
  const [error, setError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [edgeOpen, setEdgeOpen] = React.useState(null); // { kind, side } when picker open
  const [distOpen, setDistOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const excludeIdForEdges = editing ? [initialPerson.id] : [];

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const trimmed = displayName.trim();
    if (!trimmed) { setError('Display name is required.'); return; }
    setSaving(true);

    let personId;
    if (editing) {
      const res = await Tree.updatePerson(initialPerson.id, {
        displayName: trimmed, isMember, photoUrl: photoUrl.trim() || null,
      });
      if (!res.ok) { setError(res.error || 'Could not amend.'); setSaving(false); return; }
      personId = initialPerson.id;
    } else {
      const res = await Tree.createPerson({
        displayName: trimmed, isMember, photoUrl: photoUrl.trim() || null,
      });
      if (!res.ok) { setError(res.error || 'Could not inscribe.'); setSaving(false); return; }
      personId = res.person.id;
    }

    // Sync distinctions: compute add/remove against the prior set.
    const priorDist = new Set(editing ? (personDistinctionsByPersonId.get(initialPerson.id) || []) : []);
    const nextDist = new Set(selectedDistinctionIds);
    const toAdd = [...nextDist].filter((d) => !priorDist.has(d));
    const toRemove = [...priorDist].filter((d) => !nextDist.has(d));
    for (const d of toAdd) {
      await Tree.applyDistinction([personId], d);
    }
    for (const d of toRemove) {
      await Tree.removeDistinction([personId], d);
    }

    // Sync inbound edges: compute add/remove against the prior set.
    const priorInbound = editing ? relsToInbound(relationships, initialPerson.id) : [];
    const inboundKey = (r) => `${r.kind}::${r.fromId}`;
    const priorInbMap = new Map(priorInbound.map((r) => [inboundKey(r), r]));
    const nextInbMap  = new Map(inbound.map((r) => [inboundKey(r), r]));
    for (const [k, r] of nextInbMap) {
      if (!priorInbMap.has(k)) {
        await Tree.createRelationship({ fromId: r.fromId, toId: personId, kind: r.kind });
      }
    }
    for (const [k, r] of priorInbMap) {
      if (!nextInbMap.has(k) && r.edgeId) {
        await Tree.deleteRelationship(r.edgeId);
      }
    }

    // Sync outbound recruited edges similarly.
    const priorOutbound = editing ? relsToOutbound(relationships, initialPerson.id) : [];
    const outboundKey = (r) => `recruited::${r.toId}`;
    const priorOutMap = new Map(priorOutbound.map((r) => [outboundKey(r), r]));
    const nextOutMap  = new Map(outbound.map((r) => [outboundKey(r), r]));
    for (const [k, r] of nextOutMap) {
      if (!priorOutMap.has(k)) {
        await Tree.createRelationship({ fromId: personId, toId: r.toId, kind: 'recruited' });
      }
    }
    for (const [k, r] of priorOutMap) {
      if (!nextOutMap.has(k) && r.edgeId) {
        await Tree.deleteRelationship(r.edgeId);
      }
    }

    setSaving(false);
    onSaved({ id: personId, mode });
  }

  function addInbound(kind) {
    setInbound((prev) => [...prev, { kind, fromId: null }]);
    setEdgeOpen({ kind: 'inbound', index: inbound.length });
  }
  function updateInbound(i, patch) {
    setInbound((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeInbound(i) {
    setInbound((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addOutbound() {
    setOutbound((prev) => [...prev, { kind: 'recruited', toId: null }]);
  }
  function updateOutbound(i, patch) {
    setOutbound((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeOutbound(i) {
    setOutbound((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="haregistrar__modal-scrim" role="presentation" onClick={(e) => {
      if (e.target.classList.contains('haregistrar__modal-scrim')) onClose();
    }}>
      <div
        className="haregistrar__modal haregistrar__modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Amend person' : 'Inscribe a person'}
      >
        <header className="haregistrar__modal-head">
          <span className="haregistrar__modal-stamp">
            {editing ? 'Amendment' : 'New Inscription'}
          </span>
          <button
            type="button"
            className="haregistrar__modal-close"
            onClick={onClose}
            aria-label="Close"
          >×</button>
        </header>
        <h2 className="haregistrar__modal-title">
          {editing ? `Amend ${initialPerson.displayName}` : 'Inscribe a Person'}
        </h2>

        <form className="haregistrar__form" onSubmit={handleSubmit}>
          <FieldRow label="Display name" hint="Plain form (e.g. “Will Clifford”)">
            <input
              type="text"
              className="haregistrar__input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="First Last"
              autoFocus
            />
          </FieldRow>

          <FieldRow label="Member of the Hybrid Athletes?">
            <label className="haregistrar__toggle">
              <input
                type="checkbox"
                checked={isMember}
                onChange={(e) => setIsMember(e.target.checked)}
              />
              <span>{isMember ? 'Member' : 'Non-member'}</span>
            </label>
          </FieldRow>

          <FieldRow label="Photo URL" hint="Optional. Image upload not yet wired.">
            <input
              type="url"
              className="haregistrar__input"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
            />
          </FieldRow>

          <FieldRow label="Distinctions" hint="Multi-select.">
            <div className="haregistrar__dist-bar">
              {distinctions.length === 0 ? (
                <span className="haregistrar__hint-quiet">No distinctions on record yet.</span>
              ) : (
                <ul className="haregistrar__dist-options">
                  {distinctions.map((d) => {
                    const active = selectedDistinctionIds.includes(d.id);
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          className={'haregistrar__dist-chip' + (active ? ' is-active' : '')}
                          style={{ '--chip-color': d.color || 'var(--baa-blue)' }}
                          onClick={() => setSelectedDistinctionIds((prev) =>
                            active ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                          )}
                        >
                          {d.icon ? <span aria-hidden="true">{d.icon}</span> : null}
                          <span>{d.shortName}</span>
                          <span aria-hidden="true" className="haregistrar__dist-chip-check">
                            {active ? '✓' : '+'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                type="button"
                className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                onClick={() => onCreateDistinction((newDist) => {
                  if (newDist && newDist.id) {
                    setSelectedDistinctionIds((prev) => [...prev, newDist.id]);
                  }
                })}
              >
                + New Distinction
              </button>
            </div>
          </FieldRow>

          <FieldRow label="Inbound relationships" hint="Who brought this person into the Tree.">
            <div className="haregistrar__edge-list">
              {inbound.length === 0 ? (
                <span className="haregistrar__hint-quiet">No inbound edges. Add one if applicable.</span>
              ) : inbound.map((r, i) => (
                <div key={i} className="haregistrar__edge-row">
                  <select
                    className="haregistrar__select"
                    value={r.kind}
                    onChange={(e) => updateInbound(i, { kind: e.target.value })}
                  >
                    <option value="recruited">recruited</option>
                    <option value="parent">parent</option>
                  </select>
                  <button
                    type="button"
                    className="haregistrar__edge-target"
                    onClick={() => setEdgeOpen({ side: 'inbound', index: i })}
                  >
                    {r.fromId
                      ? people.find((p) => p.id === r.fromId)?.displayName || 'Choose person…'
                      : 'Choose person…'}
                  </button>
                  <button
                    type="button"
                    className="haregistrar__edge-remove"
                    onClick={() => removeInbound(i)}
                    aria-label="Remove edge"
                  >×</button>
                  {edgeOpen && edgeOpen.side === 'inbound' && edgeOpen.index === i ? (
                    <div className="haregistrar__edge-picker">
                      <PeoplePicker
                        people={people}
                        single
                        value={r.fromId}
                        onChange={(id) => { updateInbound(i, { fromId: id }); setEdgeOpen(null); }}
                        excludeIds={excludeIdForEdges}
                        placeholder="Search for the source person…"
                      />
                      <button
                        type="button"
                        className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                        onClick={() => setEdgeOpen(null)}
                      >Done</button>
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="haregistrar__edge-actions">
                <button
                  type="button"
                  className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                  onClick={() => addInbound('recruited')}
                >+ Add recruiter</button>
                <button
                  type="button"
                  className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                  onClick={() => addInbound('parent')}
                >+ Add parent</button>
              </div>
            </div>
          </FieldRow>

          <FieldRow label="Outbound recruited" hint="People this person has brought into the Hybrid Athletes.">
            <div className="haregistrar__edge-list">
              {outbound.length === 0 ? (
                <span className="haregistrar__hint-quiet">No recruits on record.</span>
              ) : outbound.map((r, i) => (
                <div key={i} className="haregistrar__edge-row">
                  <span className="haregistrar__edge-kind">recruited</span>
                  <button
                    type="button"
                    className="haregistrar__edge-target"
                    onClick={() => setEdgeOpen({ side: 'outbound', index: i })}
                  >
                    {r.toId
                      ? people.find((p) => p.id === r.toId)?.displayName || 'Choose person…'
                      : 'Choose person…'}
                  </button>
                  <button
                    type="button"
                    className="haregistrar__edge-remove"
                    onClick={() => removeOutbound(i)}
                    aria-label="Remove edge"
                  >×</button>
                  {edgeOpen && edgeOpen.side === 'outbound' && edgeOpen.index === i ? (
                    <div className="haregistrar__edge-picker">
                      <PeoplePicker
                        people={people}
                        single
                        value={r.toId}
                        onChange={(id) => { updateOutbound(i, { toId: id }); setEdgeOpen(null); }}
                        excludeIds={excludeIdForEdges}
                        placeholder="Search for the recruit…"
                      />
                      <button
                        type="button"
                        className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                        onClick={() => setEdgeOpen(null)}
                      >Done</button>
                    </div>
                  ) : null}
                </div>
              ))}
              <div className="haregistrar__edge-actions">
                <button
                  type="button"
                  className="haregistrar__btn haregistrar__btn--ghost haregistrar__btn--small"
                  onClick={addOutbound}
                >+ Add recruit</button>
              </div>
            </div>
          </FieldRow>

          {error ? <div className="haregistrar__error haregistrar__error--banner">{error}</div> : null}

          <div className="haregistrar__modal-actions">
            <button
              type="button"
              className="haregistrar__btn haregistrar__btn--ghost"
              onClick={onClose}
              disabled={saving}
            >Cancel</button>
            <button
              type="submit"
              className="haregistrar__btn haregistrar__btn--primary"
              disabled={saving}
            >
              {saving
                ? (editing ? 'Amending…' : 'Inscribing…')
                : (editing ? 'Amend' : 'Inscribe')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarPersonForm;
