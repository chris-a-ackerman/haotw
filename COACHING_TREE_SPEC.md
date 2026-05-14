# Coaching Tree — Feature Specification

A relational record of how the Hybrid Athletes came to be a group. Where the Official Record (`/archive`) catalogues *what happened*, the Coaching Tree catalogues *who is here, and how*. Lineage by recruitment, lineage by parentage, and the lateral connection that fused two sub-trees into one.

Filed by the Office of the Registrar. Read-only for the membership; editable by the Registrar.

---

## 1. Concept

### 1.1 What it is
A canonical, browsable record of the Hybrid Athletes coaching tree as historically maintained by Jake Bernhardt on a private PDF. Two surfaces:

1. **The Coaching Tree** (`/tree`) — a vertically scrolling indented tree, readable by any signed-in member.
2. **The Office of the Registrar** (`/tree/admin`) — a form-based admin surface, gated to `profiles.is_admin = true`.

### 1.2 What it adds
- A second identity surface alongside `/stats` (the Hybrids leaderboard). Where `/stats` is the *current* state, `/tree` is the *provenance*.
- Non-member identities: four mothers anchor the tree, do not appear in `/stats`, and are not Hybrid Profiles in the existing sense.
- A first-class system of **Distinctions** — many-to-many labels on people (BC alumni, MIT Sloan, Sugarloaf finishers, etc.) that the Registrar can author and bulk-apply.

### 1.3 Tone
Plain names in tree contexts ("Will Clifford"), not the formal address used in Citations ("Mr. T. J. Clifford"). The Tree is the *who*; the Determinations are the *formal record*. Everything else (headers, microcopy, empty states) stays in the established institutional register — "Office of the Registrar," "Inscribed in the Tree," "Lateral Connection," "Distinctions."

---

## 2. Information architecture

### 2.1 Routes

| Path | Screen | Notes |
|---|---|---|
| `/tree` | The Coaching Tree | Full indented tree, all members + non-members. Read-only for everyone. |
| `/tree/:slug` | Lineage of [Person] | Drill-in for a single member: upstream, downstream, lateral. Slug is `slugify(display_name)`. |
| `/tree/admin` | Office of the Registrar | Tabbed admin surface. Gated by `profiles.is_admin`. Non-admins redirect to `/tree`. |

Non-members do not get a `/tree/:slug` route. Tapping them in the tree opens an inline tile in place (see §5.3).

### 2.2 Hamburger drawer
Adds **Coaching Tree (V)** after Hybrids (III) and Issue Determination (IV when champion). Admins also see **Office of the Registrar (VI)** below it.

### 2.3 Cross-references
- `HybridProfileSheet` (in `/stats`) gains a small row: **"Inscribed in the Coaching Tree → View Lineage"** that links to `/tree/:slug` with `state: { from: 'stats' }`.
- The Lineage view's "The Hybrid Profile" section has a reciprocal **"View Hybrid Profile →"** that opens the existing sheet at `/stats?profile=<name>`.

---

## 3. The Coaching Tree (canonical entity)

The tree is the graph induced by `relationships` over `hybrid_profiles`. It is not stored as a tree per se — it is a directed graph with typed edges that happens to be acyclic in practice.

### 3.1 Edge kinds

| Kind | Meaning | Example | Editable in admin? |
|---|---|---|---|
| `parent` | Non-member mother of a member; family origin. | Allison Bernhardt → Jake Bernhardt | Yes |
| `recruited` | Member-to-member: A brought B into the Hybrid Athletes. | Jake Bernhardt → Chris Ackerman | Yes |
| `strava_dm` | Lateral connection: how two otherwise-disjoint sub-trees met. Arrow direction matters and is preserved (`from` initiated). | Paul Flanagan → Jake Bernhardt | **No.** One-off, seeded once. The Registrar can edit the `note` but not the kind or direction. |

A person may have multiple inbound edges (e.g., a hybrid is both the son of his mother and recruited by another hybrid). The Lineage view distinguishes them visually.

### 3.2 Roots
Roots are people with no inbound `parent` or `recruited` edge. In the seed: the four mothers. New members added later by the Registrar may or may not be roots depending on whether the Registrar specifies inbound edges.

---

## 4. Identity model — extensions

### 4.1 People are still Hybrid Profiles
The existing `hybrid_profiles` table holds every node in the tree, members and non-members alike. The unified cast keeps joins clean and gives every node a single canonical identifier.

A new `is_member` flag separates the two casts. Members default true. Members appear in `/stats` and may be claimed by accounts. Non-members do not appear in `/stats`, cannot be claimed, and have no `HybridProfileSheet`.

### 4.2 Photos
Photos for both members and non-members are stored in `hybrid_profiles.photo_url`. Member rows that have been claimed prefer the claiming account's `profiles.photo_url` (existing behavior in `listProfilesWithPhotos`); the `hybrid_profiles.photo_url` is the fallback. Non-members have only `hybrid_profiles.photo_url`. When no photo exists at all, the tree renders initials with the existing styling.

### 4.3 Admin
A `profiles.is_admin` boolean (default false) gates `/tree/admin`. Seeded `true` for Jake Bernhardt's row. Mirrors the `ADMIN_EMAILS` pattern from `AdminBackfill.jsx` but as a DB flag, since admin is a longer-lived role than a one-shot backfill.

---

## 5. Data architecture

### 5.1 Postgres schema additions

```sql
-- 5.1.1 Extend hybrid_profiles
ALTER TABLE hybrid_profiles
  ADD COLUMN is_member    boolean NOT NULL DEFAULT true,
  ADD COLUMN photo_url    text,
  ADD COLUMN slug         text UNIQUE;   -- generated from display_name; used for /tree/:slug

-- 5.1.2 Relationships
CREATE TABLE relationships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_person  int  NOT NULL REFERENCES hybrid_profiles(id) ON DELETE CASCADE,
  to_person    int  NOT NULL REFERENCES hybrid_profiles(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('recruited','parent','strava_dm')),
  note         text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (from_person, to_person, kind),
  CHECK (from_person <> to_person)
);
CREATE INDEX ON relationships (to_person);
CREATE INDEX ON relationships (from_person);

-- 5.1.3 Distinctions (labels)
CREATE TABLE distinctions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text UNIQUE NOT NULL,    -- "2024 Sugarloaf Marathon Finisher"
  short_name   text NOT NULL,           -- "Sugarloaf '24 · Finisher"
  icon         text,                    -- emoji or asset URL
  color        text,                    -- hex; used for chip background
  description  text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE person_distinctions (
  person_id     int  NOT NULL REFERENCES hybrid_profiles(id) ON DELETE CASCADE,
  distinction_id uuid NOT NULL REFERENCES distinctions(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, distinction_id)
);

-- 5.1.4 Admin flag
ALTER TABLE profiles
  ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
```

### 5.2 Row Level Security
- `hybrid_profiles`: read-all for authed (unchanged). Writes: previously `hybrid_profiles` was read-only (seed data); writes now permitted via a `SECURITY DEFINER` function that checks `is_admin`.
- `relationships`: read-all for authed. Writes via same admin-gated function.
- `distinctions`, `person_distinctions`: read-all for authed. Writes via admin-gated function.
- `profiles.is_admin`: read-all but writable only by service role (intentionally not self-promotable; admin is bootstrapped via seed/migration).

### 5.3 Service layer

New module `src/lib/tree.js`, dual-mode like every other lib:

- `listPeople()` — every `hybrid_profiles` row + their `distinctions[]`; joined with claim status for members.
- `listRelationships()` — every edge with `kind`, `note`, both person ids.
- `listDistinctions()` — every distinction with member count.
- `personBySlug(slug)` — single person + their distinctions + upstream + downstream + lateral.
- `getTree()` — the assembled graph object: `{ people, relationships, distinctions }` — used by `/tree` to render in one pass.

Admin writes:
- `createPerson`, `updatePerson`, `deletePerson`
- `createRelationship`, `updateRelationship`, `deleteRelationship`
- `createDistinction`, `updateDistinction`, `deleteDistinction`, `applyDistinction(personIds, distinctionId)`, `removeDistinction(personIds, distinctionId)`

### 5.4 localStorage keys (dev fallback)

- `haotw.tree.people` — array of people including non-members.
- `haotw.tree.relationships` — array of edges.
- `haotw.tree.distinctions` — array of distinctions + their members.
- Seeded on first read from the constants in `src/lib/tree.js` (same pattern as `INITIAL_RECORDS`).

---

## 6. The Coaching Tree (`/tree`)

### 6.1 Layout

Header masthead matching the existing screens:
- Folio label: **OFFICE OF THE REGISTRAR · COACHING TREE**
- Title: **The Coaching Tree**
- Subtitle: *"Inscribed by the Office of the Registrar. Most recent entry: [date of last admin write]."*

Body: a vertically scrolling indented tree, top-down from the roots.

### 6.2 Tree rendering

Per-row anatomy:
- **Portrait** (32px, circular, BAA blue ring for members, muted ring for non-members) or initials fallback.
- **Name** in serif, plain form ("Will Clifford"). Members in primary text; non-members in secondary text.
- Below name, tracked-caps row of **Distinction chips**: icon + short_name, BAA blue or the distinction's stored color.
- Below chips, in muted mono: **"Brought to the Tree by [Name]"** when the row has an inbound `recruited` or `parent` edge. Multi-source rows (both parent and recruiter) read **"Brought to the Tree by [Parent], introduced to the Hybrid Athletes by [Recruiter]."**

Indent depth reflects tree depth from a root. The first two levels are expanded by default; deeper branches collapse behind a chevron and the count "+N below."

### 6.3 Visual grouping
- **Troubled Soles Run Club, Franklin MA** — the three moms who share that Distinction render with a thin BAA-blue bracket at top-left of their portrait cluster and a small header chip "**Troubled Soles Run Club — Franklin, MA**" sitting above them. Linda Flanagan, not in TSRC, renders as a separate root without the bracket.
- **Lateral Connections** — the Paul ↔ Jake edge renders as a horizontal dashed BAA-blue connector between their rows, annotated in tracked caps: **LATERAL CONNECTION · VIA STRAVA DM · INBOUND TO BERNHARDT**.

### 6.4 Interaction
- Tap a **member** row → navigates to `/tree/:slug`.
- Tap a **non-member** row → expands the row in place into a non-member tile (§6.6). Tap again to collapse. Only one tile open at a time.
- Tap the chevron → expand/collapse that branch.
- Tap a **Distinction chip** → opens a small popover listing every person with that Distinction; each name links to their lineage (member) or expands their tile (non-member).

### 6.5 Empty / loading
- Loading: *"The Registrar is consulting the tree."*
- Error: *"The tree is temporarily inaccessible. The Registrar has been notified."*
- (No empty state — the tree is seeded.)

### 6.6 Non-member inline tile

Replaces the row when expanded; not a drawer, not a sheet. Anatomy:
- Portrait (larger, 64px) and plain name.
- One-line subtitle, e.g. *"Member of Troubled Soles Run Club — Franklin, MA"* or *"Mother of Paul Flanagan."*
- A "**Mother of**" line listing the member child(ren), each linking to their lineage.
- A "**Disciples introduced to the Tree**" line, when applicable, listing the disciples (used for the TSRC moms whose disciples are Ryan Dombroski and Logan Liljeberg).
- No CTA, no link to a profile sheet — these identities exist only here.

---

## 7. Lineage of [Person] (`/tree/:slug`)

### 7.1 Header
- Folio: **OFFICE OF THE REGISTRAR · COACHING TREE · LINEAGE**
- Title: **Lineage of [Plain Name]** — e.g. *"Lineage of Jake Bernhardt."*
- Subtitle: *"Inscribed in the Coaching Tree on [date]."* — derives from the person's `created_at`, or the earliest inbound edge if the row was seeded.
- Back link: respects `location.state.from` (`'tree'` or `'stats'`).

### 7.2 Sections (in order)

**Upstream**
- *"Brought to the Tree by [Plain Name]."* with portrait + Distinctions of the upstream person.
- If both `parent` and `recruited` inbound: render both, with the parent first.
- For a root member (no inbound), this section is omitted entirely.

**The Hybrid Profile**
- Portrait, plain name, the person's full set of Distinction chips.
- "**View Hybrid Profile →**" link to `/stats?profile=<name>` — surfaces the existing `HybridProfileSheet` with its wins, citations, Strava, etc.

**Downstream**
- *"[Plain Name] has brought N hybrid(s) into the Coaching Tree."* (Empty: *"No disciples on record."*)
- A small inline mini-tree of recruits, recursive one level deep with a "+N below" affordance to walk further.
- Each name links to that person's lineage.

**Lateral Connections** — only rendered if the person has at least one `strava_dm` edge.
- For each lateral edge: *"Connected to [Other Plain Name] via Strava DM. The introduction was [inbound|outbound]."* with portrait + Distinctions.

### 7.3 Footer
Colophon: *"The Office of the Registrar · Coaching Tree · [today]."*

---

## 8. The Office of the Registrar (`/tree/admin`)

Gated by `profiles.is_admin`. Non-admins redirect to `/tree`. Three tabs.

Folio: **OFFICE OF THE REGISTRAR**
Title: **Administration**
Subtitle: *"Inscription, amendment, and excision of records."*

### 8.1 People tab

Top: a **"+ Inscribe a Person"** button.

Below: a table of all `hybrid_profiles`, sortable by name / is_member / distinction count. Each row: portrait, plain name, member badge or "Non-member" badge, distinction count, recruit count, edit/delete actions.

**Inscribe a Person form** (modal or dedicated subpage `/tree/admin/people/new`):
- Display name (required)
- Is member? (toggle; default true)
- Photo upload or URL (optional)
- *Member-only:* Strava URL, Achievement of Note — these mirror the existing `profiles` fields. (If the person ever claims the profile via account creation, their account values take precedence; this is just seed.)
- Distinctions: multi-select picker against existing distinctions, plus "+ New Distinction" inline to jump to creating one without losing form state
- Inbound relationships: one or more `(kind, from_person)` rows, with "Add another" affordance. Picker is searchable across all people.
- Outbound recruited relationships: optional, since most new entries are leaves; "Add another" affordance, kind hardcoded to `recruited`.
- Lateral connections: not editable here. (See 8.3.)

**Edit Person form** — same fields, prefilled. Plus inline edit of all current inbound/outbound edges. Plus a "**Excise from the Tree**" destructive action with a typed-confirmation modal (*"Type the person's name to confirm. This cannot be undone."*). Cascading deletes through `relationships` and `person_distinctions`.

Microcopy:
- Save → *"Inscribed."*
- Edit save → *"Amended."*
- Delete → *"Excised."*

### 8.2 Distinctions tab

Top: a **"+ Author a Distinction"** button.

Below: list of all distinctions, each with: icon, short_name (chip-styled), full name, member count, edit/delete actions.

**Author a Distinction form:**
- Name (full, used for popover title and admin display)
- Short name (used in chips and inline lists)
- Icon (emoji input or image URL — emoji is the v1 path; URL is supported but not surfaced in the picker yet)
- Color (hex picker; defaults to BAA blue if omitted)
- Description (optional)
- **Apply to** — multi-select people picker; checked people will receive the Distinction immediately on save. (This is the "bulk apply at create time" path.)

**Distinction detail / edit page** — `/tree/admin/distinctions/:id`:
- Edit form for name, short_name, icon, color, description
- A **Members** section: a checklist of every person, with their current membership in this Distinction checked. Toggling and saving applies/removes in bulk via `applyDistinction` / `removeDistinction`. (This is the ongoing maintenance path.)
- **Delete Distinction** — typed-confirmation modal; cascades through `person_distinctions`.

Microcopy:
- *"Authored."* / *"Amended."* / *"Excised. Members no longer bear this Distinction."*

### 8.3 Relationships tab

Mostly diagnostic. People-level editing in §8.1 covers 90% of relationship work.

- Full list of all edges, filterable by kind and by person.
- Inline edit of `note` on any edge.
- Add a new `recruited` or `parent` edge (same as the People tab affordance, but standalone).
- The single `strava_dm` edge is rendered read-only with a note-edit field. Kind and direction are immutable.

---

## 9. Voice and copy

### 9.1 Plain-names rule
The Coaching Tree surfaces — `/tree`, `/tree/:slug`, `/tree/admin`, and the new HybridProfileSheet cross-reference — use **plain display names** everywhere a person is referred to. This is the only place in the app that does so. Citations, Determinations, the Notice screen, and the certificate continue to use formal address.

Rationale: the Tree mirrors the PDF Jake has been maintaining; the PDF uses plain names; the tone is a list of people, not a formal pronouncement.

### 9.2 Section / surface names

| Concept | UI string |
|---|---|
| The feature | The Coaching Tree |
| The admin surface | Office of the Registrar |
| The admin role | Registrar |
| A label | Distinction |
| Adding a person | Inscribe |
| Editing | Amend |
| Deleting | Excise |
| The `strava_dm` edge | Lateral Connection · via Strava DM |
| Membership in TSRC | Troubled Soles Run Club — Franklin, MA |

### 9.3 Microcopy reference

- Tree loading: *"The Registrar is consulting the tree."*
- Lineage empty downstream: *"No disciples on record."*
- Lineage empty upstream (root): section omitted.
- Lineage of a mother: *"This identity exists only in the Tree."* — no actual lineage route exists, but if anyone deep-links to a non-member slug, this is the 404-style copy.
- Admin save: *"Inscribed."* / *"Amended."*
- Admin delete confirm: *"Type the name to excise from the Tree. This cannot be undone."*
- Admin delete success: *"Excised."*
- Distinction bulk apply: *"Distinction applied to N members."*
- Strava DM edge annotation in the tree: **LATERAL CONNECTION · VIA STRAVA DM · INBOUND TO [SURNAME]**

---

## 10. Seed data

Derived from `Hybrid_Athlete_Coaching_Tree_2026_05_12_v03.pdf`. Inserted via a new migration, idempotent against the existing `hybrid_profiles` seed.

### 10.1 Non-member people (4)

| Display Name | Notes |
|---|---|
| Linda Liljeberg | TSRC. Mother of Logan Liljeberg. |
| Laura Dombroski | TSRC. Mother of Ryan Dombroski. |
| Allison Bernhardt | TSRC. Mother of Jake Bernhardt. |
| Linda Flanagan | Mother of Paul Flanagan. Not TSRC. |

Inserted with `is_member = false`.

### 10.2 Distinctions (6)

| Name | Short name | Icon | Notes |
|---|---|---|---|
| Troubled Soles Run Club — Franklin, MA | Troubled Soles | 🏃‍♀️ | Applied to Linda L., Laura D., Allison B. |
| Disciple of the Troubled Soles Coaching Tree | Troubled Soles Disciple | 🏃 | Applied to Ryan Dombroski, Logan Liljeberg. |
| Attended Boston College | BC | 🦅 | Jake B., James Helf, Paul F., Franco N., Dan L. |
| Currently at MIT Sloan | MIT Sloan | 🏛️ | Jake B., Chris A., Josh B., Ed C., Paul F. |
| 2024 Sugarloaf Marathon Finisher | Sugarloaf '24 · Finisher | 🔺 | Jake B., Paul F. |
| 2024 Sugarloaf Marathon Participant | Sugarloaf '24 · Participant | 🔻 | Ed C., Long T., Caleb S., Hank M., Will C. |

Colors default to BAA blue. The Registrar may amend after seeding.

### 10.3 Relationships

**Parent edges (4):**
- Linda Liljeberg → Logan Liljeberg
- Laura Dombroski → Ryan Dombroski
- Allison Bernhardt → Jake Bernhardt
- Linda Flanagan → Paul Flanagan

**Recruited edges (11):**
- Jake Bernhardt → Chris Ackerman
- Jake Bernhardt → Josh Beasley
- Jake Bernhardt → Ed Coleman
- Jake Bernhardt → James Helf
- Paul Flanagan → Franco Nieto
- Paul Flanagan → Long Tran
- Paul Flanagan → Caleb Shulman
- Long Tran → Hank McGreen
- Long Tran → Will Clifford
- Long Tran → Dan Lignos
- Will Clifford → Clem Carranza

**Lateral edge (1):**
- Paul Flanagan → Jake Bernhardt (`kind = strava_dm`, `note = "Inbound to Bernhardt from Flanagan via Strava DM"`)

### 10.4 Open seed question
The PDF visually shows Ryan Dombroski above Logan Liljeberg connected by a vertical line. This is ambiguous: either (a) Ryan recruited Logan into the Hybrid Athletes, or (b) they are independently disciples of TSRC with no inter-recruitment edge. The seed does **not** create a Ryan → Logan edge by default. The Registrar can add one in the admin People tab if (a) is correct.

### 10.5 Admin seed
`profiles.is_admin = true` for the row owned by the account claiming `Jake Bernhardt`. Applied via a migration that runs `UPDATE profiles SET is_admin = true WHERE hybrid_profile = 'Jake Bernhardt'`.

---

## 11. Implementation order

1. Migrations: schema additions + seed data (people, distinctions, edges, admin flag).
2. `src/lib/tree.js` — read-side service (`listPeople`, `listRelationships`, `listDistinctions`, `personBySlug`, `getTree`) with dual-mode dispatch.
3. `/tree` read view + tree rendering component.
4. `/tree/:slug` lineage view.
5. Hamburger drawer entries (V and conditional VI).
6. Cross-link from `HybridProfileSheet`.
7. `src/lib/tree.js` — write-side service (admin CRUD).
8. `/tree/admin` shell + tab routing.
9. People tab: list, inscribe, amend, excise.
10. Distinctions tab: list, author, amend, excise; member checklist.
11. Relationships tab: list, edit notes, add edges, read-only strava_dm.
12. RLS + SECURITY DEFINER admin function.
13. Polish, animations, mobile review.

---

## 12. What's intentionally not yet wired

1. **Graph visualization.** Vertical indented tree only for v1. No pan-zoom / force-directed graph.
2. **Distinction typing.** Distinctions are free-form (name + icon + color). No typed Distinction system (e.g., "Race Result" with year/finisher slots). Revisit if many race-year Distinctions accumulate.
3. **Bidirectional `strava_dm` editing.** The edge is seeded once. Adding new lateral connections requires a manual migration. Surfaces a clear admin tab UI affordance only for `note` editing.
4. **Image uploads for Distinction icons.** Emoji input is the v1 path; URLs work but aren't surfaced in the picker.
5. **Audit log for admin actions.** Edits are immediate, no undo, no history. The Registrar is trusted by construction.
6. **Self-promotion to admin.** `profiles.is_admin` is read-only from the client. Bootstrapped via migration, future grants via service role only.

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **The Coaching Tree** | The relational record of the Hybrid Athletes. |
| **The Office of the Registrar** | The admin surface and narrative authority for the Tree. |
| **The Registrar** | Admin role. Seeded to Jake Bernhardt. |
| **Distinction** | A many-to-many label on a person (BC alum, Sugarloaf finisher, etc.). |
| **Inscribe** | Add a person, Distinction, or edge to the record. |
| **Amend** | Edit. |
| **Excise** | Delete. |
| **Lateral Connection** | A non-hierarchical edge. Currently only `strava_dm`. |
| **Disciple** | Common usage in the group; refers specifically to TSRC-coached members in the seed but is not a privileged term in the schema. |
| **Non-member** | A `hybrid_profiles` row with `is_member = false`. Exists only in the Tree. |
