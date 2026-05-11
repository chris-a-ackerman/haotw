// AuthScreen.jsx — three-step gate: sign-in → passcode → sign-up.
// Backed by the auth service (localStorage in dev, Supabase in live mode).

import React from 'react';
import * as Auth from '../lib/auth.js';

const HAOTW_PASSCODE = 'HAOTW';

function AuthMasthead({ folio }) {
  return (
    <>
      <header className="haauth__masthead">
        <div className="haauth__wordmark">
          <span className="haauth__wordmark-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10.25" stroke="#1A1A1A" strokeWidth="0.75"/>
              <circle cx="11" cy="11" r="7.75" stroke="#1A1A1A" strokeWidth="0.5"/>
              <text x="11" y="14.2" textAnchor="middle"
                    fontFamily='"Bodoni Moda", Didot, serif'
                    fontWeight="700" fontSize="9" fill="#003DA5"
                    letterSpacing="-0.02em">H</text>
            </svg>
          </span>
          <span className="haauth__wordmark-text">Hybrid Athletes</span>
        </div>
        <span className="haauth__folio">{folio}</span>
      </header>
      <hr className="haauth__hairline" />
    </>
  );
}

function AuthColophon() {
  return (
    <div className="haauth__colophon">
      <span>The Committee</span>
      <span>Members Only</span>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="haauth__google-mark" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.03l3.01-2.32z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.97L3.97 7.3C4.68 5.18 6.66 3.58 9 3.58z"/>
    </svg>
  );
}

function SignInPanel({ onAuthed, onWantSignUp, onWantRecover }) {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError]       = React.useState(null);
  const [busy, setBusy]         = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Both fields are required.');
      return;
    }
    setBusy(true);
    const r = await Auth.signIn({ email: email.trim(), password });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onAuthed(r.session);
  };

  const google = async () => {
    setBusy(true);
    const r = await Auth.signInWithGoogle();
    setBusy(false);
    if (r.ok && r.session) onAuthed(r.session);
    else if (!r.ok) setError(r.error || 'Google sign-in failed.');
    // When live, OAuth redirects away — onAuthStateChange will handle it.
  };

  return (
    <main className="haauth__main">
      <img
        src="/ha-seal.png"
        alt=""
        aria-hidden="true"
        className="haauth__seal haauth__rise"
      />
      <span className="haauth__overline haauth__rise" style={{ animationDelay: '60ms' }}>Members Entrance</span>
      <h1 className="haauth__title haauth__rise" style={{ animationDelay: '120ms' }}>
        Sign in to the record.
      </h1>
      <p className="haauth__lede haauth__rise" style={{ animationDelay: '200ms' }}>
        Access is reserved for Committee-recognized members.
        Present your credentials to continue.
      </p>

      <form className="haauth__form haauth__rise" onSubmit={submit}
            style={{ animationDelay: '280ms' }} noValidate>
        <div className="haauth__field">
          <label className="haauth__label" htmlFor="auth-email">
            <span>Email of Record</span>
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            className={'haauth__input' + (error ? ' is-error' : '')}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="member@example.com"
          />
        </div>

        <div className="haauth__field">
          <label className="haauth__label" htmlFor="auth-password">
            <span>Passphrase</span>
            <button
              type="button"
              className="haauth__swap-link haauth__label-link"
              onClick={() => onWantRecover(email)}
            >
              Forgot passphrase?
            </button>
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            className={'haauth__input' + (error ? ' is-error' : '')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="••••••••"
          />
          {error && <span className="haauth__error">{error}</span>}
        </div>

        <button type="submit" className="haauth__submit" disabled={busy}>
          <span>{busy ? 'Verifying…' : 'Continue'}</span>
          <span className="haauth__submit-arrow" aria-hidden="true">→</span>
        </button>
      </form>

      <div className="haauth__or haauth__rise" style={{ animationDelay: '360ms' }}>
        <span>Or</span>
      </div>

      <button type="button" className="haauth__google haauth__rise"
              onClick={google} style={{ animationDelay: '400ms' }} disabled={busy}>
        <GoogleMark />
        <span>Continue with Google</span>
      </button>

      <div className="haauth__swap haauth__rise" style={{ animationDelay: '460ms' }}>
        <span>Not yet on the rolls?</span>
        <button type="button" className="haauth__swap-link" onClick={onWantSignUp}>
          Register
        </button>
      </div>
    </main>
  );
}

function PasscodePanel({ onPass, onBack }) {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef(null);
  const cells = 5;

  React.useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  const onChange = (v) => {
    const cleaned = v.replace(/[^a-zA-Z0-9]/g, '').slice(0, cells).toUpperCase();
    setCode(cleaned);
    setError(false);
  };

  const submit = (e) => {
    if (e) e.preventDefault();
    if (code.toUpperCase() === HAOTW_PASSCODE) {
      onPass();
    } else {
      setError(true);
    }
  };

  React.useEffect(() => {
    if (code.length === cells) {
      const t = setTimeout(submit, 180);
      return () => clearTimeout(t);
    }
  }, [code]);

  const cellChars = Array.from({ length: cells }, (_, i) => code[i] || '');

  return (
    <main className="haauth__main">
      <button type="button" className="haauth__back" onClick={onBack}>
        <span className="haauth__back-arrow" aria-hidden="true">←</span>
        <span>Return to sign in</span>
      </button>

      <span className="haauth__overline haauth__rise">Invitation Required</span>
      <h1 className="haauth__title haauth__rise" style={{ animationDelay: '60ms' }}>
        Present your passcode.
      </h1>
      <p className="haauth__lede haauth__rise" style={{ animationDelay: '140ms' }}>
        Registration is by invitation of the Committee.
        Enter the passcode you were issued to begin.
      </p>

      <form onSubmit={submit} className="haauth__rise"
            style={{ animationDelay: '220ms' }} noValidate>
        <div
          className="haauth__cipher"
          onClick={() => inputRef.current && inputRef.current.focus()}
        >
          {cellChars.map((ch, i) => (
            <span
              key={i}
              className={
                'haauth__cipher-cell' +
                (ch ? ' is-filled' : '') +
                (error ? ' is-error' : '') +
                (focused && !error && i === code.length ? ' is-active' : '')
              }
            >
              {ch || ''}
            </span>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={cells}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Invitation passcode"
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 1, height: 1,
          }}
        />

        {error && (
          <span className="haauth__error" style={{ marginTop: 16, justifyContent: 'center' }}>
            Passcode not recognized.
          </span>
        )}

        <button
          type="submit"
          className="haauth__submit"
          disabled={code.length !== cells}
        >
          <span>Verify Passcode</span>
          <span className="haauth__submit-arrow" aria-hidden="true">→</span>
        </button>
      </form>
    </main>
  );
}

function SignUpPanel({ onAuthed, onBack }) {
  const [name, setName]         = React.useState('');
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [photo, setPhoto]       = React.useState(null);
  const [error, setError]       = React.useState(null);
  const [busy, setBusy]         = React.useState(false);
  const fileRef = React.useRef(null);

  const onPhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Name, email, and passphrase are required.');
      return;
    }
    if (password.length < 6) {
      setError('Passphrase must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const r = await Auth.signUp({
      name: name.trim(),
      email: email.trim(),
      password,
      photo,
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onAuthed(r.session);
  };

  const initial = (name.trim()[0] || '').toUpperCase();

  return (
    <main className="haauth__main">
      <button type="button" className="haauth__back" onClick={onBack}>
        <span className="haauth__back-arrow" aria-hidden="true">←</span>
        <span>Re-enter passcode</span>
      </button>

      <span className="haauth__overline haauth__rise">Registration</span>
      <h1 className="haauth__title haauth__rise" style={{ animationDelay: '60ms' }}>
        Take a seat in the record.
      </h1>
      <p className="haauth__lede haauth__rise" style={{ animationDelay: '140ms' }}>
        Particulars filed below are kept for the duration
        of your membership and not otherwise.
      </p>

      <form className="haauth__form haauth__rise" onSubmit={submit}
            style={{ animationDelay: '220ms' }} noValidate>
        <div className="haauth__field">
          <label className="haauth__label" htmlFor="su-name">
            <span>Name in Full</span>
          </label>
          <input
            id="su-name"
            type="text"
            autoComplete="name"
            className="haauth__input"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="Theodore J. Clifford"
          />
        </div>

        <div className="haauth__field">
          <label className="haauth__label" htmlFor="su-email">
            <span>Email of Record</span>
          </label>
          <input
            id="su-email"
            type="email"
            autoComplete="email"
            className={'haauth__input' + (error && /email/i.test(error) ? ' is-error' : '')}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="member@example.com"
          />
        </div>

        <div className="haauth__field">
          <label className="haauth__label" htmlFor="su-pass">
            <span>Passphrase</span>
            <span className="haauth__label-hint">six characters or more</span>
          </label>
          <input
            id="su-pass"
            type="password"
            autoComplete="new-password"
            className="haauth__input"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="••••••••"
          />
        </div>

        <div className="haauth__field">
          <label className="haauth__label">
            <span>Likeness</span>
            <span className="haauth__label-hint">optional</span>
          </label>
          <div className="haauth__photo">
            <span className="haauth__photo-disc" aria-hidden="true">
              {photo
                ? <img src={photo} alt="" />
                : (initial || '·')}
            </span>
            <div className="haauth__photo-actions">
              <button
                type="button"
                className="haauth__photo-btn"
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                {photo ? 'Replace photograph' : 'Attach photograph'}
              </button>
              <span className="haauth__photo-meta">
                {photo ? 'Filed for the record.' : 'JPEG or PNG. To be filed.'}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => onPhoto(e.target.files && e.target.files[0])}
            />
          </div>
        </div>

        {error && <span className="haauth__error">{error}</span>}

        <button type="submit" className="haauth__submit" disabled={busy}>
          <span>{busy ? 'Filing…' : 'File Registration'}</span>
          <span className="haauth__submit-arrow" aria-hidden="true">→</span>
        </button>
      </form>
    </main>
  );
}

function RecoverPanel({ initialEmail, onSentToReset, onBack }) {
  const [email, setEmail] = React.useState(initialEmail || '');
  const [error, setError] = React.useState(null);
  const [busy, setBusy]   = React.useState(false);
  const [sent, setSent]   = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) { setError('An email of record is required.'); return; }
    setBusy(true);
    const r = await Auth.requestPasswordReset({ email: email.trim() });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    if (r.devReset) { onSentToReset(email.trim()); return; }
    setSent(true);
  };

  return (
    <main className="haauth__main">
      <button type="button" className="haauth__back" onClick={onBack}>
        <span className="haauth__back-arrow" aria-hidden="true">←</span>
        <span>Return to sign in</span>
      </button>

      <span className="haauth__overline haauth__rise">Restoration of Access</span>
      <h1 className="haauth__title haauth__rise" style={{ animationDelay: '60ms' }}>
        Mislaid your passphrase?
      </h1>
      <p className="haauth__lede haauth__rise" style={{ animationDelay: '140ms' }}>
        Submit the email on file. The Committee will dispatch instructions for
        restoring access.
      </p>

      {sent ? (
        <div className="haauth__notice haauth__rise" style={{ animationDelay: '220ms' }}>
          <span className="haauth__overline">Filed</span>
          <p>If that email is on file, instructions have been dispatched to it.</p>
        </div>
      ) : (
        <form className="haauth__form haauth__rise" onSubmit={submit}
              style={{ animationDelay: '220ms' }} noValidate>
          <div className="haauth__field">
            <label className="haauth__label" htmlFor="rec-email">
              <span>Email of Record</span>
            </label>
            <input
              id="rec-email"
              type="email"
              autoComplete="email"
              className={'haauth__input' + (error ? ' is-error' : '')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="member@example.com"
            />
            {error && <span className="haauth__error">{error}</span>}
          </div>
          <button type="submit" className="haauth__submit" disabled={busy}>
            <span>{busy ? 'Dispatching…' : 'Dispatch Instructions'}</span>
            <span className="haauth__submit-arrow" aria-hidden="true">→</span>
          </button>
        </form>
      )}
    </main>
  );
}

function ResetPanel({ email, onAuthed, onBack }) {
  const [pass, setPass]       = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError]     = React.useState(null);
  const [busy, setBusy]       = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pass.length < 6) {
      setError('Passphrase must be at least 6 characters.');
      return;
    }
    if (pass !== confirm) {
      setError('The two passphrases do not match.');
      return;
    }
    setBusy(true);
    const r = await Auth.completePasswordReset({ email, password: pass });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    onAuthed(r.session);
  };

  return (
    <main className="haauth__main">
      {onBack && (
        <button type="button" className="haauth__back" onClick={onBack}>
          <span className="haauth__back-arrow" aria-hidden="true">←</span>
          <span>Return to sign in</span>
        </button>
      )}

      <span className="haauth__overline haauth__rise">Restoration of Access</span>
      <h1 className="haauth__title haauth__rise" style={{ animationDelay: '60ms' }}>
        File a new passphrase.
      </h1>
      <p className="haauth__lede haauth__rise" style={{ animationDelay: '140ms' }}>
        Enter the passphrase that will replace the one on file.
        Six characters or more.
      </p>

      <form className="haauth__form haauth__rise" onSubmit={submit}
            style={{ animationDelay: '220ms' }} noValidate>
        <div className="haauth__field">
          <label className="haauth__label" htmlFor="reset-pass">
            <span>New Passphrase</span>
            <span className="haauth__label-hint">six characters or more</span>
          </label>
          <input
            id="reset-pass"
            type="password"
            autoComplete="new-password"
            className={'haauth__input' + (error ? ' is-error' : '')}
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(null); }}
            placeholder="••••••••"
          />
        </div>
        <div className="haauth__field">
          <label className="haauth__label" htmlFor="reset-confirm">
            <span>Confirm Passphrase</span>
          </label>
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            className={'haauth__input' + (error ? ' is-error' : '')}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(null); }}
            placeholder="••••••••"
          />
          {error && <span className="haauth__error">{error}</span>}
        </div>
        <button type="submit" className="haauth__submit" disabled={busy}>
          <span>{busy ? 'Filing…' : 'File New Passphrase'}</span>
          <span className="haauth__submit-arrow" aria-hidden="true">→</span>
        </button>
      </form>
    </main>
  );
}

function AuthScreen({ onAuthed, initialStep }) {
  const [step, setStep] = React.useState(initialStep || 'signin');
  const [recoverEmail, setRecoverEmail] = React.useState('');

  const folio =
    step === 'signin'   ? 'Members Entrance'  :
    step === 'passcode' ? 'Passcode Required' :
    step === 'signup'   ? 'Registration'      :
    step === 'recover'  ? 'Restoration'       :
    step === 'reset'    ? 'New Passphrase'    : '';

  return (
    <div className="haauth">
      <AuthMasthead folio={folio} />

      {step === 'signin' && (
        <SignInPanel
          onAuthed={onAuthed}
          onWantSignUp={() => setStep('passcode')}
          onWantRecover={(typedEmail) => {
            setRecoverEmail(typedEmail || '');
            setStep('recover');
          }}
        />
      )}
      {step === 'passcode' && (
        <PasscodePanel
          onPass={() => setStep('signup')}
          onBack={() => setStep('signin')}
        />
      )}
      {step === 'signup' && (
        <SignUpPanel
          onAuthed={onAuthed}
          onBack={() => setStep('passcode')}
        />
      )}
      {step === 'recover' && (
        <RecoverPanel
          initialEmail={recoverEmail}
          onSentToReset={(em) => { setRecoverEmail(em); setStep('reset'); }}
          onBack={() => setStep('signin')}
        />
      )}
      {step === 'reset' && (
        <ResetPanel
          email={recoverEmail}
          onAuthed={onAuthed}
          onBack={initialStep === 'reset' ? null : () => setStep('signin')}
        />
      )}

      <AuthColophon />
    </div>
  );
}

export default AuthScreen;
