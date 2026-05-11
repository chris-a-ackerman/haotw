-- 0002_seed_historical_determinations.sql
--
-- Seeds the 11 historical Hybrid Athlete of the Week determinations from
-- Week 1 (2026-02-02) through Week 11 (2026-05-10). Source of truth is
-- supabase/historical-determinations.csv.
--
-- Idempotent: the `determinations.determination_number` unique constraint
-- combined with ON CONFLICT DO NOTHING makes re-running a no-op.
--
-- certificate_url is left null on every row. PNGs are generated client-side
-- by walking the determinations and rendering each <Certificate> through
-- html2canvas + storage upload; that pass writes the URL back.
--
-- created_by is null because these determinations predate any account.

insert into public.determinations
  (determination_number, is_current, winners, determiner, determined_on, citation, speech, certificate_url, created_by)
values
  (
    1, false,
    ARRAY['Ed Coleman']::text[],
    'Jake Bernhardt',
    '2026-02-02',
    $haotw$Mr. Coleman ran approximately six miles the morning after a reported five hours of sleep and the consumption of multiple Kokanees the prior evening. The Committee designates him the inaugural recipient under the standard now established. The determination stands.$haotw$,
    $haotw$Going to clarify this for the broader group lol. We are officially kicking off Hybrid Athlete of the Week. Every Sunday night the person who is current hybrid athlete of the week (rn that person is Ed for making me look like an idiot and ripping 6ish miles after 5 hours of sleep and many kokanees) will pass the award to someone else. You can use whatever criteria you want to give the award as long as it encompasses something that happened during the preceding week. That being said, Ed we are incredibly excited to hear who you pass the award to on Sunday night$haotw$,
    null, null
  ),
  (
    2, false,
    ARRAY['Paul Flanagan']::text[],
    'Ed Coleman',
    '2026-02-09',
    $haotw$Mr. Flanagan completed a repeat-lap two-part long run during the week under review, building on a sixty-mile treadmill week the week prior. The Committee finds the volume sufficient. The determination stands.$haotw$,
    $haotw$Apologies for the delay in the nomination for HAOTW, I was deliberating over the weekend. Very strong showing across the board last week but this weeks HAOTW is:

______ Paul Flanagan ______

Really embodied the winter training grind with the repeat lap on the two part long run to build on an insane treadmill week the week before. I personally would rather run a long run down the middle of Storrow drive before I did a 60mi week on the treadmill.

Other honourable mentions go to Jake for the free feet pics and Josh casually rocking up to the Sloan run despite already crushing a 10mi workout.$haotw$,
    null, null
  ),
  (
    3, false,
    ARRAY['Logan Liljeberg']::text[],
    'Paul Flanagan',
    '2026-02-16',
    $haotw$Mr. Liljeberg entered his marathon taper with a long run of note, with a sub-three-hour marathon as his stated objective. The Committee finds the effort sufficient. The determination stands.$haotw$,
    $haotw$Gentlemen good evening

It's been an incredible honor this past week being HAOTW, especially coming from an esteemed hybrid athlete in Ed.

This past week was what being hybrid is all about. Running fast, lifting heavy, self importance, and intimate post-run selfies. The person who most represented these values this past week is another true hybrid for whom I have great respect:

___Logan Liljeberg_____

Our man engered his taper with a banger of a long run and has sub-3 firmly in his sights. But even more than that, his mind is focused on the hybrid community. Thank you to Logan and to the academy for letting me play a small part in this grand honor$haotw$,
    null, null
  ),
  (
    4, false,
    ARRAY['Ed Coleman']::text[],
    'Logan Liljeberg',
    '2026-02-24',
    $haotw$Mr. Coleman completed, within a single week, backcountry skiing in Canada, road mileage in New Hampshire, training sessions in Boston, and additional mileage in New Hampshire. The volume is uncontested. The determination stands.$haotw$,
    $haotw$I want to say congrats to newest HAOTW Mr. Ed Coleman ____. Looking at this man's Strava from the past week he was a man on a mission. First he starts with some back country skiiing in Canada, then he makes his way to the beauty state of NH (live free or die baby!) for some good old miles, then rips up Boston with the boys for a few sessions (legendary) and then goes back to NH for more miles. This guy was an absolute weapon and just an absolute gritty week of grinding. If only the Canadian men's hockey team had this type of heart and will to win they could have been wearing gold instead of silver __. Congrats Ed, you fully earned this HAOTW ________$haotw$,
    null, null
  ),
  (
    5, false,
    ARRAY['Will Clifford']::text[],
    'Ed Coleman',
    '2026-05-01',
    $haotw$Mr. Clifford filed a late-week Strava entry documenting puppy yoga as a recovery modality, supplementing the prior week's run and lift volume. The Committee finds the combination sufficient. The determination stands.$haotw$,
    $haotw$Good evening gentlemen, it's been a great week but it is time for me to pass on HAOTW. It was a very solid week across the board and a great showing from everyone making it hard to pick a recipient. However, today's Strava post got him a last minute lead so congratulations to Will Clifford!

True hybrid athletes know that to run fast and lift heavy you need elite recovery, and that recovery doesn't get better than puppy yoga. Great insights today to see how the best approach their recovery and I hope to be able to incorporate it soon. Forget cold plunges and saunas (ice pack on the balls of course ifykyk), this is the future. Congrats Will for training hard this week and inspiring the people to look for every possible gain out there.$haotw$,
    null, null
  ),
  (
    6, false,
    ARRAY['Josh Beasley']::text[],
    'Will Clifford',
    '2026-05-22',
    $haotw$Mr. Beasley, while in New Zealand for academic obligations and in the lead-up to the Boston Marathon, completed an eighty-mile running week on foreign soil. The Committee finds the effort sufficient. The determination stands.$haotw$,
    $haotw$__ Return of the Hybrids __
Team, first off, let me once again apologize for my complete inability to hand off this award on time. This training block has been nothing but long days, longer nights, and a dangerous amount of tunnel vision. Distractions got the best of me.

But the torch must be passed.
I've been studying Strava, interrogating some of you mid-run, and weighing all data.

And after all that, the choice was obvious.

I recently talked with Mr. Josh Beasley, MBA — yes, we will be using the full title — who told me about his trip to New Zealand for school. With Boston creeping up, he was terrified of losing fitness. Terrified. As if hybrid athletes have ever taken a day off in their lives.

But not only did Josh maintain fitness abroad — the man casually ripped an 80-mile week on foreign soil. That's not hybrid, that's international hybrid.

So with that, I can't think of a more deserving recipient.

Congrats to Mr. Josh Beasley, MBA — your visa to Hybrid Nation has been renewed. Get back to the US soon and safely so this group chat can go back to blue messages$haotw$,
    null, null
  ),
  (
    7, false,
    ARRAY['Logan Liljeberg', 'Ryan Dombroski']::text[],
    'Josh Beasley',
    '2026-05-31',
    $haotw$Mr. Liljeberg and Mr. Dombroski each completed a 26.2-mile marathon during the week under review. The Committee, unable to separate the efforts, issues this as a co-determination. The determination stands.$haotw$,
    $haotw$Team, I'll keep this brief because greatness needs little explanation.

Tradition tells us there can only be one. A singular torchbearer. A lone hybrid standing atop the mountain. Tradition, however, is soft. And this week was not.

I spent time in the lab. Reviewed the Strava files. Cross-examined splits. Considered the conditions. Reflected deeply on what it means to be a hybrid athlete in today's world.

And after all that, i've reached an uncomfortable conclusion:

This week broke the model.

Because while most of us were out there logging respectable miles, two individuals decided that 26.2 miles would be a casual weekend activity.

Ryan and Logan both stepped to the line and looked the marathon in the eyes. So in a historic and frankly unprecedented move, I will be breaking with tradition.

This week, we are naming co-Hybrid Athletes of the Week.

Ryan and Logan

Enjoy this moment. Hydrate. Refuel. And please, for the sake of the rest of us, consider taking a day off.$haotw$,
    null, null
  ),
  (
    8, false,
    ARRAY['Dan Lignos']::text[],
    'Logan Liljeberg, Ryan Dombroski',
    '2026-04-12',
    $haotw$Mr. Lignos completed a twenty-mile long run during the week under review, of which thirteen miles were executed at marathon pace. The Committee finds the workout sufficient. The determination stands.$haotw$,
    $haotw$Gentlemen,

First off on behalf of Logan and I we would like to express our deepest apologies for the delay is passing on this most precious award.

Passing on the torch is something we do not take lightly. The academy has consulted the experts, verified numbers, and scoured Strava to determine the most worthy recipient of this week's award.

We have come to a conclusion

This weeks hybrid athlete of the week is Dan!

Dan crushed this weeks training. He most notably killed his 20 mile long run - which included 13 miles of marathon pace!

Join me in congratulating Dan on earning this week's hybrid athlete of the week honors!!!$haotw$,
    null, null
  ),
  (
    9, false,
    ARRAY['Jake Bernhardt', 'Caleb Shulman', 'Will Clifford', 'Josh Beasley', 'Paul Flanagan']::text[],
    'Dan Lignos',
    '2026-04-20',
    $haotw$Messrs. Bernhardt, Shulman, Clifford, Beasley, and Flanagan each toed the line at the Boston Marathon during the week under review, following approximately four months of training. The Committee, finding individual separation impractical, issues this as a collective determination. The determination stands.$haotw$,
    $haotw$Wow boys WOW

What can I say. What a day. These are the days that fire me up the most and keep me motivated. I left today truly inspired by each hybrid athlete participating in today's race — even the hybrid athletes that were cheering on the sidelines and or virtually.

As last week's recipient, I understand the weight that comes with presenting this award—particularly during a week of such significance.

Competing Boston is no small feat. It represents months of disciplined training, early alarms, missed social events, and an unwavering commitment to the process. The work put in over the past four months does not go unnoticed.

Because of this, it would be both impractical and unjust to recognize just one individual.

Therefore, in a rare and historic decision, this week's HAOTW award is presented collectively to all members of the group who toed the line in Boston.

Your dedication, consistency, and performance have set the standard. The committee acknowledges not just today's result, but the full body of work that made it possible.

Congratulations to all recipients Paul Jake Caleb Josh Will and Henry (even tho we haven't met yet I saw the work).

The bar has been raised. Enjoy this one fellas. Cheers$haotw$,
    null, null
  ),
  (
    10, false,
    ARRAY['Will Clifford', 'Ed Coleman']::text[],
    'Jake Bernhardt',
    '2026-04-27',
    $haotw$Mr. Clifford ran the Boston Marathon to a six-minute personal best and, six days later, completed the London Marathon in under three hours. Mr. Coleman, during the same period, won the Martha's Vineyard Half Marathon. The Committee, unable to separate the efforts, issues this as a co-determination. The determination stands.$haotw$,
    $haotw$Hello fellow hybrids

It's with great honor I write to you all to announce this week's HAOTW on behalf of all of us who toed the line at Boston a week ago today. While many of us probably thought Boston weekend would be the peak of hybrid athlete performance, after reviewing all data, both qualitative and quantitative, from the previous 7 days, it's clear to me that the limit of hybrid performance is far beyond what we ever thought possible.

In this last week we had MULTIPLE members of our group conquer races in countries they aren't citizens of, one of whom did so while battling an unsettled large intestine while the other casually took home gold.

It should come as no surprise to you that this week's HAOTW is both Will Clifford (back to back winner) and Ed Coleman (third time winning the award).

After a dominant performance and 6 min PR at Boston, Mr. Clifford (sometimes Crawford) took his exceptionally good looks and Adidas Adios Pros to London, where he dropped a casual sub 3 marathon 6 days after Boston WHILE making a quick pit stop at the loo. Arguably this is even more impressive than his day in Boston.

Turning to Mr. Coleman, a guy who knows a thing or two about the hybrid mandate, we have another incredible performance to evaluate. At 8:15 AM Ed found himself at the start line of the Martha's Vineyard half marathon. At 9:33 AM Ed found himself at the finish line of the Martha's Vineyard half marathon, something, up until that point, no one else had done. That's right, we have a MFing champ in the chat.

Truly an honor to share this chat with two legends of the game and I look forward to seeing what you each do next.$haotw$,
    null, null
  ),
  (
    11, true,
    ARRAY['Hank McGreen']::text[],
    'Will Clifford',
    '2026-05-10',
    $haotw$Mr. McGreen completed a Boston Marathon training block averaging nearly thirty hours of training per week, sustained an injury that precluded his original race objective, and ran the event itself alongside his partner. He has since returned to seventy-five-mile training weeks. The Committee finds the conduct sufficient. The determination stands.$haotw$,
    $haotw$Folks, the wait is finally over. The reviews are in, and after extensive deliberation, Ed and I have reached a decision.

Being a Hybrid is about more than just training. It's about battling through adversity. It's setbacks, injuries, bad days, and still choosing to put your head down and chase a goal. And no one embodied that more this cycle than Mr. McGreen.

Hank put in an absolutely massive training block for Boston. Nearly 30 hours a week grinding, pounding pavement, and pushing pedals. Then injury struck. It knocked him down and kept him from the original goal he'd set out for.

Instead of folding, instead of sulking, he chose something greater: he laced up, ran alongside his girlfriend, and turned what could've been disappointment into a lifelong memory. That is Hybrid mentality at its finest.

And now? Hank is BACK. Back to 75-mile weeks. Back with a new fire. Back with a new goal in sight.

This award is long overdue, and I'm honored to pass it on to him.

Congrats, Hank McGreen .$haotw$,
    null, null
  )
on conflict (determination_number) do nothing;

-- Belt + suspenders: enforce the invariant that only the highest-numbered
-- row is current. Lets the migration heal a partial prior state.
update public.determinations set is_current = false where determination_number <> 11;
update public.determinations set is_current = true  where determination_number  = 11;
