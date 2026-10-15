/**
 * The companion's lines about quiet days, habits and the cycle's pace: the same shape as
 * `en-insights` (two variants per personality, one plain line), its other half. Cheeky and roast
 * tease the purchase or the pattern, never the person, lead with the number and end with a way
 * forward or a wink.
 */
export const enInsightsHabits = {
  'insight.noSpendDay.soft.1': 'A day that cost nothing at all: the whole {kept} stayed put.',
  'insight.noSpendDay.soft.2': 'A no-spend day. {kept} kept, quietly lovely.',
  'insight.noSpendDay.cheeky.1': 'Zero spent, {kept} untouched. The wallet had a day off.',
  'insight.noSpendDay.cheeky.2': 'A whole day, nothing spent. {kept} says thank you.',
  'insight.noSpendDay.roast.1': 'Nothing spent, {kept} untouched. Who is this, and can they stay?',
  'insight.noSpendDay.roast.2': 'Not a single spend, {kept} kept. The shops will survive.',
  'insight.noSpendDay.plain': 'The last closed day had no spends; {kept} of its line was kept.',

  'insight.noSpendStreak.soft.1': '{days} quiet days in a row: {kept} left untouched.',
  'insight.noSpendStreak.soft.2': '{days} days without a spend. {kept} stayed with you.',
  'insight.noSpendStreak.cheeky.1': '{days} days, zero spends. The wallet is getting suspicious.',
  'insight.noSpendStreak.cheeky.2':
    '{days} no-spend days in a row. {kept} is having a lovely rest.',
  'insight.noSpendStreak.roast.1': '{days} days, not one spend. Your usual coffee spot is worried.',
  'insight.noSpendStreak.roast.2': '{days} days spend-free, {kept} untouched. Don’t make it weird.',
  'insight.noSpendStreak.plain': '{days} closed days in a row with no spends; {kept} kept.',

  'insight.backUnder.soft.1':
    'Back under the line after a day over: {spare} to spare. Nicely done.',
  'insight.backUnder.soft.2': 'A day over, then a day under with {spare} left. That’s the rhythm.',
  'insight.backUnder.cheeky.1': 'Redemption arc: back under, {spare} to spare.',
  'insight.backUnder.cheeky.2': 'Over one day, under the next with {spare} spare. Balance.',
  'insight.backUnder.roast.1': '{spare} under, right after a day over. Apology accepted.',
  'insight.backUnder.roast.2': 'Back under with {spare} spare. The comeback we were waiting for.',
  'insight.backUnder.plain': 'Back under the line after a day over, with {spare} to spare.',

  'insight.logGap.soft.1': 'Nothing logged since {since}. A quiet stretch, or a busy one?',
  'insight.logGap.soft.2': 'It’s been {days} days without a spend logged. Anything to add?',
  'insight.logGap.cheeky.1': 'Nothing logged since {since}. Monk mode, or just busy?',
  'insight.logGap.cheeky.2': '{days} days, nothing logged. Did the wallet go on holiday?',
  'insight.logGap.roast.1': 'Nothing since {since}. Really nothing, or just not written down?',
  'insight.logGap.roast.2':
    '{days} days of silence. Even a coffee counts; add it and we’re square.',
  'insight.logGap.plain': 'No spends logged since {since}.',

  'insight.weekendHeavy.soft.1':
    'Lately a weekend day runs about {weekend}, a weekday {weekday}. Worth a thought before Saturday.',
  'insight.weekendHeavy.soft.2':
    'Weekends have been {weekend} a day, weekdays {weekday}. Easy does it.',
  'insight.weekendHeavy.cheeky.1':
    'Weekdays: {weekday} a day. Weekends: {weekend}. Saturday has plans for you.',
  'insight.weekendHeavy.cheeky.2':
    'A weekend day averages {weekend}, a weekday {weekday}. The weekend is coming. Ready?',
  'insight.weekendHeavy.roast.1':
    '{weekday} on a weekday, {weekend} on a weekend day. The weekend keeps winning; call a draw?',
  'insight.weekendHeavy.roast.2':
    'Weekends: {weekend} a day. Weekdays: {weekday}. This weekend, a rematch?',
  'insight.weekendHeavy.plain':
    'Over the last four weeks: {weekend} a weekend day, {weekday} a weekday.',

  'insight.recordDay.soft.1':
    '{amount} today, the biggest day in {days} days. That’s okay; tomorrow resets.',
  'insight.recordDay.soft.2':
    'Today’s {amount} is the most in {days} days. The plan bends around it.',
  'insight.recordDay.cheeky.1':
    '{amount} today. A new high, just not the chart we wanted. Tomorrow resets.',
  'insight.recordDay.cheeky.2':
    'New record: {amount}, the biggest in {days} days. Let’s not go for two.',
  'insight.recordDay.roast.1':
    '{amount} today, the biggest in {days} days. Bold. Tomorrow, a smaller encore.',
  'insight.recordDay.roast.2': '{amount} in one day, a {days}-day record. Frame it, then rest.',
  'insight.recordDay.plain': 'Today’s {amount} is the most spent in a day in the last {days} days.',

  'insight.likelySubscription.soft.1':
    '{merchant} has charged about {amount} each month. Make it a bill?',
  'insight.likelySubscription.soft.2':
    '{amount} to {merchant}, {months} months running. Want it as a bill?',
  'insight.likelySubscription.cheeky.1':
    '{merchant} again, {amount}, like clockwork. We see you, subscription. Make it a bill?',
  'insight.likelySubscription.cheeky.2':
    '{months} months of {merchant} at {amount}. Still using it? Add it as a bill.',
  'insight.likelySubscription.roast.1':
    '{merchant}: {amount}, {months} months in a row. Still using it, or just paying for it?',
  'insight.likelySubscription.roast.2':
    '{amount} to {merchant} every month. Keeping it? Make it a bill. If not, cancel.',
  'insight.likelySubscription.plain':
    '{merchant} has charged about {amount} a month for {months} months. It could be a bill.',

  'insight.lateNight.soft.1': 'A late-night {amount} at {merchant}. Hope it helped.',
  'insight.lateNight.soft.2': '{merchant}, {amount}, after dark. Sleep well.',
  'insight.lateNight.cheeky.1': '{amount} at {merchant}, way past bedtime. Night-owl shopping.',
  'insight.lateNight.cheeky.2': 'Late-night {merchant}, {amount}. Classic.',
  'insight.lateNight.roast.1':
    '{amount} at {merchant} in the small hours. Big decisions are best made in daylight.',
  'insight.lateNight.roast.2': '{merchant} at night, {amount}. Next time, sleep on the cart.',
  'insight.lateNight.plain': 'A late-night spend: {amount} at {merchant}.',

  'insight.cycleHalfway.soft.1': 'Halfway through the cycle: {percent}% used, {left} left.',
  'insight.cycleHalfway.soft.2':
    'Half the cycle gone, {left} still free. You’re keeping track, and that’s the hard part.',
  'insight.cycleHalfway.cheeky.1': 'Half time. Scoreboard: {percent}% used, {left} to play with.',
  'insight.cycleHalfway.cheeky.2': 'Halfway there. {left} left for the second half.',
  'insight.cycleHalfway.roast.1':
    'Half time: {percent}% used. {left} for the second half; play it well.',
  'insight.cycleHalfway.roast.2':
    'Halfway, {percent}% gone, {left} left. The second half decides it.',
  'insight.cycleHalfway.plain': 'Halfway through the cycle: {percent}% used, {left} left.',

  'insight.firstWeekPaceUp.soft.1':
    'The first week used {percent}% of the cycle; an even pace is {even}%. The weeks ahead can even it out.',
  'insight.firstWeekPaceUp.soft.2':
    'A busy first week: {percent}% of the cycle’s money. Steady days bring it back.',
  'insight.firstWeekPaceUp.cheeky.1':
    'First week: {percent}% gone, against {even}% for an even pace. Strong start. Maybe too strong.',
  'insight.firstWeekPaceUp.cheeky.2': 'Week one took {percent}%. Even would be {even}%. Pace it.',
  'insight.firstWeekPaceUp.roast.1':
    'Week one ate {percent}% of the cycle. Even is {even}%. The other weeks would like a word.',
  'insight.firstWeekPaceUp.roast.2':
    '{percent}% in one week, when even is {even}%. That was the sprint; now a jog.',
  'insight.firstWeekPaceUp.plain':
    'The first week used {percent}% of the cycle’s money; an even pace is {even}%.',

  'insight.firstWeekPaceDown.soft.1':
    'The first week used only {percent}% of the cycle; an even pace is {even}%. Lovely start.',
  'insight.firstWeekPaceDown.soft.2':
    'A gentle first week: {percent}% used, {compare} than an even pace.',
  'insight.firstWeekPaceDown.cheeky.1':
    'First week: just {percent}%, under the even {even}%. Smooth start.',
  'insight.firstWeekPaceDown.cheeky.2': 'Week one: {percent}%. Even is {even}%. Look at that.',
  'insight.firstWeekPaceDown.roast.1':
    'Week one used {percent}%, under the even {even}%. Suspiciously good. Keep it.',
  'insight.firstWeekPaceDown.roast.2': '{percent}% in the first week, even is {even}%. No notes.',
  'insight.firstWeekPaceDown.plain':
    'The first week used {percent}% of the cycle’s money; an even pace is {even}%.',

  'insight.paceSpare.soft.1':
    'At this pace, payday ({payday}) arrives with about {spare} to spare.',
  'insight.paceSpare.soft.2': 'Keep this up and you reach {payday} with about {spare} left.',
  'insight.paceSpare.cheeky.1':
    'Projected leftover on {payday}: {spare}. Don’t spend it in your head.',
  'insight.paceSpare.cheeky.2': 'At this rate, {spare} spare by {payday}. Nice.',
  'insight.paceSpare.roast.1':
    '{spare} spare by {payday} at this pace. Don’t spend it before it exists.',
  'insight.paceSpare.roast.2': 'Forecast: {spare} left on {payday}. Keep the forecast honest.',
  'insight.paceSpare.plain': 'At the pace so far, about {spare} is left on payday, {payday}.',

  'insight.paceShort.soft.1':
    'At this pace money gets tight around {runsOut}, before payday ({payday}). A few smaller days fix it.',
  'insight.paceShort.soft.2':
    'Heads-up: at this rate it runs short around {runsOut}. Smaller days help, and there’s time.',
  'insight.paceShort.cheeky.1':
    'This route runs dry around {runsOut}; payday is {payday}. Rerouting?',
  'insight.paceShort.cheeky.2':
    'At this pace, money taps out around {runsOut}. Payday’s {payday}. Gentle days ahead.',
  'insight.paceShort.roast.1':
    'This pace runs dry around {runsOut}, and payday is {payday}. A few quiet days and it lands.',
  'insight.paceShort.roast.2':
    '{runsOut}: when the money runs out at this pace. {payday}: payday. Let’s close that gap.',
  'insight.paceShort.plain':
    'At the pace so far, money runs out around {runsOut}, before payday on {payday}.',
} as const;
