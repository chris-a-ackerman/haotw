// PeoplePicker.jsx — searchable multi-select (or single-select) people picker.
// Lifted from the haaccount__roster pattern in AccountSheet. Used by the
// Registrar to apply distinctions, set inbound/outbound edges, and filter
// the relationships table.

import React from 'react';
import Avatar from './Avatar.jsx';

function PeoplePicker({
  people,
  value,
  onChange,
  single = false,
  placeholder = 'Search the roster…',
  excludeIds = [],
  maxHeight = 220,
}) {
  const [q, setQ] = React.useState('');

  const valueIds = React.useMemo(() => {
    if (single) return value != null ? new Set([value]) : new Set();
    return new Set(value || []);
  }, [single, value]);

  const excludeSet = React.useMemo(() => new Set(excludeIds || []), [excludeIds]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return people
      .filter((p) => !excludeSet.has(p.id))
      .filter((p) => !needle || p.displayName.toLowerCase().includes(needle));
  }, [people, q, excludeSet]);

  function toggle(id) {
    if (single) {
      onChange(valueIds.has(id) ? null : id);
      return;
    }
    const next = new Set(valueIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  return (
    <div className="hapeoplepicker">
      <div className="hapeoplepicker__search">
        <span className="hapeoplepicker__search-mark" aria-hidden="true">⌕</span>
        <input
          type="text"
          className="hapeoplepicker__search-input"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q ? (
          <button
            type="button"
            className="hapeoplepicker__search-clear"
            onClick={() => setQ('')}
            aria-label="Clear search"
          >×</button>
        ) : null}
      </div>
      <ul className="hapeoplepicker__list" style={{ maxHeight }}>
        {filtered.length === 0 ? (
          <li className="hapeoplepicker__empty">No matching names.</li>
        ) : filtered.map((p) => {
          const active = valueIds.has(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                className={'hapeoplepicker__row' + (active ? ' is-active' : '')}
                onClick={() => toggle(p.id)}
              >
                <span className="hapeoplepicker__check" aria-hidden="true">
                  {single
                    ? (active ? '◼' : '○')
                    : (active ? '☑' : '☐')}
                </span>
                <Avatar
                  name={p.displayName}
                  photoUrl={p.photoUrl}
                  size={24}
                  variant={p.isMember ? 'member' : 'nonmember'}
                />
                <span className="hapeoplepicker__name">{p.displayName}</span>
                {!p.isMember
                  ? <span className="hapeoplepicker__tag">Non-member</span>
                  : null}
              </button>
            </li>
          );
        })}
      </ul>
      {!single && valueIds.size > 0 ? (
        <div className="hapeoplepicker__count">
          {valueIds.size} selected
        </div>
      ) : null}
    </div>
  );
}

export default PeoplePicker;
