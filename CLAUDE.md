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

### Routing

`react-router-dom` v6 with clean paths, mounted in `src/main.jsx`. Routes: `/`, `/archive`, `/stats`, `/issue` (champion-gated), `/certificate` (latest, standalone, no chrome — opened in a new tab from share), `/certificate/:number` (specific award, with Return link), `/notice`, `/admin/backfill`. Unknown paths redirect to `/`.

`src/App.jsx` is a thin shell: it loads the session, caches `determinations`, derives `isChampion`, and exposes it via `AppContext` (`src/context/AppContext.jsx`) so screens call `useAppContext()` rather than receive props. Two gates live in `src/components/AuthGate.jsx`: **auth** (no `session` → `<AuthScreen>`) and **claim** (`!session.hybridProfile && !claimSkipped` → `<ClaimScreen>`). Chrome (hamburger button, drawer, AccountSheet) lives in `src/components/AppLayout.jsx`. The standalone certificate route is a sibling of the layout, so a shared link reads cleanly without auth nag.

When you add a new screen: drop a `<Route>` in `App.jsx`, nest it under `<AppLayout />` (most cases) or `<ChampionRoute />` for champion-only. Internal links use `<Link to="/path">`; imperative navigation uses `useNavigate()`. The certificate Return link reads `location.state.from` — pass `{ state: { from: 'archive' } }` or `'stats'` when navigating.

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
- Champion gating: `isChampion` is derived in `App.jsx` from the active session's `hybridProfile` matching the latest determination's `winners[]`. `<ChampionRoute>` enforces it at the route level (`/issue` bounces to `/` for non-champions).
- Screens that need session/determinations/isChampion read them via `useAppContext()` instead of receiving props.
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
- **localStorage seeding.** `records.js` seeds the 10-week demo dataset on first read so a fresh dev session ships with realistic data. Don't replace this with empty-state on dev — losing the seed degrades the design review experience.

## What's intentionally not wired yet

- **PNG capture at file-time.** The Issue wizard saves the determination's text record but does not yet capture the certificate PNG. Capture happens when the user later clicks Download/Share from the certificate route. Either flow is fine; doing both is the cleanup.
- **OAuth provider config.** `supabase/config.toml` ships with Google disabled by default. Configure it through the Supabase dashboard for a hosted project; the auth gate already calls `signInWithOAuth({ provider: 'google' })` when `isLive()`.
