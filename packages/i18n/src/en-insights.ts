/**
 * The companion's lines about the user's own days: one set per kind of fact (`@6pm/domain`
 * insights), two variants in each personality (soft, cheeky, roast) and one plain line for serious
 * mode. Placeholders are the fact's slots, formatted on the phone: money as short amounts (236k),
 * places, categories, pots and bills by name, dates as short dates, `{compare}` from
 * `insight.compare.*`. Lines whose number can be 1 are plurals on `{count}`.
 */
export const enInsights = {
  'insight.compare.muchMore': 'a lot more',
  'insight.compare.more': 'more',
  'insight.compare.about': 'about the same',
  'insight.compare.less': 'less',
  'insight.compare.muchLess': 'a lot less',

  'insight.todayOver.soft.1': 'Over by {over} today. That’s okay: tomorrow’s {tomorrow}.',
  'insight.todayOver.soft.2': 'A bigger day, {over} over. The plan bends: tomorrow’s {tomorrow}.',
  'insight.todayOver.cheeky.1': '{over} over. Tomorrow’s {tomorrow}. We regroup.',
  'insight.todayOver.cheeky.2':
    'Today went {over} past the line. Tomorrow: {tomorrow}. Deep breath.',
  'insight.todayOver.roast.1': '{over} over. Bold. Tomorrow’s {tomorrow}, so, gently now.',
  'insight.todayOver.roast.2': 'The line said no; today said {over} more. Tomorrow’s {tomorrow}.',
  'insight.todayOver.plain': 'Today is {over} over its line. Tomorrow’s line is {tomorrow}.',

  'insight.todayUnder.soft.1': '{spent} so far, {safe} still safe. Nice and steady.',
  'insight.todayUnder.soft.2': 'Still {safe} of room today. You’re doing fine.',
  'insight.todayUnder.cheeky.1': '{safe} left today. Use it wisely. Or not. Your call.',
  'insight.todayUnder.cheeky.2': '{spent} down, {safe} to go. Smooth.',
  'insight.todayUnder.roast.1': 'Only {spent} so far? Who are you today.',
  'insight.todayUnder.roast.2': '{safe} still safe. I’m almost proud.',
  'insight.todayUnder.plain': '{spent} spent today, {safe} still safe.',

  'insight.noSpendYet.soft.1': 'Nothing spent yet. All {line} is still yours today.',
  'insight.noSpendYet.soft.2': 'A clean slate: {line} for today.',
  'insight.noSpendYet.cheeky.1': 'Zero spent. {line} burning a hole in your pocket?',
  'insight.noSpendYet.cheeky.2': 'Full {line} today, untouched. For now.',
  'insight.noSpendYet.roast.1': 'Nothing spent yet. The day is young.',
  'insight.noSpendYet.roast.2': '{line} sitting there, unspent. Suspicious.',
  'insight.noSpendYet.plain': 'Nothing spent yet. Today’s line is {line}.',

  'insight.waitingTonight.soft.1': {
    one: 'One spend ({amount}) waits for tonight. A minute, tops.',
    other: '{count} spends ({amount}) wait for tonight. A minute, tops.',
  },
  'insight.waitingTonight.soft.2': {
    one: 'One spend to look over tonight, {amount}.',
    other: '{count} spends to look over tonight, {amount} in all.',
  },
  'insight.waitingTonight.cheeky.1': {
    one: 'One spend is waiting for its verdict tonight.',
    other: '{count} spends are waiting for their verdict tonight.',
  },
  'insight.waitingTonight.cheeky.2': {
    one: 'Tonight’s close: one spend, {amount}. Easy.',
    other: 'Tonight’s close: {count} spends, {amount}. Easy.',
  },
  'insight.waitingTonight.roast.1': {
    one: 'One spend waiting. It won’t close itself.',
    other: '{count} spends waiting. They won’t close themselves.',
  },
  'insight.waitingTonight.roast.2': {
    one: '{amount} waiting for you to say “yep, that was me”.',
    other: '{count} spends, {amount}, waiting for you to say “yep, that was me”.',
  },
  'insight.waitingTonight.plain': {
    one: 'One spend ({amount}) waits for tonight’s close.',
    other: '{count} spends ({amount}) wait for tonight’s close.',
  },

  'insight.paydaySoon.soft.1': {
    one: 'Payday’s tomorrow. You made it.',
    other: 'Payday in {count} days. Nearly there.',
  },
  'insight.paydaySoon.soft.2': {
    one: 'One more day to payday. Proud of this month.',
    other: '{count} days to payday, {payday}. Hang in there.',
  },
  'insight.paydaySoon.cheeky.1': {
    one: 'Payday tomorrow. Try not to buy a yacht.',
    other: 'Payday in {count} days. I can smell it.',
  },
  'insight.paydaySoon.cheeky.2': {
    one: 'Tomorrow’s payday. Act natural.',
    other: '{count} sleeps until payday.',
  },
  'insight.paydaySoon.roast.1': {
    one: 'Payday tomorrow. The wallet has survived.',
    other: '{count} days to payday. Hold the line.',
  },
  'insight.paydaySoon.roast.2': {
    one: 'One day. You can resist anything for one day.',
    other: 'Payday’s {payday}. Keep the wallet zipped till then.',
  },
  'insight.paydaySoon.plain': {
    one: 'Payday is tomorrow.',
    other: 'Payday is in {count} days, on {payday}.',
  },

  'insight.billDueToday.soft.1': '{bill} ({amount}) is due today.',
  'insight.billDueToday.soft.2': 'Just a heads-up: {bill}, {amount}, is due today.',
  'insight.billDueToday.cheeky.1': '{bill} wants its {amount} today.',
  'insight.billDueToday.cheeky.2': 'Today’s guest star: {bill}, {amount}.',
  'insight.billDueToday.roast.1': '{bill} is due today. It will not wait.',
  'insight.billDueToday.roast.2': '{amount} for {bill}, today. Don’t ghost it.',
  'insight.billDueToday.plain': '{bill} ({amount}) is due today.',

  'insight.billDue.soft.1': {
    one: '{bill} ({amount}) is due tomorrow.',
    other: '{bill} ({amount}) is due in {count} days.',
  },
  'insight.billDue.soft.2': {
    one: 'Heads-up: {bill}, {amount}, tomorrow.',
    other: 'Heads-up: {bill}, {amount}, in {count} days.',
  },
  'insight.billDue.cheeky.1': {
    one: '{bill} is coming for {amount} tomorrow.',
    other: '{bill} is coming for {amount} in {count} days.',
  },
  'insight.billDue.cheeky.2': {
    one: 'Tomorrow: {bill}, {amount}. Mark it.',
    other: 'In {count} days: {bill}, {amount}. Mark it.',
  },
  'insight.billDue.roast.1': {
    one: '{bill} wants {amount} tomorrow. It always does.',
    other: '{bill} wants {amount} in {count} days. It always does.',
  },
  'insight.billDue.roast.2': {
    one: '{amount} for {bill} tomorrow. Don’t act surprised.',
    other: '{amount} for {bill} in {count} days. Don’t act surprised.',
  },
  'insight.billDue.plain': {
    one: '{bill} ({amount}) is due tomorrow.',
    other: '{bill} ({amount}) is due in {count} days.',
  },

  'insight.categoryPaceUp.soft.1':
    '{category} is at {now} this cycle, {compare} than this point last time.',
  'insight.categoryPaceUp.soft.2':
    '{category} is running ahead: {now} so far, {before} last cycle.',
  'insight.categoryPaceUp.cheeky.1':
    '{category}: {now} already. Last cycle you were at {before}. Hmm.',
  'insight.categoryPaceUp.cheeky.2': '{category} is having a moment: {now} vs {before}.',
  'insight.categoryPaceUp.roast.1': '{category} at {now}. Last cycle: {before}. I see you.',
  'insight.categoryPaceUp.roast.2':
    '{now} on {category} already. It was {before} last time. Just saying.',
  'insight.categoryPaceUp.plain':
    '{category}: {now} this cycle, {before} at this point last cycle.',

  'insight.categoryPaceDown.soft.1':
    '{category} is down to {now}, from {before} last cycle. Lovely.',
  'insight.categoryPaceDown.soft.2': '{compare} on {category} than last cycle: {now} vs {before}.',
  'insight.categoryPaceDown.cheeky.1': '{category}: {now}, down from {before}. Look at you.',
  'insight.categoryPaceDown.cheeky.2': '{category} went on a diet: {now} vs {before}.',
  'insight.categoryPaceDown.roast.1': '{category} only {now}? It was {before}. Who replaced you?',
  'insight.categoryPaceDown.roast.2': '{now} on {category}, down from {before}. Growth.',
  'insight.categoryPaceDown.plain':
    '{category}: {now} this cycle, {before} at this point last cycle.',

  'insight.repeatMerchant.soft.1': '{merchant} {visits} times this week. They must love you.',
  'insight.repeatMerchant.soft.2': '{visits} visits to {merchant} since Monday, {amount} in all.',
  'insight.repeatMerchant.cheeky.1': '{merchant} again? That’s {visits} since Monday.',
  'insight.repeatMerchant.cheeky.2': 'You and {merchant}: {visits} dates this week, {amount}.',
  'insight.repeatMerchant.roast.1':
    '{merchant}, visit number {visits}. Do they know your name yet?',
  'insight.repeatMerchant.roast.2':
    '{amount} at {merchant} this week. {visits} visits. A lifestyle.',
  'insight.repeatMerchant.plain': '{merchant}: {visits} visits this week, {amount}.',

  'insight.firstTimeMerchant.soft.1': 'First time at {merchant}. Hope it was good.',
  'insight.firstTimeMerchant.soft.2': 'Somewhere new: {merchant}, {amount}.',
  'insight.firstTimeMerchant.cheeky.1': '{merchant}? New spot. Adventurous.',
  'insight.firstTimeMerchant.cheeky.2': 'Ooh, {merchant}. Never seen this one.',
  'insight.firstTimeMerchant.roast.1': '{merchant}. New place, same wallet.',
  'insight.firstTimeMerchant.roast.2': 'First {merchant} visit. Don’t make it a habit. Or do.',
  'insight.firstTimeMerchant.plain': 'First spend at {merchant}: {amount}.',

  'insight.biggestSpend.soft.1': 'The week’s big one: {amount} at {merchant}.',
  'insight.biggestSpend.soft.2': '{merchant}, {amount}: the biggest this week. The plan has it.',
  'insight.biggestSpend.cheeky.1': 'Headliner of the week: {merchant}, {amount}.',
  'insight.biggestSpend.cheeky.2': '{amount} at {merchant}. Treat yourself, apparently.',
  'insight.biggestSpend.roast.1': '{amount} at {merchant}. The week’s main character.',
  'insight.biggestSpend.roast.2': '{merchant} took {amount} this week. Worth it? Don’t answer.',
  'insight.biggestSpend.plain': 'Biggest spend this week: {amount} at {merchant}.',

  'insight.underStreak.soft.1': '{days} days in a row under the line. Steady you.',
  'insight.underStreak.soft.2': '{days} calm days back to back.',
  'insight.underStreak.cheeky.1': '{days} days under the line. Streak era.',
  'insight.underStreak.cheeky.2': 'Under the line {days} days running. Don’t jinx it.',
  'insight.underStreak.roast.1': '{days} days under. Who taught you this?',
  'insight.underStreak.roast.2': '{days} days in a row. I’m running out of jokes.',
  'insight.underStreak.plain': '{days} closed days in a row at or under the line.',

  'insight.closeStreak.soft.1': '{days} days closed in a row. That’s the ritual.',
  'insight.closeStreak.soft.2': 'A {days}-day close streak. Thank you for showing up.',
  'insight.closeStreak.cheeky.1': '{days} closes in a row. Habit unlocked.',
  'insight.closeStreak.cheeky.2': 'Streak: {days}. Tonight makes it more.',
  'insight.closeStreak.roast.1': '{days} days straight. Commitment? From you?',
  'insight.closeStreak.roast.2': '{days} closes running. Don’t break it now.',
  'insight.closeStreak.plain': '{days} days closed in a row.',

  'insight.weekSpare.soft.1': {
    one: 'This week left {spare} over. It rolls on to the days ahead.',
    other: '{count} days under the line this week: {spare} rolls on.',
  },
  'insight.weekSpare.soft.2': {
    one: '{spare} spare this week, carried forward.',
    other: '{spare} spare this week, carried forward.',
  },
  'insight.weekSpare.cheeky.1': {
    one: '{spare} left over this week. Future days say thanks.',
    other: '{spare} left over from {count} good days. Future days say thanks.',
  },
  'insight.weekSpare.cheeky.2': {
    one: 'The week is {spare} ahead. Smooth.',
    other: 'The week is {spare} ahead. Smooth.',
  },
  'insight.weekSpare.roast.1': {
    one: '{spare} spare. Don’t spend it all at once.',
    other: '{count} days under, {spare} spare. Don’t spend it all at once.',
  },
  'insight.weekSpare.roast.2': {
    one: 'You’re {spare} up this week. Who are you.',
    other: 'You’re {spare} up this week. Who are you.',
  },
  'insight.weekSpare.plain': {
    one: 'This week’s closed days left {spare} over.',
    other: 'This week’s closed days left {spare} over.',
  },

  'insight.weekOver.soft.1':
    'This week ran {over} over. The days ahead are a bit smaller, and that’s fine.',
  'insight.weekOver.soft.2': '{over} over this week. We’ll smooth it out.',
  'insight.weekOver.cheeky.1': 'Week’s {over} over. The rest of the month adjusts.',
  'insight.weekOver.cheeky.2': '{over} over so far. Plot twist, not the ending.',
  'insight.weekOver.roast.1': 'This week: {over} over. The month remembers.',
  'insight.weekOver.roast.2': '{over} over. A week to forget, a month to fix it.',
  'insight.weekOver.plain': 'This week’s closed days went {over} over the line.',

  'insight.potMilestone.soft.1': '{pot} is past {percent}%. Look at it grow.',
  'insight.potMilestone.soft.2': '{percent}% of the way to {pot}.',
  'insight.potMilestone.cheeky.1': '{pot}: {percent}% there. It’s happening.',
  'insight.potMilestone.cheeky.2': '{percent}% of {pot}, done. Keep feeding it.',
  'insight.potMilestone.roast.1': '{pot} at {percent}%. Saving? You?',
  'insight.potMilestone.roast.2': '{percent}% to {pot}. Don’t raid it.',
  'insight.potMilestone.plain': '{pot} is past {percent}% of its goal.',

  'insight.potFull.soft.1': '{pot} is full. You did that.',
  'insight.potFull.soft.2': '{pot}: done. Enjoy it, truly.',
  'insight.potFull.cheeky.1': '{pot} is full! Confetti, but quietly.',
  'insight.potFull.cheeky.2': '{pot}, filled to the brim.',
  'insight.potFull.roast.1': '{pot} is full. I didn’t think you’d make it. You did.',
  'insight.potFull.roast.2': 'Full pot: {pot}. Now don’t spend it on nonsense.',
  'insight.potFull.plain': '{pot} has reached its goal.',

  'insight.workToClaim.soft.1': {
    one: 'One work spend ({amount}) to claim back.',
    other: '{count} work spends ({amount}) to claim back.',
  },
  'insight.workToClaim.soft.2': {
    one: '{amount} for work is waiting to be claimed.',
    other: '{amount} for work, {count} spends, waiting to be claimed.',
  },
  'insight.workToClaim.cheeky.1': {
    one: 'Work owes you {amount}.',
    other: 'Work owes you {amount}. {count} receipts’ worth.',
  },
  'insight.workToClaim.cheeky.2': {
    one: '{amount} in work spends. Go get it.',
    other: '{count} work spends, {amount}. Go get it.',
  },
  'insight.workToClaim.roast.1': {
    one: '{amount} your company owes you. Don’t be shy.',
    other: '{amount} your company owes you. {count} times. Don’t be shy.',
  },
  'insight.workToClaim.roast.2': {
    one: 'You’re funding work with {amount}. Claim it.',
    other: 'You’re funding work with {amount}. Claim it.',
  },
  'insight.workToClaim.plain': {
    one: 'One work spend ({amount}) is waiting to be claimed back.',
    other: '{count} work spends ({amount}) are waiting to be claimed back.',
  },
} as const;
