# Hybrid Athlete of the Week — Full App Wiring Prompt

## Context

You previously built individual screens for the Hybrid Athlete of the Week web app.
Now wire everything together into a single cohesive React app with real navigation,
shared state, and a complete user flow. The individual screens are reference — rebuild
them cleanly inside this unified app structure.

---

## What This App Is

A responsive web app (primarily used on mobile browsers) that serves as the official
record office for a running group's weekly "Hybrid Athlete of the Week" award. Each
week the reigning champion selects the next winner, pastes in their speech, generates
a deadpan institutional certificate via AI, and downloads it to share in the group chat.
The app is a production tool and archive — the group chat remains the core.

---

## Tech

- React (single file or component-based — whatever fits the artifact)
- Tailwind for styling
- Framer Motion for transitions
- React Router or simple useState-based routing (whichever works cleanly in this context)
- Mock data throughout — no real API calls needed except simulate the AI generation step

---

## Design System

- Background: #FAFAF8 (off-white)
- Primary: #003DA5 (BAA blue)
- Accent: #FFDB00 (BAA yellow)
- Text primary: #1A1A1A
- Text secondary: #555555
- Borders: 1px, #003DA5, thin and precise
- Typography: institutional serif for display names and headings, tracked uppercase
  for labels and section headers, clean body type for citations and prose
- Border radius: minimal — 4px or none
- Animations: Framer Motion, subtle — fade + slight translate, never bouncy
- Tone: the interface is entirely straight-faced. The humor is in the content.

---

## App Structure

### Routing / View State

Manage views with a simple currentView state variable. Views:

- `home` — current champion screen (default)
- `archive` — list of all past awards
- `award-detail` — single award view (used for both current and historical entries)
- `stats` — member statistics
- `crown-step-1` — select winner (champion only)
- `crown-step-2` — paste speech (champion only)
- `crown-step-3` — generate certificate (champion only)
- `crown-step-4` — preview and confirm (champion only)

---

## Navigation

**Hamburger menu** — top right corner, present on every screen.

Menu items:
- Current Champion (→ home)
- Official Record (→ archive)
- Member Statistics (→ stats)
- Issue Determination (→ crown-step-1) — **only visible if currentUser.isChampion is true**

Menu opens as a slide-in drawer or full overlay. Institutional, not playful.
Close on tap outside or on a close button.

**Back navigation** — any non-home screen has a back arrow (top left) that returns
to the logical parent. Crown wizard steps go back to previous step, not home.

---

## Mock Data

```javascript
const mockCurrentUser = {
  id: 'user-1',
  name: 'Marcus Webb',
  isChampion: true  // toggle to false to test non-champion view
}

const mockMembers = [
  { id: 'user-1', name: 'Marcus Webb', avatar: null },
  { id: 'user-2', name: 'Will Clifford', avatar: null },
  { id: 'user-3', name: 'Ed Coleman', avatar: null },
  { id: 'user-4', name: 'Ryan Torres', avatar: null },
  { id: 'user-5', name: 'Logan Pierce', avatar: null },
  { id: 'user-6', name: 'James Holt', avatar: null },
  { id: 'user-7', name: 'Tom Breckenridge', avatar: null },
  { id: 'user-8', name: 'Charlie Owens', avatar: null },
  { id: 'user-9', name: 'Nick Farrell', avatar: null },
  { id: 'user-10', name: 'Sam Doyle', avatar: null },
]

const mockAwards = [
  {
    id: 'award-14',
    weekNumber: 14,
    isCurrent: true,
    winners: ['Will Clifford', 'Ed Coleman'],
    isCoWinner: true,
    crownedBy: 'Marcus Webb',
    date: 'April 28, 2026',
    certificateText: 'Mr. W. Clifford completed the 2026 London Marathon in a time of 2:58:41, six days following his performance at the 130th Boston Athletic Association Marathon. A gastrointestinal episode was noted and resolved mid-race. Mr. E. Coleman completed the Martha\'s Vineyard Half Marathon on the morning of April 27, 2026, establishing a course record. The determination stands.',
    speech: 'Hello fellow hybrids. It\'s with great honor I write to you all to announce this week\'s HAOTW on behalf of all of us who toed the line at Boston a week ago today. After reviewing all data, both qualitative and quantitative, from the previous 7 days, it\'s clear to me that the limit of hybrid performance is far beyond what we ever thought possible. In this last week we had MULTIPLE members of our group conquer races in countries they aren\'t citizens of, one of whom did so while battling an unsettled large intestine while the other casually took home gold.'
  },
  {
    id: 'award-13',
    weekNumber: 13,
    isCurrent: false,
    winners: ['Ryan Torres', 'Logan Pierce'],
    isCoWinner: true,
    crownedBy: 'Will Clifford',
    date: 'April 21, 2026',
    certificateText: 'Mr. R. Torres and Mr. L. Pierce each completed a marathon distance event during the period under review. In a departure from standard procedure, co-determination was issued. Tradition was noted as soft.',
    speech: 'Tradition tells us there can only be one. A singular torchbearer. Tradition, however, is soft. And this week was not. Ryan and Logan both stepped to the line and looked the marathon in the eyes.'
  },
  {
    id: 'award-12',
    weekNumber: 12,
    isCurrent: false,
    winners: ['James Holt'],
    isCoWinner: false,
    crownedBy: 'Ryan Torres',
    date: 'April 14, 2026',
    certificateText: 'Mr. J. Holt completed a 50-mile ultramarathon in conditions described as adverse. He then attended a social engagement the same evening. The record reflects this without comment.',
    speech: 'I spent time in the lab. Reviewed the Strava files. Cross-examined splits. Considered the conditions. James ran 50 miles and then went to a dinner party. I have nothing to add.'
  },
]
```

---

## Screen Specs

### `home` — Current Champion

- Shows the current award (first entry in mockAwards where isCurrent: true)
- Header: "HYBRID ATHLETES" wordmark, hamburger icon top right
- "WEEK 14 · CURRENT DETERMINATION" label in small blue tracked caps
- If co-winners: both names stacked or side by side, "CO-DETERMINATION" yellow tag
- Winner name(s) in large institutional serif — dominant element
- "Crowned by [name] · [date]" in small tracked type
- Certificate text displayed in full — this is the official record
- Thin ruled divider
- "Read full speech ↓" expander — reveals the full speech text below, collapses on tap
- Framer Motion entrance: elements fade + translate up, staggered

### `archive` — Official Record

- Header: "OFFICIAL RECORD"
- Subtitle: "All determinations. Permanent. Indelible."
- List of all awards, reverse chronological
- Each row:
  - "WEEK 14" blue label + "CURRENT" badge if applicable
  - Winner name(s) bold, "CO-DETERMINATION" yellow tag if applicable
  - "Determined by [name] · [date]" small grey
  - Certificate text, 2-line clamp
  - Tap anywhere on the row → navigate to `award-detail` passing the award id
- Thin ruled lines between entries
- Framer Motion: staggered list entrance

### `award-detail` — Single Award View

- Identical layout to `home` screen
- The only difference: label reads "WEEK [N] · OFFICIAL RECORD" instead of "CURRENT DETERMINATION"
- Back arrow top left → returns to `archive`
- Same "Read full speech ↓" expander behavior
- No special treatment — past awards are presented with identical gravity to the current one

### `stats` — Member Statistics

- Header: "MEMBERSHIP STATISTICS"
- Subtitle: "Performance record, current through [date]."
- Top feature card: member with most wins — name large, win count in blue
- Ranked table: all members, columns: Rank · Name · Wins · Last Crowned
- Rank 1 in blue, rest standard weight
- Bottom callout: member with most days since last crown — no editorializing, just the number
- Framer Motion: staggered row entrance

### Crown Wizard — Champion Only

All four steps share:
- Back arrow top left (goes to previous step, or exits wizard on step 1 with confirm)
- Step indicator: "STEP 1 OF 4" in small tracked caps, top center
- No hamburger on wizard steps — reduce distraction

#### `crown-step-1` — Select Recipient(s)

- Header: "ISSUE DETERMINATION"
- Subtext: "The Committee awaits your findings."
- Section label: "SELECT RECIPIENT(S)"
- Member grid (3 columns): avatar circle (initials fallback), name below
  - Current user card dimmed + "YOU" label, not selectable
  - Selected: blue ring + checkmark
  - Second selection allowed — triggers quiet note below grid:
    "Co-determination. Noted. Tradition is soft."
  - Max 2 selections
- "Continue →" button — blue, full width, disabled until at least 1 selected

#### `crown-step-2` — Paste Speech

- Header: "OFFICIAL SPEECH"
- Subtext: "Paste the full speech. It will be stored as the permanent record."
- Large textarea, no constraints
- Placeholder: "After reviewing all available data, both qualitative and quantitative, from the previous 7 days..."
- Character count displayed below (informational only, no minimum)
- "Generate Certificate →" button — blue, full width, disabled until speech is non-empty

#### `crown-step-3` — Generate Certificate

- Header: "GENERATING DETERMINATION"
- Shows the pasted speech in a read-only panel, labelled "SPEECH ON FILE"
- "Generate Certificate" button — on click:
  - Shows loading state: "The Committee is deliberating..."
  - Simulate 2 second delay
  - Reveal generated certificate text in a panel below
  - Generated text should be a mock deadpan distillation — purely factual, no humor
  - Small "Regenerate →" link beneath the generated text
- "Preview Certificate →" button — blue, full width, appears after generation completes

#### `crown-step-4` — Preview and Confirm

- Header: "CERTIFICATE PREVIEW"
- Subtext: "The following will be entered into the permanent record."
- Full certificate rendered as a document:
  - Border (thin double rule in blue)
  - "HYBRID ATHLETES" wordmark + "H.A." monogram
  - "CERTIFICATE OF DETERMINATION"
  - "Week [N] · [date]"
  - Winner name(s) large
  - Generated certificate text in body serif
  - "As determined by: [crowned by name]"
  - "HYBRID ATHLETES · EST. 2023"
- "Download Certificate" button — uses html2canvas to capture certificate div as PNG
- "Enter Into Record" button — blue, full width
  - On click: confirmation modal — "This determination is permanent. Proceed?"
  - On confirm: add new award to state, navigate to `home`, show updated champion

---

## Key Behaviors

- **Champion gate:** `currentUser.isChampion` controls visibility of "Issue Determination"
  in the hamburger menu. Non-champions never see the crown wizard.
- **Co-winner display:** wherever winner names appear, handle arrays gracefully —
  single name renders normally, two names render as "Name · Name" or stacked
- **Speech expander:** "Read full speech" toggle on both home and award-detail.
  Collapses and expands with Framer Motion animate height.
- **Wizard exit:** tapping back on step 1 shows a confirm dialog —
  "Exit? Your progress will be lost." — before returning to home.
- **Post-confirm:** after entering a new award into the record, the new winner becomes
  the current champion, `currentUser.isChampion` flips to false (they've passed the crown),
  and home reflects the new state.

---

## What Good Looks Like

The app should feel like one coherent thing — not a collection of screens bolted together.
Navigation is smooth. State persists across views (selected wizard data doesn't reset
if you go back a step). The institutional tone is consistent everywhere, copy and design alike.
A user opening this on their phone should immediately understand what it is and what to do.
