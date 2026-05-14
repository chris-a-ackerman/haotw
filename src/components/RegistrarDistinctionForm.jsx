// RegistrarDistinctionForm.jsx — modal form to Author or Amend a Distinction.
// In create mode, exposes an "Apply to" multi-select for bulk-apply at save
// time. In edit mode, the members checklist lives on the detail page; this
// form covers just the metadata.

import React from 'react';
import * as Tree from '../lib/tree.js';
import PeoplePicker from './PeoplePicker.jsx';

const BAA_BLUE = '#003DA5';

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

function RegistrarDistinctionForm({
  mode,                // 'create' | 'edit'
  initial,             // distinction row (edit only)
  people,
  onClose,
  onSaved,
}) {
  const editing = mode === 'edit' && initial;
  const [name, setName] = React.useState(editing ? initial.name : '');
  const [shortName, setShortName] = React.useState(editing ? initial.shortName : '');
  const [icon, setIcon] = React.useState(editing ? (initial.icon || '') : '');
  const [color, setColor] = React.useState(editing ? (initial.color || BAA_BLUE) : BAA_BLUE);
  const [description, setDescription] = React.useState(editing ? (initial.description || '') : '');
  const [applyTo, setApplyTo] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedShort = shortName.trim();
    if (!trimmedName) { setError('Name is required.'); return; }
    if (!trimmedShort) { setError('Short name is required.'); return; }
    setSaving(true);

    let savedId;
    if (editing) {
      const res = await Tree.updateDistinction(initial.id, {
        name: trimmedName, shortName: trimmedShort, icon: icon || null,
        color: color || BAA_BLUE, description: description || null,
      });
      if (!res.ok) { setError(res.error || 'Could not amend.'); setSaving(false); return; }
      savedId = initial.id;
    } else {
      const res = await Tree.createDistinction({
        name: trimmedName, shortName: trimmedShort, icon: icon || null,
        color: color || BAA_BLUE, description: description || null,
      });
      if (!res.ok) { setError(res.error || 'Could not author.'); setSaving(false); return; }
      savedId = res.distinction.id;
      if (applyTo.length > 0) {
        await Tree.applyDistinction(applyTo, savedId);
      }
    }

    setSaving(false);
    onSaved({ id: savedId, mode, distinction: { id: savedId, name: trimmedName, shortName: trimmedShort, icon, color, description } });
  }

  return (
    <div className="haregistrar__modal-scrim" role="presentation" onClick={(e) => {
      if (e.target.classList.contains('haregistrar__modal-scrim')) onClose();
    }}>
      <div
        className="haregistrar__modal"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Amend distinction' : 'Author a distinction'}
      >
        <header className="haregistrar__modal-head">
          <span className="haregistrar__modal-stamp">
            {editing ? 'Amendment' : 'New Distinction'}
          </span>
          <button
            type="button"
            className="haregistrar__modal-close"
            onClick={onClose}
            aria-label="Close"
          >×</button>
        </header>
        <h2 className="haregistrar__modal-title">
          {editing ? `Amend ${initial.name}` : 'Author a Distinction'}
        </h2>

        <form className="haregistrar__form" onSubmit={handleSubmit}>
          <FieldRow label="Name" hint="Full, formal form.">
            <input
              type="text"
              className="haregistrar__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2024 Sugarloaf Marathon Finisher"
              autoFocus
            />
          </FieldRow>

          <FieldRow label="Short name" hint="Used in chips and inline lists.">
            <input
              type="text"
              className="haregistrar__input"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="e.g. Sugarloaf '24 · Finisher"
            />
          </FieldRow>

          <div className="haregistrar__field-row">
            <FieldRow label="Icon" hint="Emoji or character.">
              <input
                type="text"
                className="haregistrar__input"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🏛️"
                maxLength={8}
              />
            </FieldRow>

            <FieldRow label="Color" hint="Defaults to BAA blue.">
              <div className="haregistrar__color">
                <input
                  type="color"
                  className="haregistrar__color-input"
                  value={color || BAA_BLUE}
                  onChange={(e) => setColor(e.target.value)}
                />
                <span
                  className="haregistrar__color-chip"
                  style={{ '--chip-color': color || BAA_BLUE }}
                >
                  {icon ? <span aria-hidden="true">{icon}</span> : null}
                  <span>{shortName || 'Preview'}</span>
                </span>
              </div>
            </FieldRow>
          </div>

          <FieldRow label="Description" hint="Optional. Shown in the chip popover.">
            <textarea
              className="haregistrar__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="A short note for the Registrar."
            />
          </FieldRow>

          {!editing ? (
            <FieldRow label="Apply to" hint="Bulk-applies on save.">
              <PeoplePicker
                people={people}
                value={applyTo}
                onChange={setApplyTo}
              />
            </FieldRow>
          ) : null}

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
                ? (editing ? 'Amending…' : 'Authoring…')
                : (editing ? 'Amend' : 'Author')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrarDistinctionForm;
