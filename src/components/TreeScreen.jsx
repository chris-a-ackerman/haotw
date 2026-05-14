// TreeScreen.jsx — /tree. The Coaching Tree, top-down indented from the roots.
// Read-only for everyone. Plain display names (e.g. "Will Clifford"), per the
// spec's plain-names rule for tree contexts.
//
// Layout: masthead, title block, then a vertically scrolling indented tree
// built from getTree(). The four mothers anchor the tree; three of them
// (Linda L., Laura D., Allison B.) share a "Troubled Soles Run Club" visual
// group bracket. The Paul ↔ Jake strava_dm edge renders as a horizontal
// dashed connector with a tracked-caps annotation.
//
// Interaction:
//   - Tap a member row → /tree/:slug
//   - Tap a non-member row → expands a NonMemberTile inline (one open at a time)
//   - Tap a distinction chip → opens a popover listing bearers
//   - Tap the chevron on a row with deeper recruits → expand/collapse subtree

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import Avatar from './Avatar.jsx';

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

const TSRC_NAME = 'Troubled Soles Run Club — Franklin, MA';

function ChipList({ distinctions, onChipClick }) {
  if (!distinctions || distinctions.length === 0) return null;
  return (
    <ul className="hatree__chips">
      {distinctions.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            className="hatree__chip"
            style={{ '--chip-color': d.color || 'var(--baa-blue)' }}
            onClick={(e) => {
              e.stopPropagation();
              onChipClick(d, e.currentTarget);
            }}
            aria-label={`Distinction: ${d.name}`}
          >
            {d.icon ? <span className="hatree__chip-icon" aria-hidden="true">{d.icon}</span> : null}
            <span className="hatree__chip-text">{d.shortName}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function BroughtLine({ parent, recruiter }) {
  if (!parent && !recruiter) return null;
  if (parent && recruiter) {
    return (
      <p className="hatree__brought">
        Brought to the Tree by <em>{parent.displayName}</em>, introduced to the
        Hybrid Athletes by <em>{recruiter.displayName}</em>.
      </p>
    );
  }
  const by = parent || recruiter;
  return (
    <p className="hatree__brought">
      Brought to the Tree by <em>{by.displayName}</em>.
    </p>
  );
}

function ChevronToggle({ open, count, onClick }) {
  return (
    <button
      type="button"
      className={'hatree__chev' + (open ? ' is-open' : '')}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={open ? 'Collapse branch' : 'Expand branch'}
    >
      <span className="hatree__chev-icon" aria-hidden="true">{open ? '▾' : '▸'}</span>
      {!open && count > 0 ? <span className="hatree__chev-count">+{count} below</span> : null}
    </button>
  );
}

function TreeRow({
  person,
  depth,
  parent,
  recruiter,
  hasChildren,
  childCount,
  expanded,
  onToggle,
  onChipClick,
  onMemberTap,
  onNonMemberTap,
  isOpenTile,
  lateralLabel,
}) {
  const variant = person.isMember ? 'member' : 'nonmember';
  const isClickable = true;

  const handleClick = () => {
    if (person.isMember) onMemberTap(person);
    else onNonMemberTap(person);
  };

  return (
    <div
      className={
        'hatree__row' +
        (person.isMember ? ' hatree__row--member' : ' hatree__row--nonmember') +
        (isOpenTile ? ' is-tile-open' : '')
      }
      style={{ '--depth': depth }}
    >
      <div className="hatree__row-rule" aria-hidden="true" />
      <button
        type="button"
        className="hatree__row-tap"
        onClick={handleClick}
        aria-label={
          person.isMember
            ? `View lineage of ${person.displayName}`
            : `Open details for ${person.displayName}`
        }
      >
        <Avatar
          name={person.displayName}
          photoUrl={person.photoUrl}
          size={36}
          variant={variant}
          className="hatree__row-portrait"
        />
        <div className="hatree__row-body">
          <div className="hatree__row-head">
            <span className="hatree__row-name">{person.displayName}</span>
            {!person.isMember
              ? <span className="hatree__row-tag">Non-member</span>
              : null}
          </div>
          <ChipList distinctions={person.distinctions} onChipClick={onChipClick} />
          <BroughtLine parent={parent} recruiter={recruiter} />
          {lateralLabel ? <div className="hatree__lateral-label">{lateralLabel}</div> : null}
        </div>
      </button>
      {hasChildren ? (
        <ChevronToggle open={expanded} count={childCount} onClick={onToggle} />
      ) : null}
    </div>
  );
}

function NonMemberTile({ person, parentChildrenByPersonId, disciplesByPersonId, peopleById }) {
  const children = parentChildrenByPersonId.get(person.id) || [];
  const disciples = disciplesByPersonId.get(person.id) || [];
  const inTsrc = (person.distinctions || []).some((d) => d.name === TSRC_NAME);
  return (
    <div className="hatree__tile">
      <div className="hatree__tile-head">
        <Avatar
          name={person.displayName}
          photoUrl={person.photoUrl}
          size={64}
          variant="nonmember"
        />
        <div className="hatree__tile-meta">
          <span className="hatree__tile-overline">Non-member · Inscribed in the Tree</span>
          <span className="hatree__tile-name">{person.displayName}</span>
          <span className="hatree__tile-sub">
            {inTsrc
              ? 'Member of Troubled Soles Run Club — Franklin, MA.'
              : children.length === 1
                ? `Mother of ${children[0].displayName}.`
                : 'Inscribed in the Tree.'}
          </span>
        </div>
      </div>
      {children.length > 0 ? (
        <div className="hatree__tile-section">
          <span className="hatree__tile-section-label">Mother of</span>
          <ul className="hatree__tile-list">
            {children.map((c) => (
              <li key={c.id}>
                <Link to={`/tree/${c.slug}`} state={{ from: 'tree' }} className="hatree__tile-link">
                  {c.displayName} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {disciples.length > 0 ? (
        <div className="hatree__tile-section">
          <span className="hatree__tile-section-label">Disciples introduced to the Tree</span>
          <ul className="hatree__tile-list">
            {disciples.map((d) => (
              <li key={d.id}>
                <Link to={`/tree/${d.slug}`} state={{ from: 'tree' }} className="hatree__tile-link">
                  {d.displayName} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DistinctionPopover({ anchor, distinction, peopleByDistinction, onClose, onPickMember, onPickNonMember }) {
  const popRef = React.useRef(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const popWidth = 260;
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - popWidth / 2),
      window.innerWidth - popWidth - 8
    );
    setPos({ top: rect.bottom + 8, left });
  }, [anchor]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => {
      if (popRef.current && !popRef.current.contains(e.target) && !anchor.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [anchor, onClose]);

  if (!distinction) return null;
  const bearers = peopleByDistinction.get(distinction.id) || [];

  return (
    <div
      className="hatree__popover"
      role="dialog"
      aria-label={`Bearers of ${distinction.name}`}
      style={pos}
      ref={popRef}
    >
      <div className="hatree__popover-head">
        <span
          className="hatree__popover-chip"
          style={{ '--chip-color': distinction.color || 'var(--baa-blue)' }}
        >
          {distinction.icon ? <span aria-hidden="true">{distinction.icon}</span> : null}
          <span>{distinction.shortName}</span>
        </span>
        <button
          type="button"
          className="hatree__popover-close"
          onClick={onClose}
          aria-label="Close"
        >×</button>
      </div>
      <div className="hatree__popover-title">{distinction.name}</div>
      {distinction.description ? (
        <p className="hatree__popover-desc">{distinction.description}</p>
      ) : null}
      <ul className="hatree__popover-list">
        {bearers.length === 0 ? (
          <li className="hatree__popover-empty">No bearers on record.</li>
        ) : bearers.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className="hatree__popover-row"
              onClick={() => {
                onClose();
                if (p.isMember) onPickMember(p);
                else onPickNonMember(p);
              }}
            >
              <Avatar
                name={p.displayName}
                photoUrl={p.photoUrl}
                size={24}
                variant={p.isMember ? 'member' : 'nonmember'}
              />
              <span className="hatree__popover-name">{p.displayName}</span>
              {!p.isMember ? <span className="hatree__popover-tag">Non-member</span> : null}
              <span className="hatree__popover-arrow" aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function TreeScreen() {
  const { treeBundle, refreshTree } = useAppContext();
  const navigate = useNavigate();
  const [loadingError, setLoadingError] = React.useState(false);
  const [openTileId, setOpenTileId] = React.useState(null);
  const [collapsed, setCollapsed] = React.useState(() => new Set()); // person ids whose subtree is hidden
  const [popover, setPopover] = React.useState(null); // { distinction, anchor }

  React.useEffect(() => {
    // The shell preloads treeBundle on sign-in; this effect makes sure a
    // direct deep-link to /tree fetches even before the shell has finished.
    if (!treeBundle) {
      refreshTree().catch(() => setLoadingError(true));
    }
  }, [treeBundle, refreshTree]);

  const today = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }, []);

  if (loadingError) {
    return (
      <main className="hatree">
        <header className="hatree__masthead">
          <Link to="/" className="hatree__back">
            <span className="hatree__back-arrow" aria-hidden="true">←</span>
            <span>Home</span>
          </Link>
          <span className="hatree__wordmark-text">Hybrid Athletes</span>
          <span className="hatree__folio-r">Tree</span>
        </header>
        <div className="hatree__state">
          The tree is temporarily inaccessible. The Registrar has been notified.
        </div>
      </main>
    );
  }

  if (!treeBundle) {
    return (
      <main className="hatree">
        <header className="hatree__masthead">
          <Link to="/" className="hatree__back">
            <span className="hatree__back-arrow" aria-hidden="true">←</span>
            <span>Home</span>
          </Link>
          <span className="hatree__wordmark-text">Hybrid Athletes</span>
          <span className="hatree__folio-r">Tree</span>
        </header>
        <div className="hatree__state">The Registrar is consulting the tree.</div>
      </main>
    );
  }

  const { people, relationships, distinctions } = treeBundle;
  const peopleById = new Map(people.map((p) => [p.id, p]));

  const inboundByTo = new Map();
  const outboundByFrom = new Map();
  for (const r of relationships) {
    if (!inboundByTo.has(r.toId)) inboundByTo.set(r.toId, []);
    inboundByTo.get(r.toId).push(r);
    if (!outboundByFrom.has(r.fromId)) outboundByFrom.set(r.fromId, []);
    outboundByFrom.get(r.fromId).push(r);
  }

  function inboundOfKind(personId, kind) {
    return (inboundByTo.get(personId) || []).filter((r) => r.kind === kind);
  }
  function recruitedChildren(personId) {
    return (outboundByFrom.get(personId) || [])
      .filter((r) => r.kind === 'recruited')
      .map((r) => peopleById.get(r.toId))
      .filter(Boolean);
  }
  function parentChildren(personId) {
    return (outboundByFrom.get(personId) || [])
      .filter((r) => r.kind === 'parent')
      .map((r) => peopleById.get(r.toId))
      .filter(Boolean);
  }

  // Roots: anyone with no inbound parent or recruited edge. Non-members
  // (mothers) and orphan members both qualify.
  const roots = people.filter((p) => {
    const inb = inboundByTo.get(p.id) || [];
    return !inb.some((r) => r.kind === 'parent' || r.kind === 'recruited');
  });

  // TSRC visual group: the three mothers with the TSRC distinction. Linda
  // Flanagan, who shares motherhood but not TSRC, stays as a separate root.
  const tsrcDistinction = distinctions.find((d) => d.name === TSRC_NAME);
  const tsrcMemberIds = new Set(
    tsrcDistinction
      ? (tsrcDistinction.members || []).map((id) => id)
      : []
  );
  const tsrcRoots = roots.filter((p) => tsrcMemberIds.has(p.id));
  const otherRoots = roots.filter((p) => !tsrcMemberIds.has(p.id));

  const parentChildrenByPersonId = new Map();
  const disciplesByPersonId = new Map();
  for (const p of people) {
    parentChildrenByPersonId.set(p.id, parentChildren(p.id));
    disciplesByPersonId.set(p.id, recruitedChildren(p.id));
  }

  const peopleByDistinction = new Map();
  for (const d of distinctions) {
    const ids = d.members || [];
    peopleByDistinction.set(d.id, ids.map((id) => peopleById.get(id)).filter(Boolean));
  }

  // Identify the strava_dm endpoint pair so the row for Jake can render the
  // lateral annotation under his name.
  const lateralEdge = relationships.find((r) => r.kind === 'strava_dm');
  const lateralAnnotations = new Map();
  if (lateralEdge) {
    const fromPerson = peopleById.get(lateralEdge.fromId);
    const toPerson   = peopleById.get(lateralEdge.toId);
    if (fromPerson && toPerson) {
      const surname = (toPerson.displayName.split(/\s+/).pop() || '').toUpperCase();
      lateralAnnotations.set(
        toPerson.id,
        `LATERAL CONNECTION · VIA STRAVA DM · INBOUND TO ${surname}`
      );
    }
  }

  function toggleBranch(personId) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }

  function onMemberTap(p) {
    navigate(`/tree/${p.slug}`, { state: { from: 'tree' } });
  }
  function onNonMemberTap(p) {
    setOpenTileId((prev) => (prev === p.id ? null : p.id));
  }

  function renderSubtree(personId, depth, visited) {
    if (visited.has(personId)) return null; // cycle guard
    visited.add(personId);
    const person = peopleById.get(personId);
    if (!person) return null;
    const children = recruitedChildren(personId);
    // Default: first two levels expanded, deeper collapsed. The `collapsed`
    // Set tracks user-toggled overrides — for default-open rows, presence
    // means "user collapsed it"; for default-closed rows, presence means
    // "user expanded it." This lets one Set carry both directions of toggle.
    const defaultOpen = depth < 2;
    const isOpen = defaultOpen ? !collapsed.has(personId) : collapsed.has(personId);

    const parentEdges = inboundOfKind(personId, 'parent');
    const recruiterEdges = inboundOfKind(personId, 'recruited');
    const parent    = parentEdges[0]    ? peopleById.get(parentEdges[0].fromId)    : null;
    const recruiter = recruiterEdges[0] ? peopleById.get(recruiterEdges[0].fromId) : null;

    return (
      <li key={person.id} className="hatree__node">
        <TreeRow
          person={person}
          depth={depth}
          parent={parent}
          recruiter={recruiter}
          hasChildren={children.length > 0}
          childCount={children.length}
          expanded={isOpen}
          onToggle={() => toggleBranch(personId)}
          onChipClick={(d, anchor) => setPopover({ distinction: d, anchor })}
          onMemberTap={onMemberTap}
          onNonMemberTap={onNonMemberTap}
          isOpenTile={openTileId === person.id}
          lateralLabel={lateralAnnotations.get(person.id) || null}
        />
        {openTileId === person.id && !person.isMember ? (
          <NonMemberTile
            person={person}
            parentChildrenByPersonId={parentChildrenByPersonId}
            disciplesByPersonId={disciplesByPersonId}
            peopleById={peopleById}
          />
        ) : null}
        {children.length > 0 && isOpen ? (
          <ul className="hatree__children">
            {children.map((c) => renderSubtree(c.id, depth + 1, new Set(visited)))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <main className="hatree">
      <header className="hatree__masthead">
        <Link to="/" className="hatree__back">
          <span className="hatree__back-arrow" aria-hidden="true">←</span>
          <span>Home</span>
        </Link>
        <span className="hatree__wordmark-text">Hybrid Athletes</span>
        <span className="hatree__folio-r">Tree</span>
      </header>

      <header className="hatree__header">
        <div className="hatree__overline hatree__rise" {...delay(0)}>
          <span className="hatree__overline-tick" aria-hidden="true">§</span>
          <span>Office of the Registrar · Coaching Tree</span>
        </div>
        <h1 className="hatree__title hatree__rise" {...delay(120)}>The Coaching Tree</h1>
        <p className="hatree__subtitle hatree__rise" {...delay(220)}>
          Inscribed by the Office of the Registrar. {today}.
        </p>
        <div className="hatree__meta-row hatree__rise" {...delay(320)}>
          <span>{people.length} on record</span>
          <span className="hatree__meta-dot" aria-hidden="true">·</span>
          <span>{relationships.length} relations</span>
          <span className="hatree__meta-dot" aria-hidden="true">·</span>
          <span>{distinctions.length} distinctions</span>
        </div>
      </header>

      <hr className="hatree__rule hatree__rule--banner hatree__draw" {...delay(420)} />

      {tsrcRoots.length > 0 ? (
        <section className="hatree__group hatree__group--tsrc hatree__rise" {...delay(540)}>
          <header className="hatree__group-chip">
            <span aria-hidden="true">🏃‍♀️</span>
            <span>Troubled Soles Run Club — Franklin, MA</span>
          </header>
          <ul className="hatree__list hatree__list--grouped">
            {tsrcRoots.map((r) => renderSubtree(r.id, 0, new Set()))}
          </ul>
        </section>
      ) : null}

      <ul className="hatree__list">
        {otherRoots.map((r, i) => (
          <li
            key={r.id}
            className="hatree__root hatree__rise"
            {...delay(660 + i * 80)}
          >
            <ul className="hatree__children hatree__children--root">
              {renderSubtree(r.id, 0, new Set())}
            </ul>
          </li>
        ))}
      </ul>

      <footer className="hatree__foot">
        <span>Office of the Registrar</span>
        <span>Coaching Tree · {today}</span>
      </footer>

      {popover && popover.distinction ? (
        <DistinctionPopover
          anchor={popover.anchor}
          distinction={popover.distinction}
          peopleByDistinction={peopleByDistinction}
          onClose={() => setPopover(null)}
          onPickMember={onMemberTap}
          onPickNonMember={(p) => setOpenTileId(p.id)}
        />
      ) : null}
    </main>
  );
}

export default TreeScreen;
