// Determinations service — the official record. localStorage seed below is
// the same dataset that the original RecordScreen.jsx held inline, so the
// app ships the demo content even before any Supabase row exists.

import { supabase, isLive } from './supabase.js';

const STORAGE_RECORDS = 'haotw.records';

export const INITIAL_RECORDS = [
  {
    determinationNumber: 14,
    current: true,
    winners: ['Theodore J. Clifford'],
    determiner: 'Marcus',
    determinedOn: 'April 28, 2026',
    citation:
      'Mr. Clifford ran the Boston Marathon to a six-minute personal best on Monday. Six days later, he ran the London Marathon to a sub-three. Between these efforts he is reported to have visited the loo. The Committee finds the matter sufficient.',
    speech:
      'OK so here\'s what we\'re dealing with. Teddy ran Boston Monday. Six minute PR. Crushed it. Looked, frankly, annoyingly good doing it — the man wears Adios Pros like they were sewn for him, and he knows it. Fine. We move on.\n\nExcept he doesn\'t move on. Six days later, six, he flies to London and runs another marathon. SUB-THREE. Mid-flight he texts the group chat a picture of his airplane meal with the caption "fueling." When pressed at the finish line about pacing strategy he says, and I am quoting, "I had to stop at the loo around 30k." The loo. THE LOO. He stopped at a public toilet inside a sub-three London Marathon and still beat the time most of us have spent two years chasing. There is no defending it. It is the most Theodore Clifford thing that has ever happened, and we have watched him do many Theodore Clifford things. By unanimous vote — unanimous — Week 14 belongs to Teddy. The graphic is being prepared. Try not to peak in the Strava comments.',
  },
  {
    determinationNumber: 13,
    coDetermination: true,
    winners: ['Will Clifford', 'Ed Coleman'],
    determiner: 'Marcus',
    determinedOn: 'April 21, 2026',
    citation:
      'At 8:15 AM, Mr. Coleman found himself at the start line of the Martha\'s Vineyard Half Marathon. At 9:33 AM, Mr. Coleman found himself at the finish line — something, up until that point, no one else had done. Mr. Clifford, separately, deadlifted 500 pounds in a basement in Somerville. The record speaks for itself.',
    speech:
      'Two things happened this week and the Committee could not in good conscience choose between them.\n\nThing one: Ed Coleman, at 8:15 AM, found himself at the start line of the Martha\'s Vineyard Half Marathon. Now, Ed had not what one would call "trained." Ed had what one would call "signed up on Tuesday." At 9:33 AM, Ed found himself at the finish line. He won the thing. He won it. There is photographic evidence. The race director shook his hand. He has a small wooden trophy now, the kind that has a salt-air smell. When asked for comment Ed said "I think I\'m going to throw up" and then did not.\n\nThing two: Will Clifford, the lesser-known but arguably more diabolical Clifford brother, pulled 500 pounds off the floor of a Somerville basement gym at roughly the same hour. Five plates. Clean lockout. Ungrunted. The video is shaky because the person filming was, in his own words, "scared." Five hundred pounds, as you all know, is the unofficial threshold above which the Committee\'s body language changes.\n\nWe deliberated. We could not separate them. So for the first time in the brief and self-important history of this group, Week 13 is a co-determination. Both men are crowned. Both certificates have been issued. Both Cliffords are now, technically, on the record — and this is, I want to be clear, the kind of precedent that will be used against us.',
  },
  {
    determinationNumber: 12,
    winners: ['Sarah Whitcomb-Hodge'],
    determiner: 'Marcus',
    determinedOn: 'April 14, 2026',
    citation:
      'On a Tuesday morning in conditions described by the National Weather Service as "actively hostile," Ms. Whitcomb-Hodge ran a 5:48 mile on the Charles River esplanade. No one asked her to. She did not post about it. The Committee learned of the effort through a Strava notification accidentally enabled in 2021.',
    speech:
      'Sarah did not want to be on this list. Sarah, in fact, has spent the better part of fourteen weeks actively trying not to be on this list. She does not post. She does not announce. She trains in the kind of weather the rest of us photograph through windows and then go back to bed.\n\nTuesday morning. Forty-one degrees. Sideways rain. Wind out of the northeast at what the forecast generously called "breezy." Sarah went to the esplanade and ran a five-forty-eight mile. ALONE. For NO REASON. We learned about this because in 2021 she accidentally turned on Strava notifications and has, apparently, never figured out how to turn them off. We saw the splits. We did the math. We are the math police now.\n\nWhen contacted for a quote Sarah said "please don\'t make this a thing." Sarah. We have to make this a thing. That is the entire premise of the group. Week 12 is yours. The graphic is being prepared. We will keep your speech short, as a courtesy.',
  },
  {
    determinationNumber: 11,
    winners: ['David "Big D" Okafor'],
    determiner: 'Marcus',
    determinedOn: 'April 7, 2026',
    citation:
      'At 5:42 AM, prior to the start of the New Bedford Half Marathon, Mr. Okafor benched 315 pounds three times in the parking lot of a Dunkin\'. At 8:51 AM, he ran a 1:24 half. The Committee, while not endorsing the practice, finds the structure compelling.',
    speech:
      'Big D rolled up to the New Bedford Half at five-forty-two in the morning. The race did not start until seven. What did Big D do with that hour and eighteen minutes, you ask? He benched three-fifteen for three reps in the parking lot of a Dunkin\'. The bar was on the asphalt. He had brought it in his trunk. There were witnesses. One of them was buying a coolatta.\n\nHe then ran a one-twenty-four half. Twenty minutes later. Cold. After bench. After three plates. After. Bench.\n\nLook, the Committee has positions on training. Most of those positions are that this is not training. This is something else. But the Hybrid standard does not require best practice — it requires sufficiency. And a man who can press three-fifteen and then run a six-twenty pace half marathon is, by definition, sufficient. Week 11 belongs to David. Please do not bring a barbell to a road race.',
  },
  {
    determinationNumber: 10,
    winners: ['Henry Ashforth'],
    determiner: 'Marcus',
    determinedOn: 'March 31, 2026',
    citation:
      'Mr. Ashforth completed a 2:58.4 1000-meter row, a number which the Committee notes is fast. He then, within forty minutes, consumed four (4) burritos. The volume is uncontested. The intent is unclear.',
    speech:
      'Henry rowed a two-fifty-eight-four thousand. That is, for those of you who do not row, very fast. Henry would like you to know it is very fast. Henry has mentioned that it is very fast on six separate occasions this week including, memorably, in a condolence card.\n\nHowever. The Committee was not moved by the row alone. The Committee was moved by what came after. Within forty minutes of dismounting the erg, Henry walked to a Chipotle and ate four burritos. Four. Not bowls. Burritos. Wrapped. With foil. He ate them in the order in which they were prepared. He did not sit down. He did this while still wearing the rowing onesie.\n\nIs this hybrid? The Committee debated. It is certainly something. It is certainly volume. The motion to grant carried five to two with one abstention. Week 10 is Henry\'s. The burritos are, as far as we know, also Henry\'s.',
  },
  {
    determinationNumber: 9,
    winners: ['Augusta Lin'],
    determiner: 'Marcus',
    determinedOn: 'March 24, 2026',
    citation:
      'Ms. Lin ran a negative-split marathon while leashed to a seventy-pound vizsla named Pilot. Pilot, by all accounts, had a strong day as well, though Pilot is not eligible.',
    speech:
      'Augusta ran a negative-split marathon. That alone earns a long look. A negative split marathon is, as a rule, the mark of a person who has lied to themselves correctly for at least three months.\n\nBut Augusta did this leashed, by a hip belt, to a seventy-pound vizsla named Pilot. Pilot ran the entire thing. Pilot, by mile twenty, was reportedly setting the pace. Pilot received unsolicited "good boy"s from at least nine spectators. Pilot drank from the elite water station, an act for which a human would have been disqualified.\n\nAugusta finished in three-oh-four. Pilot finished in three-oh-four. The Committee has confirmed with the race director that this is, technically, allowed. The Committee has further confirmed with itself that Pilot, while spiritually deserving, is not eligible under bylaws Section II(a). Week 9 is Augusta\'s. Pilot will be issued an honorable mention biscuit.',
  },
  {
    determinationNumber: 8,
    winners: ['Marcus A. Devlin'],
    determiner: 'Theodore',
    determinedOn: 'March 17, 2026',
    citation:
      'Mr. Devlin completed the fifty-mile Vermont Overland gravel race after his right cleat detached at mile thirty-one. He pedaled the remainder one-legged. He did not, at any point, stop talking.',
    speech:
      'Marcus does not get to write his own speech this week, for obvious reasons, and so I — Teddy — am writing it, and I am going to enjoy this.\n\nFifty miles into the Vermont Overland on Saturday, Marcus\'s right cleat fully separated from his right shoe. We have all seen the photo. The bolt is gone. The shoe is flapping. The cleat itself was found, later, by a cyclocrosser named Brent.\n\nMarcus had nineteen miles to go. Marcus did not stop. Marcus did not abandon. Marcus pedaled NINETEEN MILES of Vermont gravel one-legged, on a hardtail, and finished — and I cannot stress this enough — in the top quarter of his age group. There is video. In the video he is talking. He is always talking. He is talking, in the video, about pedaling philosophy. About efficiency. About how, if anything, this has improved his form.\n\nMarcus, congratulations. The Committee is unanimous. Week 8 is yours. Please put the trophy somewhere we can all see it. Please, also, stop talking.',
  },
  {
    determinationNumber: 7,
    winners: ['Petra Sundqvist'],
    determiner: 'Marcus',
    determinedOn: 'March 10, 2026',
    citation:
      'Ms. Sundqvist completed a sub-1:30 half marathon eleven weeks after the birth of her second child. The Committee will not elaborate, as it cannot.',
    speech:
      'I am not going to do a long speech this week because there is nothing to add.\n\nPetra had a baby in late December. In early March, eleven weeks later, she ran a one-twenty-eight half marathon. She did not announce a comeback. She did not have a "build." She wore the same singlet she wore in 2019. She finished, located her partner and the stroller, fed the baby in the parking lot, and drove home.\n\nThere is no joke. The Committee has been silent for two days. Week 7, in full, with all available honors, belongs to Petra.',
  },
  {
    determinationNumber: 6,
    winners: ['Connor Riggs'],
    determiner: 'Marcus',
    determinedOn: 'March 3, 2026',
    citation:
      'Mr. Riggs entered, ran, and DNF\'d a local 5k at the 4-kilometer mark, having been on pace for a 14:32. He returned home, showered, drove to a CrossFit gym, and snatched 100 kilograms. The contradiction is the point.',
    speech:
      'Connor was on pace for a fourteen-thirty-two five-K when, with a kilometer to go, he simply stepped off the course. He walked. He drank a Gatorade. He chatted with a volunteer named Linda. He has since described the decision as "a vibe thing."\n\nThe Committee, at this point, was prepared to do nothing. A DNF is a DNF. Connor went home. Connor showered. Connor — and this is where the case turns — drove forty minutes to a CrossFit affiliate in Quincy and snatched a hundred kilograms. Cleanly. Overhead. The lift was filmed. The lift was good.\n\nThe Hybrid standard, properly understood, does not reward the perfect day. It rewards the day that could not have happened to anyone else. Connor, this week, did the most Connor thing of his life — and the most Connor thing of his life happens to also have been quite fast and quite heavy. Week 6 is Connor\'s. Linda the volunteer is mentioned in the footnotes.',
  },
  {
    determinationNumber: 5,
    winners: ['Theodore J. Clifford'],
    determiner: 'The Committee',
    determinedOn: 'February 24, 2026',
    citation:
      'For the inaugural Determination, the Committee elected Mr. Clifford, on the grounds that he had, the prior weekend, run a marathon, lifted a heavy thing, and looked, in both, photographically composed. The standard is hereby established.',
    speech:
      'It is the first one. Someone had to be the first one.\n\nThe Committee, in selecting Theodore J. Clifford for the inaugural Hybrid Athlete of the Week, acknowledges that the criteria are still being formed. We know what hybrid is when we see it, and we saw it last weekend: Teddy ran a marathon Saturday in two-fifty-something, drove home, and on Sunday cleaned and jerked a number that made one of us audibly say "huh." He then posted about neither. The photos exist because someone else took them. He is in all of them. He looks, as he always looks, like someone in a magazine who has been told he is in a magazine.\n\nThis, the Committee declares, is the standard. Subsequent weeks will be measured against this week. May they live up to it. They will not all live up to it. That is fine. Week 5 — the first week — belongs to Teddy. Welcome to the record.',
  },
];

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Seed once on first read.
  localStorage.setItem(STORAGE_RECORDS, JSON.stringify(INITIAL_RECORDS));
  return [...INITIAL_RECORDS];
}
function saveLocal(records) {
  localStorage.setItem(STORAGE_RECORDS, JSON.stringify(records));
}

// Map a Supabase row → the shape RecordScreen and the certificate route expect.
function fromRow(row) {
  return {
    determinationNumber: row.determination_number,
    current: row.is_current,
    coDetermination: (row.winners || []).length > 1,
    winners: row.winners || [],
    determiner: row.determiner,
    determinedOn: row.determined_on,
    citation: row.citation,
    speech: row.speech,
    certificateUrl: row.certificate_url,
  };
}

export async function listDeterminations() {
  if (!isLive()) {
    return loadLocal()
      .slice()
      .sort((a, b) => b.determinationNumber - a.determinationNumber);
  }
  const { data, error } = await supabase
    .from('determinations')
    .select('*')
    .order('determination_number', { ascending: false });
  if (error) {
    console.warn('listDeterminations failed', error);
    return [];
  }
  return data.map(fromRow);
}

export async function createDetermination(entry) {
  // entry: { determinationNumber, winners, determiner, determinedOn, citation, speech, certificateUrl? }
  if (!isLive()) {
    const records = loadLocal();
    // New entry becomes current; flip the previous current entry off.
    const next = records.map(r => ({ ...r, current: false }));
    next.unshift({
      determinationNumber: entry.determinationNumber,
      current: true,
      coDetermination: (entry.winners || []).length > 1,
      winners: entry.winners,
      determiner: entry.determiner,
      determinedOn: entry.determinedOn,
      citation: entry.citation,
      speech: entry.speech,
      certificateUrl: entry.certificateUrl || null,
    });
    saveLocal(next);
    return { ok: true };
  }
  // Live mode: flip prior current row off, then insert.
  await supabase.from('determinations').update({ is_current: false }).eq('is_current', true);
  const { error } = await supabase.from('determinations').insert({
    determination_number: entry.determinationNumber,
    is_current: true,
    winners: entry.winners,
    determiner: entry.determiner,
    determined_on: entry.determinedOn,
    citation: entry.citation,
    speech: entry.speech,
    certificate_url: entry.certificateUrl || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
