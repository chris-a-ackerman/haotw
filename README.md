# Hybrid Athlete of the Week

The official record office of the Hybrid Athletes — a running group that takes a weekly award seriously enough to certify it. Each week the reigning champion crowns the next winner, the speech is logged verbatim, the AI distills it into deadpan certificate language, and the resulting PNG drops back into the group chat as the document of record.

## Stack

- **Vite + React 18** — single-page app, single `index.html` entry.
- **Supabase** (optional) — auth (email/password + Google OAuth), Postgres for the record, Storage for certificate PNGs and avatars, an Edge Function that proxies the Anthropic API for certificate generation.
- **html2canvas** — captures the certificate component to a sharable PNG.
- **framer-motion** — staggered entrance animations on the stats screen.

When Supabase env vars are unset, every service falls back to `localStorage` so the app still runs end-to-end without any backend. This is intentional — it's how the design originally worked, and it's the right experience for a stranger cloning the repo.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle in dist/
npm run preview      # serve the production bundle locally
```

No `.env.local` required for dev. Sign up with anything; the claim flow uses the seeded 14-name roster.

### Routing

Client-side routing via `react-router-dom` v6. Routes: `/`, `/archive`, `/stats`, `/issue` (champion-gated), `/certificate` (latest, standalone), `/certificate/:number` (specific award), `/notice`, `/admin/backfill`. Unknown paths redirect to `/`. Deploying to a static host that doesn't auto-rewrite to `index.html` (Vercel/Netlify/Cloudflare Pages handle this) requires a SPA fallback rule, e.g. a `_redirects` file containing `/* /index.html 200`.

## Wire up Supabase

1. **Create a project** at supabase.com (or run `supabase start` for local dev).

2. **Apply the schema:**
   ```bash
   # local
   supabase db reset
   # hosted: paste supabase/migrations/0001_init.sql + supabase/seed.sql
   # into the SQL editor in the dashboard
   ```

   Tables created: `profiles`, `hybrid_profiles`, `profile_claims`, `determinations`. Storage buckets: `certificates`, `avatars`. RLS policies and a `handle_new_user` trigger are included.

3. **Enable Google OAuth** (Supabase dashboard → Authentication → Providers → Google). Add `http://localhost:5173` to the allowed redirect URLs while developing.

4. **Deploy the Edge Function:**
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   # optional: override the default Haiku model
   # supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5-20251001
   supabase functions deploy generate-certificate
   ```

5. **Fill `.env.local`:**
   ```bash
   cp .env.example .env.local
   # edit .env.local with the project URL and anon key from
   # Supabase dashboard → Project Settings → API
   ```

6. **Restart `npm run dev`.** The app is now live: signups create real `auth.users` rows, the issue wizard calls Anthropic via the Edge Function, certificate downloads also archive the PNG to the `certificates` bucket.

To go back to localStorage-only mode (e.g. for offline demos), rename `.env.local` and restart.

## Project layout

```
src/
├── main.jsx                # entry; CSS imports + ReactDOM.createRoot wrapped in BrowserRouter
├── App.jsx                 # session/auth shell + route table
├── context/AppContext.jsx  # session, determinations, isChampion provider
├── components/             # one file per screen + AuthGate, AppLayout, ChampionRoute, CertificateScreen
└── lib/
    ├── supabase.js         # client factory (null when env unset)
    ├── auth.js             # signIn/signUp/google/signOut + Supabase fallback
    ├── claims.js           # roster + claim ↔ profile_claims table
    ├── records.js          # determinations CRUD + 14-row demo seed
    └── certificate.js      # html2canvas capture + Storage upload helpers
src/styles/                 # tokens.css first; one BEM-prefixed sheet per screen
supabase/
├── migrations/0001_init.sql
├── seed.sql                # the 14-name roster
└── functions/generate-certificate/   # Anthropic proxy (Deno)
```

## Voice

Institutional. Deadpan. Faux-19th-century-bureaucracy: "The Committee," "Determination," "stands," roman numerals on certificate numbers. Every string in the app should match this register — the humor lives in the content, not the chrome. The original design brief is at `uploads/hybrid-athlete-wiring-prompt-wire-up.md`.

## What's prototyped vs. what's wired

- ✅ Auth (email/password + Google), claim flow, record list, stats, certificate share/download, issue wizard with mock fallback — all working.
- ✅ Supabase service layer is shaped for one-flag-flip activation; no component-side changes needed when you fill `.env.local`.
- ⚠️ "Champion" detection is currently `true` for any signed-in user. The TODO in `src/App.jsx` is to derive it from the latest determination's `winners[]` matching the active user's `hybrid_profile`.
- ⚠️ The issue wizard files the determination text record but doesn't yet capture/upload the certificate PNG at file time. The PNG is uploaded when the user clicks Download/Share on the existing certificate route.
