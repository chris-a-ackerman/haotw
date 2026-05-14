// CertificateScreen.jsx — the certificate view, both standalone (no chrome,
// latest determination, opened in a new tab from share) and chromed (specific
// determination by :number, with a Return link back to the originating screen).
//
// Path → mode:
//   /certificate              → standalone, latest determination
//   /certificate/:number      → chromed, that determination
//
// The Return link's destination is read from location.state.from, set by the
// caller (RecordScreen passes 'archive', HybridProfileSheet passes 'stats').

import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CertificateShare } from './Certificate.jsx';
import { buildCertPayload } from '../lib/certificate.js';
import { listDeterminations } from '../lib/records.js';
import { useAppContext } from '../context/AppContext.jsx';

function findByNumber(rows, number) {
  if (!rows || number == null) return null;
  const n = Number(number);
  return rows.find((r) => Number(r.determinationNumber) === n) || null;
}

function StandaloneCertificate({ entry }) {
  if (!entry) {
    return (
      <div className="hahome">
        <main className="hahome__main">
          <div className="hahome__inre">Awaiting first Determination</div>
        </main>
      </div>
    );
  }
  const payload = buildCertPayload(entry);
  return (
    <div className="hahome">
      <header className="hahome__masthead">
        <div className="hahome__wordmark">
          <span className="hahome__wordmark-text">Hybrid Athletes</span>
        </div>
        <hr className="hahome__rule hahome__rule--top" />
      </header>
      <main className="hahome__main">
        <CertificateShare data={payload.data} speech={payload.speech} />
      </main>
    </div>
  );
}

function ChromedCertificate({ entry, returnTo }) {
  const payload = entry ? buildCertPayload(entry) : null;
  return (
    <div className="hahome">
      <header className="hahome__masthead">
        <div className="hahome__wordmark">
          <span className="hahome__wordmark-text">Hybrid Athletes</span>
        </div>
        <hr className="hahome__rule hahome__rule--top" />
        <div className="hahome__folio" style={{ paddingTop: 6 }}>
          <Link to={returnTo} className="haissue__back">
            <span className="haissue__back-arrow" aria-hidden="true">←</span>
            <span>Return</span>
          </Link>
          <span className="hahome__folio-c">Determination · Issued</span>
          <span>{entry ? `No. ${entry.determinationNumber}` : ''}</span>
        </div>
      </header>
      <main className="hahome__main">
        {payload ? (
          <CertificateShare data={payload.data} speech={payload.speech} />
        ) : (
          <div className="hahome__inre">Determination not found</div>
        )}
      </main>
    </div>
  );
}

function CertificateScreen() {
  const { number } = useParams();
  const { determinations, refreshDeterminations } = useAppContext();
  const location = useLocation();
  const [localRows, setLocalRows] = React.useState(null);

  // On a hard refresh of /certificate/:number, AppContext's determinations may
  // be empty (auth still loading or the home effect hasn't fired). Pull our
  // own copy as a fallback so the screen stands alone.
  React.useEffect(() => {
    if (determinations && determinations.length > 0) return;
    let cancelled = false;
    listDeterminations()
      .then((rows) => { if (!cancelled) setLocalRows(rows); })
      .catch(() => { if (!cancelled) setLocalRows([]); });
    if (refreshDeterminations) refreshDeterminations();
    return () => { cancelled = true; };
  }, [determinations, refreshDeterminations]);

  const rows = (determinations && determinations.length > 0) ? determinations : (localRows || []);

  if (!number) {
    return <StandaloneCertificate entry={rows[0] || null} />;
  }

  const entry = findByNumber(rows, number);
  let from = '/archive';
  if (location.state?.from === 'stats') {
    const profile = location.state?.profile;
    from = profile ? `/stats?profile=${encodeURIComponent(profile)}` : '/stats';
  }
  return <ChromedCertificate entry={entry} returnTo={from} />;
}

export default CertificateScreen;
