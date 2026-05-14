// LineageScreen.jsx — /tree/:slug. The provenance view for a single person.
// Sections: Upstream, The Hybrid Profile, Downstream, Lateral Connections.
// Back link reads location.state.from ('tree' or 'stats').
//
// Non-member slug deep-links render the spec §9.3 not-found panel rather
// than the regular lineage, since non-members exist only in the Tree.

import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import Avatar from './Avatar.jsx';

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

function ChipList({ distinctions }) {
  if (!distinctions || distinctions.length === 0) return null;
  return (
    <ul className="halineage__chips">
      {distinctions.map((d) => (
        <li key={d.id}>
          <span
            className="halineage__chip"
            style={{ '--chip-color': d.color || 'var(--baa-blue)' }}
            title={d.name}
          >
            {d.icon ? <span aria-hidden="true">{d.icon}</span> : null}
            <span>{d.shortName}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function PersonCard({ person, size = 36, captionAbove, captionBelow, asLink = true }) {
  const variant = person.isMember ? 'member' : 'nonmember';
  const inner = (
    <>
      <Avatar
        name={person.displayName}
        photoUrl={person.photoUrl}
        size={size}
        variant={variant}
      />
      <div className="halineage__card-body">
        {captionAbove ? <span className="halineage__card-caption">{captionAbove}</span> : null}
        <span className="halineage__card-name">{person.displayName}</span>
        {captionBelow ? <span className="halineage__card-meta">{captionBelow}</span> : null}
        <ChipList distinctions={person.distinctions} />
      </div>
    </>
  );

  if (asLink && person.isMember) {
    return (
      <Link to={`/tree/${person.slug}`} state={{ from: 'tree' }} className="halineage__card halineage__card--link">
        {inner}
        <span className="halineage__card-arrow" aria-hidden="true">→</span>
      </Link>
    );
  }
  return <div className="halineage__card">{inner}</div>;
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function LineageScreen() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { treeBundle, refreshTree } = useAppContext();
  const [loadingError, setLoadingError] = React.useState(false);

  React.useEffect(() => {
    if (!treeBundle) refreshTree().catch(() => setLoadingError(true));
  }, [treeBundle, refreshTree]);

  const fromTag = (location.state && location.state.from) || null;
  const backTo = fromTag === 'stats' ? '/stats' : '/tree';
  const backLabel = fromTag === 'stats' ? 'Return to Hybrids' : 'Return to Tree';

  const today = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  if (loadingError) {
    return (
      <main className="halineage">
        <header className="halineage__masthead">
          <Link to={backTo} className="halineage__back">
            <span className="halineage__back-arrow" aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>
          <span className="halineage__wordmark-text">Hybrid Athletes</span>
          <span className="halineage__folio-r">Lineage</span>
        </header>
        <div className="halineage__state">
          The tree is temporarily inaccessible. The Registrar has been notified.
        </div>
      </main>
    );
  }

  if (!treeBundle) {
    return (
      <main className="halineage">
        <header className="halineage__masthead">
          <Link to={backTo} className="halineage__back">
            <span className="halineage__back-arrow" aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>
          <span className="halineage__wordmark-text">Hybrid Athletes</span>
          <span className="halineage__folio-r">Lineage</span>
        </header>
        <div className="halineage__state">The Registrar is consulting the tree.</div>
      </main>
    );
  }

  const { people, relationships } = treeBundle;
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const person = people.find((p) => p.slug === slug);

  if (!person) {
    return (
      <main className="halineage">
        <header className="halineage__masthead">
          <Link to={backTo} className="halineage__back">
            <span className="halineage__back-arrow" aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>
          <span className="halineage__wordmark-text">Hybrid Athletes</span>
          <span className="halineage__folio-r">Lineage</span>
        </header>
        <div className="halineage__state">
          This identity is not on the Coaching Tree.
        </div>
      </main>
    );
  }

  // Non-member deep link: they exist only inline within /tree, never as a
  // dedicated lineage page. Render the §9.3 copy.
  if (!person.isMember) {
    return (
      <main className="halineage">
        <header className="halineage__masthead">
          <Link to={backTo} className="halineage__back">
            <span className="halineage__back-arrow" aria-hidden="true">←</span>
            <span>{backLabel}</span>
          </Link>
          <span className="halineage__wordmark-text">Hybrid Athletes</span>
          <span className="halineage__folio-r">Lineage</span>
        </header>
        <div className="halineage__notfound">
          <p className="halineage__notfound-name">{person.displayName}</p>
          <p className="halineage__notfound-body">
            This identity exists only in the Tree.
          </p>
          <Link to="/tree" className="halineage__notfound-link">
            Return to the Coaching Tree <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    );
  }

  const inbound = relationships.filter((r) => r.toId === person.id);
  const outbound = relationships.filter((r) => r.fromId === person.id);

  const parentEdge = inbound.find((r) => r.kind === 'parent');
  const recruiterEdge = inbound.find((r) => r.kind === 'recruited');
  const parentPerson = parentEdge ? peopleById.get(parentEdge.fromId) : null;
  const recruiterPerson = recruiterEdge ? peopleById.get(recruiterEdge.fromId) : null;
  const downstream = outbound
    .filter((r) => r.kind === 'recruited')
    .map((r) => peopleById.get(r.toId))
    .filter(Boolean);

  // Second-level downstream for the mini-tree.
  function recruitsOf(id) {
    return relationships
      .filter((r) => r.fromId === id && r.kind === 'recruited')
      .map((r) => peopleById.get(r.toId))
      .filter(Boolean);
  }

  const lateral = [
    ...inbound.filter((r) => r.kind === 'strava_dm').map((r) => ({
      otherPerson: peopleById.get(r.fromId), direction: 'inbound', note: r.note,
    })),
    ...outbound.filter((r) => r.kind === 'strava_dm').map((r) => ({
      otherPerson: peopleById.get(r.toId), direction: 'outbound', note: r.note,
    })),
  ].filter((x) => x.otherPerson);

  // Inscribed-on date: prefer earliest createdAt across inbound edges and
  // distinction memberships; fall back to "an earlier date".
  let earliestEdgeAt = null;
  for (const r of inbound) {
    if (r.createdAt && (!earliestEdgeAt || r.createdAt < earliestEdgeAt)) {
      earliestEdgeAt = r.createdAt;
    }
  }
  const inscribedDate = formatDate(earliestEdgeAt) || 'an earlier date';

  return (
    <main className="halineage">
      <header className="halineage__masthead">
        <Link to={backTo} className="halineage__back">
          <span className="halineage__back-arrow" aria-hidden="true">←</span>
          <span>{backLabel}</span>
        </Link>
        <span className="halineage__wordmark-text">Hybrid Athletes</span>
        <span className="halineage__folio-r">Lineage</span>
      </header>

      <header className="halineage__header">
        <div className="halineage__overline halineage__rise" {...delay(0)}>
          <span className="halineage__overline-tick" aria-hidden="true">§</span>
          <span>Office of the Registrar · Coaching Tree · Lineage</span>
        </div>
        <h1 className="halineage__title halineage__rise" {...delay(120)}>
          Lineage of {person.displayName}.
        </h1>
        <p className="halineage__subtitle halineage__rise" {...delay(220)}>
          Inscribed in the Coaching Tree on {inscribedDate}.
        </p>
      </header>

      <hr className="halineage__rule halineage__rule--banner halineage__draw" {...delay(320)} />

      {(parentPerson || recruiterPerson) ? (
        <section className="halineage__section halineage__rise" {...delay(420)}>
          <h2 className="halineage__section-title">Upstream</h2>
          {parentPerson ? (
            <PersonCard
              person={parentPerson}
              size={48}
              captionAbove="Brought to the Tree by"
              captionBelow={null}
              asLink={false}
            />
          ) : null}
          {recruiterPerson ? (
            <PersonCard
              person={recruiterPerson}
              size={48}
              captionAbove={parentPerson
                ? 'Introduced to the Hybrid Athletes by'
                : 'Brought to the Hybrid Athletes by'}
              captionBelow={null}
              asLink={true}
            />
          ) : null}
        </section>
      ) : null}

      <section className="halineage__section halineage__rise" {...delay(520)}>
        <h2 className="halineage__section-title">The Hybrid Profile</h2>
        <div className="halineage__hero">
          <Avatar
            name={person.displayName}
            photoUrl={person.photoUrl}
            size={72}
            variant="member"
          />
          <div className="halineage__hero-body">
            <span className="halineage__hero-overline">Member of Record</span>
            <span className="halineage__hero-name">{person.displayName}</span>
            <ChipList distinctions={person.distinctions} />
          </div>
        </div>
        <Link
          to={`/stats?profile=${encodeURIComponent(person.displayName)}`}
          state={{ from: 'tree' }}
          className="halineage__profile-link"
        >
          View Hybrid Profile <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="halineage__section halineage__rise" {...delay(620)}>
        <h2 className="halineage__section-title">Downstream</h2>
        <p className="halineage__downstream-summary">
          {downstream.length === 0
            ? 'No disciples on record.'
            : `${person.displayName} has brought ${downstream.length} hybrid${downstream.length === 1 ? '' : 's'} into the Coaching Tree.`}
        </p>
        {downstream.length > 0 ? (
          <ul className="halineage__downstream">
            {downstream.map((d) => {
              const grandkids = recruitsOf(d.id);
              return (
                <li key={d.id} className="halineage__downstream-row">
                  <PersonCard person={d} size={40} asLink={true} />
                  {grandkids.length > 0 ? (
                    <Link
                      to={`/tree/${d.slug}`}
                      state={{ from: 'tree' }}
                      className="halineage__downstream-more"
                    >
                      +{grandkids.length} below <span aria-hidden="true">→</span>
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {lateral.length > 0 ? (
        <section className="halineage__section halineage__rise" {...delay(720)}>
          <h2 className="halineage__section-title">Lateral Connections</h2>
          {lateral.map((edge, i) => (
            <div key={i} className="halineage__lateral">
              <PersonCard person={edge.otherPerson} size={40} asLink={true} />
              <p className="halineage__lateral-note">
                Connected to <em>{edge.otherPerson.displayName}</em> via Strava DM.
                The introduction was <strong>{edge.direction}</strong>.
                {edge.note ? <> <span className="halineage__lateral-quiet">— {edge.note}</span></> : null}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <footer className="halineage__foot">
        <span>Office of the Registrar</span>
        <span>Coaching Tree · {today}</span>
      </footer>
    </main>
  );
}

export default LineageScreen;
