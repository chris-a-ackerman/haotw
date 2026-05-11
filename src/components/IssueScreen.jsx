// IssueScreen.jsx — The reigning holder issues the next Determination.
// AI generation goes through a Supabase Edge Function that proxies the
// Anthropic API. In localStorage-only dev mode, the function call is skipped
// and the deadpan MOCK_CERTIFICATE fallback is used. The 2-second floor
// preserves the "Committee is deliberating" UX in both modes.

import React from 'react';
import { supabase, isLive } from '../lib/supabase.js';
import { createDetermination, listDeterminations } from '../lib/records.js';
import { listProfilesWithPhotos } from '../lib/claims.js';

const ISSUE = {
  filedAt: 'Filed at Boston, Mass.',
  issuedBy: { id: 'tc', name: 'Theodore J. Clifford', short: 'T. J. Clifford' },
};

const initialsFor = (name) =>
  name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').toUpperCase();
const idFor = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const MOCK_CERTIFICATE = (recipientShort) =>
  `${recipientShort} completed the 2026 London Marathon in a time of 2:58:41, six days ` +
  `following an appearance at the 130th Boston Athletic Association Marathon. A ` +
  `gastrointestinal episode was noted and resolved mid-race. Corroborating chat logs ` +
  `and one (1) finish-line photograph were entered into evidence. The determination stands.`;

const shortName = (full) => {
  const parts = full.split(' ');
  if (parts.length < 2) return full;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ');
  return `${initials} ${last}`;
};

const joinNames = (arr) => {
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
};

const stripMarkdown = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/g, '$1$2')
    .replace(/(^|\s)_(\S(?:.*?\S)?)_(?=\s|$)/g, '$1$2')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const delay = (n) => ({ style: { animationDelay: `${n}ms` } });

function Avatar({ initials, photoUrl, size = 64 }) {
  return (
    <span
      className={'haissue__avatar' + (photoUrl ? ' haissue__avatar--photo' : '')}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      aria-hidden="true"
    >
      {photoUrl ? (
        <img className="haissue__avatar-img" src={photoUrl} alt="" />
      ) : (
        <span className="haissue__avatar-initials">{initials}</span>
      )}
    </span>
  );
}

function CertificatePreview({ recipients, body, determinationNo, issuer }) {
  const namesLine = recipients.length
    ? recipients.map(r => r.name).join(' & ')
    : '—';
  return (
    <div className="haissue__certpaper" aria-label="Certificate preview">
      <div className="haissue__certpaper-rule" />
      <div className="haissue__certpaper-head">
        <span>Hybrid Athletes</span>
        <span className="haissue__certpaper-est">Est. 2024</span>
      </div>
      <div className="haissue__certpaper-title">Determination of the Committee</div>
      <div className="haissue__certpaper-folio">
        <span>No. {determinationNo}</span>
        <span>·</span>
        <span>May 8</span>
      </div>
      <div className="haissue__certpaper-rule haissue__certpaper-rule--mid" />
      <div className="haissue__certpaper-inre">In re</div>
      <div className="haissue__certpaper-name">{namesLine}</div>
      <p className="haissue__certpaper-body">
        {body || (
          <span className="haissue__certpaper-empty">
            [Determination language to be entered]
          </span>
        )}
      </p>
      <div className="haissue__certpaper-foot">
        <div className="haissue__certpaper-sigline">
          <span className="haissue__certpaper-siglabel">Issued by</span>
          <span className="haissue__certpaper-signame">{shortName(issuer.name)}</span>
        </div>
        <div className="haissue__certpaper-seal" aria-hidden="true">
          <img src="/ha-seal.png" alt="" className="haissue__certpaper-seal-img" />
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, recipients, awardNo, onConfirm, onCancel }) {
  if (!open) return null;
  const names = recipients.map(r => r.name);
  return (
    <div className="haissue__modal-scrim" role="dialog" aria-modal="true">
      <div className="haissue__modal" role="document">
        <div className="haissue__modal-stamp">Permanent · Read-only</div>
        <div className="haissue__modal-title">This determination is permanent.</div>
        <p className="haissue__modal-body">
          <strong>{joinNames(names)}</strong> will be entered into the official record
          as Determination No. {awardNo ?? '—'}. Once filed, the Citation cannot be amended.
        </p>
        <p className="haissue__modal-body haissue__modal-body--quiet">
          Proceed?
        </p>
        <div className="haissue__modal-actions">
          <button type="button" className="haissue__btn haissue__btn--ghost" onClick={onCancel}>
            Return to Review
          </button>
          <button type="button" className="haissue__btn haissue__btn--primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueScreen({ issuer }) {
  const [selected, setSelected] = React.useState([]);
  const [speech, setSpeech] = React.useState('');
  const [genState, setGenState] = React.useState('idle');
  const [generated, setGenerated] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [filed, setFiled] = React.useState(false);
  const [members, setMembers] = React.useState([]);
  const [awardNo, setAwardNo] = React.useState(null);
  const [nextDeterminationNumber, setNextDeterminationNumber] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    listProfilesWithPhotos().then(rows => {
      if (cancelled) return;
      setMembers(rows.map(({ name, photoUrl }) => ({
        id: idFor(name),
        name,
        initials: initialsFor(name),
        photoUrl,
      })));
    });
    listDeterminations().then(records => {
      if (cancelled) return;
      setAwardNo(records.length + 1);
      setNextDeterminationNumber(records.length ? records[0].determinationNumber + 1 : 1);
    });
    return () => { cancelled = true; };
  }, []);

  const issuedBy = issuer && issuer.name
    ? { ...ISSUE.issuedBy, name: issuer.name, short: shortName(issuer.name) }
    : ISSUE.issuedBy;

  const selectedMembers = selected.map(
    id => members.find(m => m.id === id)
  ).filter(Boolean);

  const toggleMember = (m) => {
    if (m.isYou || filed) return;
    setSelected(prev => {
      if (prev.includes(m.id)) {
        setGenerated('');
        setGenState('idle');
        return prev.filter(id => id !== m.id);
      }
      setGenerated('');
      setGenState('idle');
      return [...prev, m.id];
    });
  };

  const generate = async () => {
    if (!selectedMembers.length || !speech.trim() || genState === 'loading') return;
    setGenState('loading');
    const recipientLine = selectedMembers.map(m => shortName(m.name)).join(' and ');
    const prompt =
      `You are "The Committee," a fictional council that issues deadpan, factual ` +
      `Determinations about a "Hybrid Athlete of the Week." Read the outgoing ` +
      `champion's speech below and produce 2–4 sentences of purely institutional, ` +
      `factual certificate language about ${recipientLine}. ` +
      `Use only key facts from the speech. No humor. No flourish. No praise. ` +
      `Refer to the recipient(s) by formal name (e.g., "Mr. T. J. Clifford"). ` +
      `If gastrointestinal, weather, or logistical incidents are mentioned, note ` +
      `them factually. End the final sentence with: The determination stands.\n\n` +
      `Output plain prose only. Do not use markdown, asterisks, headings, ` +
      `bullet points, or any formatting characters. Do not add a title.\n\n` +
      `SPEECH:\n${speech.trim()}`;

    const minDelay = new Promise(r => setTimeout(r, 2000));
    let text = '';
    if (isLive() && supabase) {
      try {
        const [{ data, error }] = await Promise.all([
          supabase.functions.invoke('generate-certificate', { body: { prompt } }),
          minDelay,
        ]);
        if (error) {
          console.warn('generate-certificate error', error);
        } else {
          text = (data && data.text ? data.text : '').trim();
        }
      } catch (e) {
        console.warn('generate-certificate threw', e);
      }
    } else {
      // localStorage-only dev mode: hold the deliberation beat, then mock.
      await minDelay;
    }
    text = stripMarkdown(text);
    if (!text) text = MOCK_CERTIFICATE(recipientLine);
    setGenerated(text);
    setGenState('ready');
  };

  const fileDetermination = async () => {
    if (nextDeterminationNumber == null) return;
    setConfirmOpen(false);
    const winners = selectedMembers.map(m => m.name);
    await createDetermination({
      determinationNumber: nextDeterminationNumber,
      winners,
      determiner: issuer.hybridProfile,
      determinedOn: new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      }),
      citation: generated,
      speech,
      certificateUrl: null,
    });
    setFiled(true);
  };

  const canGenerate = selectedMembers.length > 0 && speech.trim().length > 0 && genState !== 'loading' && !filed;
  const canSubmit = selectedMembers.length > 0 && speech.trim().length > 0 && genState === 'ready' && !filed && nextDeterminationNumber != null;

  return (
    <div className="hahome haissue">
      <header className="hahome__masthead">
        <div className="hahome__wordmark hahome__rise" {...delay(0)}>
          <span className="hahome__wordmark-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10.25" stroke="#1A1A1A" strokeWidth="0.75"/>
              <circle cx="11" cy="11" r="7.75" stroke="#1A1A1A" strokeWidth="0.5"/>
              <text x="11" y="14.2" textAnchor="middle"
                    fontFamily='"Bodoni Moda", Didot, serif'
                    fontWeight="700" fontSize="9" fill="#003DA5"
                    letterSpacing="-0.02em">H</text>
            </svg>
          </span>
          <span className="hahome__wordmark-text">Hybrid Athletes</span>
        </div>

        <hr className="hahome__rule hahome__rule--top hahome__draw" {...delay(180)} />

        <div className="hahome__folio hahome__rise" {...delay(280)}>
          <a href="index.html" className="haissue__back" aria-label="Return to record">
            <span className="haissue__back-arrow" aria-hidden="true">←</span>
            Return
          </a>
          <span className="hahome__folio-c">Determination</span>
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </header>

      <main className="hahome__main haissue__main">
        <div className="haissue__title-block hahome__rise" {...delay(380)}>
          <div className="haissue__overline">
            <span className="haissue__overline-tick" aria-hidden="true">§</span>
            <span>Issue Determination</span>
            <span className="haissue__overline-no">No. {awardNo ?? '—'}</span>
          </div>
          <h1 className="haissue__title">Issue Determination</h1>
          <p className="haissue__subtitle">The Committee awaits your findings.</p>
        </div>

        <hr className="hahome__rule hahome__rule--soft hahome__draw" {...delay(540)} />

        <section className="haissue__section hahome__rise" {...delay(620)}>
          <div className="haissue__sectionhead">
            <span className="haissue__sectionhead-l">
              <span className="haissue__sectionhead-mark">I</span>
              <span>Select Recipient(s)</span>
            </span>
            <span className="haissue__sectionhead-r">
              {selectedMembers.length === 0
                ? 'None selected'
                : `${selectedMembers.length} selected`}
            </span>
          </div>

          <div className="haissue__grid">
            {members.map((m) => {
              const isSelected = selected.includes(m.id);
              const isYou = !!issuer && issuer.hybridProfile === m.name;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={
                    'haissue__card' +
                    (isSelected ? ' is-selected' : '') +
                    (isYou ? ' is-you' : '')
                  }
                  onClick={() => toggleMember({ ...m, isYou })}
                  aria-pressed={isSelected}
                  disabled={isYou}
                >
                  <span className="haissue__card-avatar-wrap">
                    <Avatar initials={m.initials} photoUrl={m.photoUrl} />
                    {isSelected && (
                      <span className="haissue__card-check" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="14" height="14">
                          <path d="M3 8.5 L6.5 12 L13 4.5"
                            stroke="#fff" strokeWidth="2" fill="none"
                            strokeLinecap="square" strokeLinejoin="miter" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className="haissue__card-name">{m.name}</span>
                  {isYou && <span className="haissue__card-you">(you)</span>}
                </button>
              );
            })}
          </div>

          {selectedMembers.length === 2 && (
            <p className="haissue__co-note">Co-determination. Noted.</p>
          )}
          {selectedMembers.length >= 3 && (
            <p className="haissue__co-note">
              Joint determination of {selectedMembers.length}. Noted.
            </p>
          )}
        </section>

        <section className="haissue__section hahome__rise" {...delay(720)}>
          <div className="haissue__sectionhead">
            <span className="haissue__sectionhead-l">
              <span className="haissue__sectionhead-mark">II</span>
              <span>Official Speech</span>
            </span>
            <span className="haissue__sectionhead-r">Verbatim · permanent</span>
          </div>

          <div className="haissue__textarea-wrap">
            <textarea
              className="haissue__textarea"
              value={speech}
              onChange={(e) => {
                setSpeech(e.target.value);
                if (genState === 'ready') { setGenerated(''); setGenState('idle'); }
              }}
              placeholder="Paste the full speech here. It will be stored as the permanent record."
              rows={9}
              spellCheck={false}
              disabled={filed}
            />
            <div className="haissue__textarea-foot">
              <span>{speech.trim() ? `${speech.trim().split(/\s+/).length} words` : '0 words'}</span>
              <span>Stored as written</span>
            </div>
          </div>
        </section>

        <section className="haissue__section hahome__rise" {...delay(820)}>
          <button
            type="button"
            className={
              'haissue__btn haissue__btn--primary haissue__btn--full' +
              (genState === 'loading' ? ' is-loading' : '')
            }
            disabled={!canGenerate}
            onClick={generate}
          >
            {genState === 'loading' ? (
              <span className="haissue__btn-loading">
                The Committee is deliberating
                <span className="haissue__dots" aria-hidden="true">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </span>
            ) : genState === 'ready' ? 'Re-deliberate Certificate' : 'Generate Certificate'}
          </button>

          {genState !== 'idle' && (
            <div className="haissue__cert-panel">
              <div className="haissue__cert-panel-head">
                <span>Determination Language</span>
                <span className="haissue__cert-panel-status">
                  {genState === 'loading' ? 'Drafting…' : 'Drafted'}
                </span>
              </div>
              <div className="haissue__cert-panel-body" aria-live="polite">
                {genState === 'loading' ? (
                  <span className="haissue__cert-skeleton">
                    <span /><span /><span /><span style={{ width: '62%' }} />
                  </span>
                ) : (
                  generated
                )}
              </div>
              {genState === 'ready' && (
                <button
                  type="button"
                  className="haissue__regen"
                  onClick={generate}
                >
                  Regenerate <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          )}
        </section>

        <section className="haissue__section hahome__rise" {...delay(900)}>
          <div className="haissue__sectionhead">
            <span className="haissue__sectionhead-l">
              <span className="haissue__sectionhead-mark">IV</span>
              <span>Certificate Preview</span>
            </span>
            <span className="haissue__sectionhead-r">Live</span>
          </div>

          <CertificatePreview
            recipients={selectedMembers}
            body={generated}
            determinationNo={awardNo ?? '—'}
            issuer={issuedBy}
          />
          <p className="haissue__preview-caption">
            The following will be entered into the permanent record.
          </p>
        </section>

        <section className="haissue__section haissue__section--submit hahome__rise" {...delay(980)}>
          <button
            type="button"
            className="haissue__btn haissue__btn--primary haissue__btn--full haissue__btn--submit"
            disabled={!canSubmit}
            onClick={() => setConfirmOpen(true)}
          >
            {filed ? 'Entered into Record' : 'Enter into Record'}
            {!filed && <span className="haissue__btn-arrow" aria-hidden="true">→</span>}
          </button>
          {filed && (
            <p className="haissue__filed-note">
              Filed {ISSUE.filedAt.replace('Filed at ', '')} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EDT.
              The record is closed.
            </p>
          )}
          {filed && (
            <a
              href="record.html"
              className="haissue__btn haissue__btn--ghost haissue__btn--full haissue__btn--view-record"
            >
              <span className="haissue__btn-numeral" aria-hidden="true">§</span>
              <span>View in Official Record</span>
              <span className="haissue__btn-arrow" aria-hidden="true">→</span>
            </a>
          )}
        </section>

        <div className="haissue__colophon">
          <span>The Committee</span>
          <span>Determination No. {awardNo ?? '—'}</span>
          <span>May 8</span>
        </div>
      </main>

      <ConfirmModal
        open={confirmOpen && !filed}
        recipients={selectedMembers}
        awardNo={awardNo}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={fileDetermination}
      />
    </div>
  );
}

export default IssueScreen;
