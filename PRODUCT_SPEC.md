# Hybrid Athlete of the Week — Product Specification

The official record office of the Hybrid Athletes, a running group that takes a weekly award seriously enough to certify it. The app is a production tool and an archive; the group chat remains the core. Each week the reigning champion crowns the next winner, the speech is filed verbatim, an AI distills it into deadpan certificate language, and the resulting PNG drops back into the group chat as the document of record.

---

## 1. Concept

### 1.1 What it is
An institutional/parody "record office" web app. The interface is entirely straight-faced; the humor lives in the content. The Committee issues Determinations, members are Hybrid Profiles, awards are filed and indelible.

### 1.2 Who it's for
A closed roster of 14 named members of the Hybrid Athletes (see §6.2). Registration is gated by an invitation passcode (`HAOTW`); only people with the passcode can create an account.

### 1.3 The weekly loop
1. The reigning champion writes a speech in the group chat naming the next winner(s).
2. They open the app, paste the speech, and the Committee (Claude) issues 2–4 sentences of formal Determination language.
3. They preview the certificate, file it into the record, and download/share the PNG back to the group chat.
4. The new winner becomes the current champion; the cycle repeats.

### 1.4 Tone (non-negotiable)
Institutional. Deadpan. Faux-19th-century bureaucracy: "The Committee," "Determination," "stands," "filed," "in re," roman numerals on certificate numbers. Every string in the app matches this register. The original brief is at `uploads/hybrid-athlete-wiring-prompt-wire-up.md`.

---

## 2. Primary user journeys

### 2.1 First-time member (claim flow)
Open → **Members Entrance** → "Register" → enter invitation passcode → fill particulars (name, email, passphrase, optional photo, optional Strava URL, optional Achievement of Note) → **ClaimScreen** offers a heuristic match against the 14-name roster → confirm or browse the full roster → "Filed" stamp → enter the app at Home.

### 2.2 Returning member
Open → **Members Entrance** → sign in (email/password or Google OAuth) → Home. Sessions persist via Supabase (or localStorage in dev).

### 2.3 Champion issues a Determination
Home → "Choose the next HAOTW" link (only rendered for the current champion) → **Issue Determination** wizard (single-page, scrolling): pick recipient(s) → paste speech → "Generate Certificate" (Committee deliberates ~2s) → review preview → "Enter into Record" → confirmation modal → filed.

### 2.4 Any member browses the record
Home → "Official Record" → reverse-chronological list of all Determinations → tap row to expand the full speech → "View & Share Certificate" → certificate route with Download/Share/Copy-Speech actions.

### 2.5 Any member browses members
Home → hamburger → "Hybrids" → stats table → tap a row → **HybridProfileSheet** drawer (portrait, Strava handle, achievement, list of wins) → tap a win → certificate.

### 2.6 Shared certificate link
Anyone with a `/certificate/:number` link can hit it without signing in (standalone route, no chrome). The latest determination is also reachable at `/certificate` for the same purpose.

---

## 3. Information architecture

### 3.1 Routes (react-router-dom v6, client-side)

| Path | Screen | Notes |
|---|---|---|
| `/` | Home | Current champion, latest certificate, "Choose the next HAOTW" link for champions |
| `/archive` | Official Record | Reverse-chrono list, expand to read speech, link to per-cert page |
| `/stats` | Hybrids | Leaderboard, all members, "Notable Statistics" appendix, opens HybridProfileSheet on row tap |
| `/issue` | Issue Determination wizard | Champion-gated (`<ChampionRoute>` redirects non-champions to `/`) |
| `/certificate` | Standalone certificate | No chrome; renders the latest determination. Outside `AuthGate` so a shared link works without sign-in. |
| `/certificate/:number` | Chromed certificate | Specific determination; Return link reads `location.state.from` (`'archive'` or `'stats'`) |
| `/notice` | Notice of Delinquency | Demo/instrumented screen — shows the escalating language used when a determination is overdue (1 / 3 / 5+ days) |
| `/admin/backfill` | AdminBackfill | One-shot tool, allowlisted by email, renders + uploads PNGs for legacy rows where `certificate_url IS NULL` |
| `*` (under AuthGate) | redirect to `/` | |

Unknown paths under the chrome redirect home. Deploying to a static host requires a SPA fallback (`/* /index.html 200`).

### 3.2 Global chrome (`AppLayout`)
- **Hamburger button**, top-right, present on every chromed route. Opens a slide-in drawer.
- **Drawer items** (institutional, with roman numerals): Current Champion (I), Official Record (II), Hybrids (III). When `isChampion`, append Issue Determination (IV).
- **Account row** in the drawer surfaces the active member's portrait, name, email, and a hint: "Edit particulars →" or "Edit · Claim Hybrid Profile →" if unclaimed.
- **AccountSheet**: a right-side drawer opened from the account row. Lets the member amend particulars (name, email, passphrase, Strava URL, Achievement of Note), replace their portrait, and claim a Hybrid Profile if not yet claimed.
- **Sign out** lives in the drawer.

### 3.3 Pre-app gates (`AuthGate`)
1. `authReady === false` → blank busy state.
2. `recoveryMode` (Supabase fired `PASSWORD_RECOVERY`) → `AuthScreen` opened at the Reset step.
3. No `session` → `AuthScreen` at Sign In.
4. `session` but no `session.hybridProfile` and not `claimSkipped` → `ClaimScreen`.
5. Otherwise render children.

`AuthScreen` is a five-step state machine: `signin` → `passcode` → `signup` → `recover` → `reset`. Each step shares the masthead and folio label.

---

## 4. The Determination (canonical entity)

A Determination is the canonical unit of the record. It has:

| Field | Type | Notes |
|---|---|---|
| `determinationNumber` | int, unique | Display as `No. 14`; certificate uses arabic, profile sheet uses roman numerals |
| `current` (`is_current`) | bool | Exactly one row should be `true`; filing a new row flips the previous one off |
| `coDetermination` | derived | Computed from `winners.length > 1`. Surfaces a yellow "Co-Determination" tag in the chrome |
| `winners` | string[] | Hybrid Profile display names (the seeded roster). Always rendered as an array — `Name` or `Name · Name` |
| `determiner` | string | The crowning champion's Hybrid Profile name |
| `determinedOn` (`determined_on`) | date | Stored as ISO date in Supabase, free-form string in localStorage seed |
| `citation` | text | The deadpan, AI-distilled, 2–4 sentence certificate language. Ends with "The determination stands." |
| `speech` | text | The verbatim speech as written. Permanent, unedited |
| `certificateUrl` (`certificate_url`) | text, nullable | Public Storage URL of the captured PNG; populated either at file-time (future), at first download/share, or via the backfill admin tool |
| `created_by` | uuid (live only) | `auth.users.id`. Null for legacy rows backfilled before accounts existed |

**Co-Determination handling**: wherever a winner appears (home, archive, certificate, stats, profile sheet), single names render plain and multiples render joined. `Certificate.jsx` stacks them; `HomeScreen` uses `·`; `IssueScreen` uses `joinNames()` for prose ("X and Y", "X, Y, and Z").

**Immutability**: the confirmation modal in the Issue wizard says "Once filed, the Citation cannot be amended." The UI honors this — there is no edit path. (The Supabase RLS policy currently permits updates for any authenticated user; tightening to a champion-only function is a follow-up.)

---

## 5. Champion gating

A user is the current champion iff:
- They are signed in,
- Their session has a claimed `hybridProfile`, and
- The latest Determination's `winners[]` includes that profile name.

Derived in `App.jsx` from `session.hybridProfile` and `latestDetermination.winners`. Exposed as `isChampion` on `AppContext`. Used to:
- Show the "Choose the next HAOTW" link on Home.
- Show "Issue Determination (IV)" in the hamburger drawer.
- Permit `/issue` access via `<ChampionRoute>`.
- Switch `/notice` to the champion-addressed variant (with a CTA to issue, vs. "Awaiting Determination" for everyone else).

After a successful file, the previous champion's `isChampion` flips to `false` (they're no longer in `winners[]`) and the new winner's flips to `true` the next time their session resolves.

---

## 6. Member identity model

### 6.1 Two-layer identity
- **Account**: an `auth.users` row + a `profiles` row keyed by `user_id`. Holds login credentials, name, photo, optional Strava URL, optional Achievement of Note. Fully editable by the owner.
- **Hybrid Profile**: an entry on the 14-name roster (`hybrid_profiles`). The thing the record actually addresses. Each Hybrid Profile may be claimed by exactly one account (`profile_claims` enforces this with a unique index).

The two are linked by `profiles.hybrid_profile` (denormalized name) plus the canonical `profile_claims(hybrid_profile_id, user_id)` row.

### 6.2 The roster (seed)
```
Chris Ackerman, Jake Bernhardt, Caleb Shulman, Will Clifford,
Ryan Dombroski, Paul Flanagan, Logan Liljeberg, Long Tran,
Ed Coleman, Hank McGreen, Josh Beasley, Dan Lignos,
Franco Nieto, James Helf
```
Identical in `supabase/seed.sql` and the `HYBRID_PROFILES` constant in `src/lib/claims.js`. Names with stronger institutional flavor (e.g. "Theodore J. Clifford") appear in the demo `INITIAL_RECORDS` but are not on the seeded roster.

### 6.3 Claim heuristic
`claims.match(fullName, unclaimedList)` is a pure token-overlap scorer with a last-name bonus. Threshold ≥ 2; below that the ClaimScreen falls back to the full roster with search.

### 6.4 Skipping claim
A member can opt to "Proceed without designation." Their session enters the app without a `hybridProfile`. They can browse but never become champion. They can claim later from the AccountSheet.

---

## 7. Data architecture

### 7.1 Dual-mode service layer (`src/lib/`)
Every cross-cutting concern is a single file with named async exports that check `isLive()` (true when Supabase env vars are set) and dispatch to one of two implementations: a Supabase path or a localStorage fallback. **The component layer never changes** between modes. All service-layer calls are async, including localStorage paths, so the API stays uniform.

Modules:
- `supabase.js` — client factory (`null` when env unset); `isLive()`; cached auth context for error logging.
- `auth.js` — `signIn`, `signUp`, `signInWithGoogle`, `requestPasswordReset`, `completePasswordReset`, `signOut`, `loadSession`, `onAuthStateChange`, `updateUser`, `updatePhoto`, `setHybridProfile`.
- `claims.js` — `listProfiles`, `listProfilesWithPhotos`, `unclaimed`, `claim`, `match` (sync, pure), `transferEmail`, `reset`. Owns the roster constant.
- `records.js` — `listDeterminations`, `createDetermination`. Owns `INITIAL_RECORDS` (the 10-week demo dataset that seeds localStorage on first read).
- `certificate.js` — `capturePng` (html2canvas), `uploadCertificate` (Storage), `download`, `slugify`, `buildCertPayload`.
- `stats.js` — pure aggregation over the upstream services (`listProfiles` + `listDeterminations`). No backend of its own; identical behavior in either mode.

### 7.2 Postgres schema (Supabase)

```
profiles (
  user_id        uuid pk → auth.users.id,
  name           text not null default '',
  photo_url      text,
  hybrid_profile text,
  strava_url     text,
  achievement    text,
  created_at, updated_at  timestamptz
)

hybrid_profiles (
  id           serial pk,
  display_name text unique not null
)

profile_claims (
  hybrid_profile_id int pk → hybrid_profiles.id,
  user_id           uuid → auth.users.id,
  claimed_on        timestamptz,
  unique (user_id)  -- one claim per user
)

determinations (
  id                   uuid pk default gen_random_uuid(),
  determination_number int unique not null,
  is_current           bool not null,
  winners              text[] not null,
  determiner           text not null,
  determined_on        date not null,
  citation             text not null,
  speech               text not null,
  certificate_url      text,
  created_by           uuid → auth.users.id,
  created_at           timestamptz
)
```

### 7.3 Row Level Security
RLS is enabled on every public table.
- `profiles`: any authenticated user reads (the friend-group drawer surfaces other members); each user inserts/updates only their own row.
- `hybrid_profiles`: read-only for authed users (it's a seeded roster).
- `profile_claims`: read-all for authed users; insert/delete only one's own claim.
- `determinations`: read-all; insert/update permitted for any authed user (the UI gates this to the champion; tightening to a SECURITY DEFINER function is a follow-up).

### 7.4 Storage buckets
- `certificates` (public) — captured PNGs, named `d<NN>-<slug>-<ts>.png`.
- `avatars` (public) — currently unused; portraits are inlined as data URLs in user metadata + `profiles.photo_url`. The bucket exists so the migration to file uploads is a one-line client change.

### 7.5 Triggers
`handle_new_user()` runs `AFTER INSERT ON auth.users` and upserts a `profiles` row, forwarding `name`, `photo`/`avatar_url`, `strava_url`, and `achievement` from `raw_user_meta_data`. This is what makes claim-flow + post-signup edits work without an extra client write.

### 7.6 localStorage keys (dev fallback)
- `haotw.users` — array of `{name, email, password, photo, stravaUrl, achievement}`.
- `haotw.session` — current `Session` object.
- `haotw.claims` — `{ [hybridProfileName]: { email, claimedOn } }`.
- `haotw.records` — array of Determinations; seeded once from `INITIAL_RECORDS` on first read.

---

## 8. Auth

### 8.1 Methods
- Email + passphrase (≥ 6 chars).
- Google OAuth (live mode only; Supabase project must have the provider configured). In dev the button mints a fixed mock session.
- Passphrase recovery: live mode dispatches a Supabase reset email; dev mode short-circuits to the inline Reset step if the email is on file.

### 8.2 Registration gate
Sign-up requires a 5-character invitation passcode (`HAOTW`, hardcoded in `AuthScreen.jsx`). Members Entrance → "Register" → Passcode step → SignUp form.

### 8.3 Session shape
```js
{
  user_id?,       // live only
  email,
  name,
  photo,          // data URL or storage URL
  hybridProfile?, // claimed roster name
  stravaUrl?,
  achievement?,
  provider?       // 'google' when applicable
}
```

### 8.4 Voice in auth surfaces
"Members Entrance," "Passphrase," "Email of Record," "File Registration," "Restoration of Access," "Mislaid your passphrase?", "Dispatch Instructions." Errors are deadpan: "Email or password not on file."

---

## 9. The Issue wizard (`/issue`)

A single scrolling page (not a multi-step modal). Champion-gated via `<ChampionRoute>`. Four sections in numbered order, with the certificate preview always visible and live-updating:

1. **§ I · Select Recipient(s)** — grid of all Hybrid Profiles with portraits or initials. The issuer's own card is disabled and labeled "(you)". Selecting two members shows "Co-determination. Noted."; three or more shows "Joint determination of N. Noted." There is no hard cap on count.
2. **§ II · Official Speech** — large textarea, no character minimum. Word count + "Stored as written" caption. Editing after generating clears the generated citation.
3. **§ III (generation)** — "Generate Certificate" button. When pressed: button enters loading state with the line "The Committee is deliberating…" and an animated ellipsis; a skeleton renders in the panel below. A `Promise.all([fetch, setTimeout(2000)])` ensures a minimum 2-second deliberation beat regardless of how fast the model responds. Once ready the panel shows the generated text with a "Regenerate →" link.
4. **§ IV · Certificate Preview** — a live mini-certificate, updating as recipients/citation change. Caption: "The following will be entered into the permanent record."

Then a primary CTA: **Enter into Record →**. This opens a confirmation modal — "This determination is permanent. Once filed, the Citation cannot be amended. Proceed?" Confirming calls `createDetermination()`, flips the prior `is_current` off, files the new row, and renders a filed state: "Filed Boston, Mass. · HH:MM EDT. The record is closed." plus a link to view the new entry in the Official Record.

### 9.1 Generation prompt
The prompt sent to the Edge Function instructs Claude to act as "The Committee," produce 2–4 sentences of purely institutional language about the recipient(s), use only facts from the speech, refer to recipients by formal name (e.g. "Mr. T. J. Clifford"), avoid humor/praise/flourish, note any gastrointestinal/weather/logistical incidents factually, and end with "The determination stands." It explicitly forbids markdown.

A client-side `stripMarkdown()` pipeline (and an identical one on the Edge Function) belt-and-suspenders the no-markdown requirement.

### 9.2 Fallback
On any failure — network error, missing API key, blank model response, or running without Supabase env vars — the wizard substitutes a `MOCK_CERTIFICATE` template so the wizard always completes.

### 9.3 The Anthropic proxy (Edge Function)
`supabase/functions/generate-certificate/`. Reads `ANTHROPIC_API_KEY` from secrets. Defaults to model `claude-haiku-4-5-20251001` (override via `ANTHROPIC_MODEL`). Hits `https://api.anthropic.com/v1/messages` with `max_tokens: 800`. Returns `{ text }`. On any error returns `{ text: "" }` with HTTP 200 so the client can fall back cleanly. Strips markdown server-side as well.

---

## 10. The Certificate artifact

### 10.1 Form
A square (400 × 400 design dimensions) institutional document with: org wordmark and seal, "Hybrid Athlete of the Week" (or "Hybrid Athletes of the Week" for co-determinations), `No. N · Date`, the recipient name(s) large (stacked for co-winners), the citation body in serif, an "As determined by" sigline, and `Hybrid Athletes · Est. 2023` colophon.

### 10.2 Capture
`html2canvas` snapshots the live DOM node at `scale: 3` with `backgroundColor: '#FAFAF8'`. Output: a PNG blob.

### 10.3 Three actions on `/certificate[/:number]`
- **Share Certificate** — only shown when `navigator.canShare(files)` is supported (mobile primarily). Posts the PNG + speech as `navigator.share()` payload.
- **Download Certificate** — saves the PNG via a synthesized `<a download>` click.
- **Copy Speech** — `navigator.clipboard.writeText(speech)`, with a 1.8s "Copied to clipboard" confirmation.

In live mode, both Share and Download also call `uploadCertificate()` as a fire-and-forget side effect, archiving the PNG to the `certificates` bucket.

### 10.4 Where certificates are reached
- Home — the embedded mini-cert is a `Link` that opens `/certificate` in a new tab.
- Official Record — each row's "View & Share Certificate" CTA navigates to `/certificate/:number` with `state: { from: 'archive' }`.
- HybridProfileSheet — each win row navigates to `/certificate/:number` with `state: { from: 'stats', profile }` so Return preserves the open profile drawer.
- Standalone — `/certificate` shows the latest determination with no chrome (no auth gate, no hamburger). This is the canonical share link.

---

## 11. The Official Record (`/archive`)

Reverse-chronological list of every determination. Each row shows:
- A label: `Current Determination` (for the latest) or `No. N` (historical).
- A yellow `Co-Determination` chip when applicable.
- Winner name(s).
- `Determined by <Determiner> · <Date>`.
- The citation (clamped until expanded).
- A "Read full speech →" toggle that reveals the verbatim speech and a "View & Share Certificate" CTA.

End-of-list dingbat: `❦ End of Record ❦`. Footer colophon: `The Committee · Hybrid Athlete of the Week · <today>`.

---

## 12. Hybrids (`/stats`)

The membership table.

- **Leader card**: the member with the most wins (ties broken by most recent crowning). Name large, win count in BAA blue.
- **All Members table**: every Hybrid Profile, with portrait, name, win count, and "Last Crowned" (short date or em-dash). Sorted by wins desc, then by name. Zero-win rows render `0` with a muted style — the 0 is commentary enough.
- **Notable Statistics appendix**: currently a single row, "Co-Determinations Issued (historic)."
- **Row tap** opens the **HybridProfileSheet** as a right-side drawer.

### 12.1 HybridProfileSheet
Read-only drawer. Sections:
- Hero — portrait, "Member of Record," display name, optional Achievement of Note, optional Strava link, "Hybrid Profile · Unclaimed" tag when no account has claimed the name.
- "Determinations on the Record" — every win for this Hybrid Profile, with roman numeral, `No. N · Date`, "Co-Determination" chip when applicable, joined winner names, and a row arrow. Tap navigates to `/certificate/:number` with `state: { from: 'stats', profile }`.

Selection is reflected in the URL via `?profile=<name>` so a back-from-certificate restores the drawer.

---

## 13. Notice (`/notice`)

A demo screen that shows how the home would change if a determination went overdue. Three escalating states, switchable via an in-screen demo bar (1 day / 3 days / 5+ days):

| Days | Heading | Stamp | Tone |
|---|---|---|---|
| 1 | Determination Pending | Overdue · 1 day | neutral |
| 3 | Notice of Delinquency | Delinquent · 3 days | warning |
| 5+ | Formal Notice — No. N | On Record · 5+ days | error ("This is not a good look.") |

The notice has two recipients depending on viewer: the addressed champion ("Mr. T. J. Clifford") sees an "Issue Determination →" CTA; the membership at large sees "Awaiting Determination." Signed by "Marcus A. Devlin, Clerk of the Committee."

Not wired into a real deadline check yet — this is presentation, not behavior.

---

## 14. Admin (`/admin/backfill`)

One-shot historical PNG generator. Allowlisted by email (`ADMIN_EMAILS` in `AdminBackfill.jsx`). Requires live Supabase mode.

Walks `determinations` where `certificate_url IS NULL`, renders each `<Certificate>` off-screen via `createPortal`, waits for two RAFs + `document.fonts.ready` so webfonts are loaded, captures with `html2canvas`, uploads to the `certificates` bucket, and writes the resulting URL back to the row.

Intended to be deleted once backfill is complete (file + route registration in `App.jsx`).

---

## 15. Design system

### 15.1 Tokens (`src/styles/tokens.css`)
- **Background**: `#FAFAF8` off-white.
- **Primary**: `#003DA5` (BAA blue).
- **Accent**: `#FFDB00` (BAA yellow).
- **Text primary**: `#1A1A1A`.
- **Text secondary**: `#555555`.
- **Borders**: 1px, BAA blue, thin and precise.
- **Type**: institutional serif (Bodoni Moda / Didot) for display, sans (Archivo) for tracked uppercase labels, body serif for citations, monospace for folios and meta. The full type scale lives in `tokens.css`.
- **Radius**: minimal — 4px or none.

### 15.2 Component conventions
- Every screen is its own component in `src/components/<Name>.jsx`, default-exported, with a matching `src/styles/<screen>.css` imported in `main.jsx` after `tokens.css`.
- BEM-ish prefixes: `hahome__`, `harec__`, `hastat__`, `haissue__`, `hanotice__`, `haclaim__`, `haauth__`, `haaccount__`, `haprofile__`, `cert__`, plus `happs-` for app chrome.
- Animations are CSS-driven (`*__rise`, `*__draw` classes), staggered with inline `style={{ animationDelay: '${ms}ms' }}` (see the `delay()` helper). The exception is StatsScreen, which uses `framer-motion` directly.

### 15.3 Voice rules of thumb
- Roman numerals on certificate numbers in long-form contexts; arabic in compact contexts.
- "Determined by" not "winner crowned by"; "The Committee" not "the moderators."
- "Filed" not "saved"; "Entered into the record" not "submitted."
- Co-winner copy: "Co-determination. Noted." / "Co-Determination" chip in yellow.
- Microcopy for empty/loading: "Awaiting first Determination," "The Committee is deliberating…", "Filing…", "Drafting…"

---

## 16. Operational modes

| Mode | Trigger | Behavior |
|---|---|---|
| **Dev / localStorage** | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` unset | Every service uses its localStorage path. Demo data seeds on first read. AI generation skipped — wizard uses `MOCK_CERTIFICATE`. Google sign-in mints a fixed mock session. The app is fully exercisable. |
| **Live / Supabase** | both env vars set | Auth, profiles, claims, determinations, certificate storage all hit Supabase. The Issue wizard calls the Anthropic Edge Function. Certificate downloads/shares also archive PNGs to the `certificates` bucket. |

The boundary is `isLive()` in `src/lib/supabase.js`. Component-side code is identical in both modes.

---

## 17. What's intentionally not yet wired

1. **PNG capture at file-time.** The Issue wizard files the row but does not capture the certificate PNG at that moment. The PNG is captured later when a user clicks Download/Share on the certificate route. Doing both at file-time is the cleanup.
2. **Tighter RLS on `determinations` writes.** Currently any authenticated user can insert/update — the UI gates this to the champion. A SECURITY DEFINER function that re-verifies champion status server-side is a follow-up.
3. **Real overdue detection.** `/notice` is presentation only; nothing actually triggers it. A timer-based check against the latest `determined_on` would gate this in production.
4. **Avatar storage.** The `avatars` bucket exists but portraits are still inlined as data URLs. The migration is a one-line client change once we want to stop bloating `profiles.photo_url`.

---

## 18. Stack

- **Vite + React 18** — single-page app, `react-router-dom` v6 client routing, `BrowserRouter` mounted in `main.jsx`.
- **Supabase** — Postgres + Auth (email/password + Google OAuth) + Storage + Edge Functions.
- **Anthropic Messages API** — via the Edge Function proxy. Default model `claude-haiku-4-5-20251001`.
- **html2canvas** — certificate → PNG.
- **framer-motion** — used only on StatsScreen; everywhere else animation is CSS.
- No tests, no linter, no TypeScript. Files are `.jsx`.

---

## 19. Glossary

| Term | Meaning |
|---|---|
| **The Committee** | The narrative authority that issues Determinations. In practice: the app + Claude. |
| **Determination** | A weekly award. Synonymous with the row in `determinations`. |
| **Hybrid Profile** | A row on the seeded roster — the "Member of Record" identity. |
| **Claim** | The act of linking an account to a Hybrid Profile. One-to-one. |
| **Champion** | The current holder. Determined by the most recent Determination's `winners[]`. |
| **Co-Determination** | A Determination with two or more winners. Surfaced with a yellow chip. |
| **Citation** | The 2–4 sentence deadpan certificate body, AI-distilled. |
| **Speech** | The original verbatim message from the crowning champion. The real record. |
| **Filing** | Inserting a row into `determinations`. Permanent. |
