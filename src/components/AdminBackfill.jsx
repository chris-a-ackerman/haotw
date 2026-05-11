// AdminBackfill.jsx — one-shot historical certificate generation.
//
// Walks `determinations` for rows with certificate_url IS NULL, renders the
// existing <Certificate> off-screen for each row, captures via html2canvas,
// uploads to the certificates bucket, and writes the URL back. Reuses the
// same capturePng + uploadCertificate path the live cert flow uses, so
// historical PNGs render identically to ones produced at file-time.
//
// Delete after backfill: this file, the HREF_TO_VIEW entry in App.jsx, and
// the view-rendering branch.

import React from 'react';
import { createPortal } from 'react-dom';
import { Certificate } from './Certificate.jsx';
import { capturePng, uploadCertificate, slugify } from '../lib/certificate.js';
import { supabase, isLive } from '../lib/supabase.js';

const ADMIN_EMAILS = ['chris.ackerman02@gmail.com'];

// Per-name honorific overrides. Default for unlisted names is "Mr.".
// Add entries here (e.g. 'Sarah Whitcomb-Hodge': 'Ms.') as the roster grows.
const HONORIFICS = {};

// "Theodore J. Clifford" → "Mr. T. J. Clifford"
// "Ed Coleman"           → "Mr. E. Coleman"
// Preserves any middle initials already present (e.g. "J." stays "J.").
export function formalName(name) {
  if (!name) return '';
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  const honorific = HONORIFICS[trimmed] || 'Mr.';
  if (parts.length === 1) return `${honorific} ${parts[0]}`;
  const last = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map(p => `${p[0].toUpperCase()}.`)
    .join(' ');
  return `${honorific} ${initials} ${last}`;
}

// '2026-05-10' → 'May 10, 2026'. UTC-parsed so a Date with no time component
// doesn't drift across timezones.
function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function certDataFor(row) {
  return {
    org: 'Hybrid Athletes',
    title: row.winners.length > 1 ? 'Hybrid Athletes of the Week' : 'Hybrid Athlete of the Week',
    weekLabel: `No. ${row.determination_number} · ${fmtDate(row.determined_on)}`,
    determinationNumber: row.determination_number,
    recipients: row.winners.map(formalName),
    body: row.citation,
    determinedBy: row.determiner,
    est: 'Est. 2023',
  };
}

export default function AdminBackfill({ session }) {
  const [log, setLog] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [current, setCurrent] = React.useState(null);
  const certRef = React.useRef(null);
  const push = (msg) => setLog((l) => [...l, msg]);

  if (!isLive()) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Certificate backfill</h1>
        <p>Storage uploads require live Supabase mode. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> and reload.</p>
      </main>
    );
  }
  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Certificate backfill</h1>
        <p>Not authorized.</p>
      </main>
    );
  }

  const run = async () => {
    setRunning(true);
    setLog([]);
    const { data: rows, error } = await supabase
      .from('determinations')
      .select('*')
      .is('certificate_url', null)
      .order('determination_number');

    if (error) {
      push(`fetch failed: ${error.message}`);
      setRunning(false);
      return;
    }
    push(`found ${rows.length} rows to backfill`);

    for (const row of rows) {
      push(`#${row.determination_number} rendering…`);
      setCurrent({ row, certData: certDataFor(row) });

      // Two RAFs + fonts.ready so layout settles and webfonts are loaded
      // before html2canvas snapshots the DOM. Without this the PNG can
      // capture a fallback font and look broken.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await document.fonts.ready;

      const blob = await capturePng(certRef.current);
      if (!blob) {
        push(`#${row.determination_number} capture returned no blob`);
        continue;
      }

      const url = await uploadCertificate(blob, {
        determinationNumber: row.determination_number,
        recipientSlug: slugify(row.winners[0]),
      });
      if (!url) {
        push(`#${row.determination_number} upload failed`);
        continue;
      }

      const { error: upErr } = await supabase
        .from('determinations')
        .update({ certificate_url: url })
        .eq('id', row.id);
      if (upErr) {
        push(`#${row.determination_number} db update failed: ${upErr.message}`);
        continue;
      }
      push(`#${row.determination_number} ok → ${url}`);
    }

    setCurrent(null);
    setRunning(false);
    push('done.');
  };

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <h1>Certificate backfill</h1>
      <p>One-shot. Renders certificates for determinations where <code>certificate_url IS NULL</code>, uploads to the <code>certificates</code> bucket, and writes the URL back.</p>
      <button
        onClick={run}
        disabled={running}
        style={{ padding: '8px 16px', fontSize: 14, cursor: running ? 'default' : 'pointer' }}
      >
        {running ? 'Running…' : 'Run'}
      </button>
      <pre style={{ marginTop: 16, padding: 12, background: '#f4f4f2', fontSize: 12, whiteSpace: 'pre-wrap' }}>
        {log.length ? log.join('\n') : '(idle)'}
      </pre>

      {current && createPortal(
        <div style={{ position: 'fixed', left: -10000, top: 0, width: 400 }}>
          <Certificate data={current.certData} innerRef={certRef} />
        </div>,
        document.body,
      )}
    </main>
  );
}
