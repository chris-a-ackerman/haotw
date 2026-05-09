# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A clickable browser app for **Hybrid Athlete of the Week (HAOTW)** — an institutional/parody "record office" web app for a running group's weekly award. The voice is deadpan-bureaucratic; the humor is in the content, not the chrome. Original spec lives at `uploads/hybrid-athlete-wiring-prompt-wire-up.md`.

The codebase started as a Claude-Design–authored static prototype (Babel-in-browser, React via CDN, every component on `window`, three localStorage stores faking auth/claims/records). It has since been migrated to a Vite app with a service-layer abstraction so the localStorage stubs can be swapped for Supabase via env vars.

## Run / build

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
```

No `.env.local` is required for dev — when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset, every service in `src/lib/` falls back to its localStorage implementation and the app is fully exercisable. The `README.md` covers wiring Supabase.

There are no tests and no linter wired in. There is no global type system — files are `.jsx` not `.tsx`.

## Architecture

### View routing in `src/App.jsx`

Single `view` state (`'home' | 'archive' | 'stats' | 'crown' | 'certificate' | 'notice' | 'award-detail'`). No React Router. A document-level click delegate intercepts `<a href="*.html">` clicks and translates them to view changes via the `HREF_TO_VIEW` map — that's why every screen still uses ordinary `href="record.html"` anchors. When you add a new screen, add the `*.html` → view-id mapping there.

`App.jsx` also owns the two gates that render before any screen: **auth** (no `session` → `<AuthScreen>`) and **claim** (session exists but `session.hybridProfile` is null → `<ClaimScreen>`). Both are rendered to completion before the main app mounts, so the rest of the components can assume `session` and `session.hybridProfile` exist.

### Service layer in `src/lib/`

Every cross-cutting concern is a single file with named exports. Each one checks `isLive()` (true when Supabase env vars are set) and dispatches to one of two implementations:

- `supabase.js` — `supabase` client (or `null`); `isLive()`.
- `auth.js` — `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `loadSession`, `onAuthStateChange`, `updateUser`, `updatePhoto`, `setHybridProfile`. The session shape is `{ email, name, photo, hybridProfile?, provider?, user_id? }`. `name` and `photo` live in `user_metadata` + the `profiles` table.
- `claims.js` — `listProfiles`, `unclaimed`, `claim`, `match`, `transferEmail`, `reset`. Owns the 14-name `HYBRID_PROFILES` const which is also the seed in `supabase/seed.sql`.
- `records.js` — `listDeterminations`, `createDetermination`. Owns `INITIAL_RECORDS` (the 10-week demo dataset that seeds localStorage on first read).
- `certificate.js` — `capturePng` (html2canvas), `uploadCertificate` (Storage), `download`, `slugify`.

**The component layer never changes** when toggling between live and dev modes — components call `auth.signIn(...)` regardless of backend. All service-layer calls are async, including the localStorage paths, so the API stays uniform.

### Component conventions

- Every component is a default export, in `src/components/<Name>.jsx`. Cross-component types/helpers (e.g. `Certificate`, `DEFAULT_CERT`, `DEFAULT_SPEECH`) are named exports from the file that owns them.
- Champion gating: `App.jsx`'s `isChampion` is currently `!!session` (every signed-in user is treated as champion). The `// TODO` near it documents the next step: derive champion status from "latest determination's `winners[]` matches active user's `hybrid_profile`".
- `NoticeScreen` accepts `isChampion` as a prop. `IssueScreen` accepts `issuer={session}` so the certificate signature reflects who's filing.
- The `CertificateShare` component (in `Certificate.jsx`) is the only thing that calls `html2canvas`. When live, it also archives the captured PNG to the `certificates` Storage bucket as a side effect — silently, on download/share.

### Supabase wiring

- **Database:** `profiles`, `hybrid_profiles`, `profile_claims`, `determinations`. RLS policies + a `handle_new_user` trigger that auto-creates a `profiles` row on signup. See `supabase/migrations/0001_init.sql`.
- **Storage:** `certificates` and `avatars` buckets, both public.
- **Edge Function:** `supabase/functions/generate-certificate/` proxies the Anthropic Messages API. Reads `ANTHROPIC_API_KEY` from secrets, defaults to `claude-haiku-4-5-20251001` (override with `ANTHROPIC_MODEL`), applies the same markdown-strip pipeline that used to run client-side, and returns `{ text }`. Errors return `{ text: "" }` with status 200 so the client falls back to `MOCK_CERTIFICATE`.

`IssueScreen` calls the Edge Function via `supabase.functions.invoke('generate-certificate', { body: { prompt } })` only when `isLive()`; in dev mode it skips the call and uses the mock directly. The 2-second floor (`Promise.all([call, setTimeout(2000)])`) holds in both modes — it's a UX choice.

### Styling

- Design tokens in `src/styles/tokens.css` as CSS custom properties (BAA palette: `--baa-blue #003DA5`, `--baa-yellow #FFDB00`; serif/sans/mono families; full type scale). Reference these — never hardcode brand colors.
- One CSS file per screen plus `app.css` for cross-screen chrome (hamburger drawer, scrim, exit-confirm modal). All eleven are imported in `src/main.jsx` in the same order the original `index.html` linked them (tokens first).
- BEM-ish prefixes per screen: `hahome__`, `harec__`, `hastat__`, `haissue__`, `hanotice__`, `haclaim__`, `haauth__`, `haaccount__`, `cert__`, plus `happs-` for app-level chrome. Keep new classes inside the screen's prefix.
- Animations are CSS-driven (look for `*__rise` and `*__draw` classes; stagger via inline `style={{ animationDelay: '${ms}ms' }}` — see the `delay()` helper at the top of `HomeScreen.jsx`). The exception is `StatsScreen.jsx`, which uses `framer-motion` directly.

## Conventions worth preserving

- **Voice is the product.** Institutional, deadpan, faux-19th-century. "The Committee," "Determination," "filed," "stands," roman numerals. The wiring spec under `uploads/` is the canonical reference.
- **Co-winner display.** `winners` is always an array. Single → render plain; ≥2 → `Name · Name` or stacked + a `CO-DETERMINATION` yellow tag. See `joinNames()` in `IssueScreen.jsx` for the canonical join.
- **Anchor interception.** Screens use `<a href="record.html">`-style links rather than imperative `navigate()` calls. The delegate in `App.jsx` translates them. When adding a screen, register its `*.html` → view-id mapping there.
- **localStorage seeding.** `records.js` seeds the 10-week demo dataset on first read so a fresh dev session ships with realistic data. Don't replace this with empty-state on dev — losing the seed degrades the design review experience.

## What's intentionally not wired yet

- **PNG capture at file-time.** The Issue wizard saves the determination's text record but does not yet capture the certificate PNG. Capture happens when the user later clicks Download/Share from the certificate route. Either flow is fine; doing both is the cleanup.
- **True champion detection.** See the `// TODO` in `App.jsx`. Implementing it requires querying `determinations` for the most recent row and comparing against the active user's claimed `hybrid_profile`.
- **OAuth provider config.** `supabase/config.toml` ships with Google disabled by default. Configure it through the Supabase dashboard for a hosted project; the auth gate already calls `signInWithOAuth({ provider: 'google' })` when `isLive()`.
