/** Ask doing things: a spend or a pot, confirmed before anything is saved; how 6pm works. */
export const enAskActions = {
  'ask.action.add': 'Add',
  'ask.action.notNow': 'Not now',
  'ask.action.confirmSpend': 'Add {name}, {amount}, to {category}?',
  'ask.action.added': 'Added. {name}, {amount}, counts today.',
  'ask.action.cancelled': 'Okay, nothing changed.',
  'ask.action.failed': 'That didn’t save. Try Quick add instead.',
  'ask.action.confirmPot': 'A pot for {name}: {goal}. Set it up?',
  'ask.action.confirmPotBy': 'A pot for {name}: {goal} by {month}. Set it up?',
  'ask.action.setUp': 'Set it up',
  'ask.action.potLocked':
    'Free keeps one pot of your own, and yours is in use. Max makes room for more.',
  'ask.action.seeMax': 'See Max',
  'ask.action.potGoal': 'How much is {name} for? Tell me, like “10tr”.',
  'ask.action.showMe': 'Show me how',
  'ask.action.openQuickAdd': 'Open Quick add',
  'ask.howTo.ways':
    'Six ways in: Quick add (typed or said), sharing a bank receipt to 6pm, forwarding receipt emails, scanning a VietQR to pay, Apple Pay taps that land by themselves, and the widgets and controls. What 6pm catches waits in your Inbox until the close.',
  'ask.howTo.quickAdd':
    'Quick add takes a spend typed or said out loud, like “trà sữa 45k”. Or just tell me here: “vừa ăn phở 50k”.',
  'ask.howTo.dailyNumber':
    'Your daily number is the money free this pay cycle, after bills, Future you and pots, shared over the days left to payday. Spend under it and tomorrow’s grows; go over and tomorrow’s shrinks a little.',
  'ask.howTo.negative':
    'It goes below zero when this cycle’s spending is more than its free money. Nothing breaks: the plan spreads it over the days left. Ease off for a few days, or take some from a pot in Plan.',
  'ask.howTo.pot':
    'A pot is money set aside for one thing, like a trip or Tết. 6pm puts a little in each month and keeps it out of your daily number, so it’s there when you need it.',
  'ask.howTo.close':
    'At 6pm you close the day: keep or skip what was caught, then see where you landed. Miss it and nothing is lost; caught spends wait, and count, until you decide.',
  'ask.howTo.budget':
    '6pm has no budget per category. Your daily number is the budget: bills, Future you and pots are already held back. To spend less on something, start a pot or give Future you more in Plan.',
} as const;
