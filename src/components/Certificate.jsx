// Certificate.jsx — the shareable artifact.
// Square 400×400 institutional document. The holder downloads the PNG and
// drops it in chat alongside their original speech. The certificate face
// carries the AI-distilled deadpan language; the speech is copied separately.

import React from 'react';
import { capturePng, uploadCertificate, download, slugify } from '../lib/certificate.js';

export const DEFAULT_CERT = {
  org:        'Hybrid Athletes',
  title:      'Hybrid Athlete of the Week',
  weekLabel:  'No. 14 · April 28, 2026',
  determinationNumber: 14,
  recipients: ['Mr. W. Clifford'],
  body:
    'Mr. W. Clifford completed the 2026 London Marathon in a time of 2:58:41, ' +
    'six days following his performance at the 130th London Athletic Federation ' +
    'Marathon. A gastrointestinal episode was noted and resolved mid-race. ' +
    'The determination stands.',
  determinedBy: 'Marcus Webb',
  est:         'Est. 2023',
};

export const DEFAULT_SPEECH =
`Alright. Week 14. I'll keep this short because I'm typing it from a hotel
bathroom in Bloomsbury.

Six days ago I ran Boston. 3:04, which is fine. Tuesday I flew to London for
work. Friday night I ate something at the hotel I cannot identify. Saturday
morning I started the London Marathon at 9:40 thinking I'd jog it. By mile
four it was clear that was not what was happening. I'll spare you the
specifics. Mile six I made a decision. Mile seven I executed it, in a
hedgerow off the Cutty Sark. Mile eight I felt incredible. I ran 2:58:41.

I do not recommend the protocol. I do not endorse the protocol. I am simply
reporting that the protocol works.

Anyway. Marcus, you're up. Make it count.

— W.C.`;

export function Certificate({ data = DEFAULT_CERT, innerRef }) {
  const { org, title, weekLabel, recipients, body, determinedBy, est } = data;
  const isCo = recipients.length > 1;

  return (
    <div className="cert" ref={innerRef} data-cert-root>
      <div className="cert__frame">
        <div className="cert__inner">

          <div className="cert__head">
            <span className="cert__crest" aria-hidden="true">
              <img src="/ha-seal.png" alt="" width="28" height="28" loading="eager" decoding="sync" />
            </span>
            <span className="cert__org">{org}</span>
          </div>

          <div className="cert__rule" />

          <div className="cert__titleblock">
            <div className="cert__title">{title}</div>
            <div className="cert__week">
              <span>{weekLabel}</span>
            </div>
          </div>

          <div className={'cert__name' + (isCo ? ' cert__name--co' : '')}>
            {isCo ? (
              recipients.map((n, i) => (
                <span key={i} className="cert__name-line">{n}</span>
              ))
            ) : (
              <span className="cert__name-line">{recipients[0]}</span>
            )}
          </div>

          <div className="cert__name-mark" aria-hidden="true" />

          <p className="cert__body">{body}</p>

          <div className="cert__rule cert__rule--foot" />

          <div className="cert__foot">
            <div className="cert__signer">
              <span className="cert__signer-label">As determined by</span>
              <span className="cert__signer-name">{determinedBy}</span>
            </div>
            <div className="cert__colophon">
              <span>{org}</span>
              <span className="cert__colophon-dot" aria-hidden="true">·</span>
              <span>{est}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function CertificateShare({ data = DEFAULT_CERT, speech = DEFAULT_SPEECH }) {
  const certRef = React.useRef(null);
  const [downloading, setDownloading] = React.useState(false);
  const [sharing, setSharing]         = React.useState(false);
  const [copied, setCopied]           = React.useState(false);

  const canShareFiles = (() => {
    try {
      return typeof navigator !== 'undefined'
          && typeof navigator.share === 'function'
          && typeof navigator.canShare === 'function';
    } catch { return false; }
  })();

  const filename = () => {
    const slug = slugify(data.recipients[0]);
    const num = data.determinationNumber ?? 'x';
    return `hybrid-athletes-d${num}-${slug}.png`;
  };

  const renderPng = async () => capturePng(certRef.current);

  // Side-effect: when running in live (Supabase) mode, also drop the PNG
  // into the certificates bucket so the artifact has a stable URL we can
  // attach to the determinations row in a follow-up.
  const archive = async (blob) => {
    if (!blob) return;
    const recipientSlug = slugify(data.recipients[0]);
    try {
      await uploadCertificate(blob, { determinationNumber: data.determinationNumber ?? 0, recipientSlug });
    } catch (e) {
      console.warn('certificate archive failed', e);
    }
  };

  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const blob = await renderPng();
      if (!blob) return;
      archive(blob);
      const file = new File([blob], filename(), { type: 'image/png' });
      const payload = {
        files: [file],
        title: 'Hybrid Athlete of the Week',
        text: speech,
      };
      if (navigator.canShare && navigator.canShare(payload)) {
        await navigator.share(payload);
      } else if (navigator.share) {
        await navigator.share({ title: payload.title, text: speech });
        download(blob, filename());
      } else {
        download(blob, filename());
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') console.error('share failed', e);
    } finally {
      setSharing(false);
    }
  };

  const onDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await renderPng();
      if (blob) {
        archive(blob);
        download(blob, filename());
      }
    } catch (e) {
      console.error('certificate render failed', e);
    } finally {
      setDownloading(false);
    }
  };

  const onCopySpeech = async () => {
    try {
      await navigator.clipboard.writeText(speech);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = speech;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="certshare">
      <div className="certshare__stage">
        <Certificate data={data} innerRef={certRef} />
      </div>

      <div className="certshare__actions">
        {canShareFiles && (
          <button
            type="button"
            className="certshare__btn certshare__btn--primary"
            onClick={onShare}
            disabled={sharing}
          >
            {sharing ? (
              <span className="certshare__btn-loading">
                Preparing<span className="certshare__dots"><span>.</span><span>.</span><span>.</span></span>
              </span>
            ) : (
              <>
                <span>Share Certificate</span>
                <span className="certshare__btn-arrow" aria-hidden="true">↗</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          className={'certshare__btn ' + (canShareFiles ? 'certshare__btn--ghost' : 'certshare__btn--primary')}
          onClick={onDownload}
          disabled={downloading}
        >
          {downloading ? (
            <span className="certshare__btn-loading">
              Rendering<span className="certshare__dots"><span>.</span><span>.</span><span>.</span></span>
            </span>
          ) : (
            <>
              <span>Download Certificate</span>
              <span className="certshare__btn-arrow" aria-hidden="true">↓</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="certshare__btn certshare__btn--ghost"
          onClick={onCopySpeech}
        >
          <span>{copied ? 'Copied to clipboard' : 'Copy Speech'}</span>
          <span className="certshare__btn-arrow" aria-hidden="true">
            {copied ? '✓' : '⧉'}
          </span>
        </button>
      </div>

      <p className="certshare__hint">
        {canShareFiles
          ? 'Send straight to the group chat, or save the PNG for the record.'
          : 'Drop the certificate into the group chat alongside your speech. The Committee files both into the record.'}
      </p>
    </div>
  );
}

export default Certificate;
