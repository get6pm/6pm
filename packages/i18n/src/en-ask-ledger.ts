/**
 * Ask's answers read from the user's own records: what was spent, where it went, how a span
 * compares, which spends match, the bills left. `{range}` is one of `ask.range.*`; amounts are
 * short (1.2M), counts plain.
 */
export const enAskLedger = {
  'ask.range.today': 'today',
  'ask.range.yesterday': 'yesterday',
  'ask.range.thisWeek': 'this week',
  'ask.range.lastWeek': 'last week',
  'ask.range.thisCycle': 'since payday',
  'ask.range.lastCycle': 'last pay cycle',
  'ask.range.thisMonth': 'this month',
  'ask.range.lastMonth': 'last month',
  'ask.range.last7Days': 'in the last week',
  'ask.range.last30Days': 'in the last month',
  'ask.range.dates': 'from {from} to {to}',

  'ask.answer.spent': {
    one: 'You spent {total} {range}, in one spend.',
    other: 'You spent {total} {range}, across {count} spends.',
  },
  'ask.answer.spentOn': {
    one: 'You spent {total} on {category} {range}, once.',
    other: 'You spent {total} on {category} {range}, {count} times.',
  },
  'ask.answer.spentAt': {
    one: 'You spent {total} at {merchant} {range}, one visit.',
    other: 'You spent {total} at {merchant} {range}, {count} visits.',
  },
  'ask.answer.spentNone': 'Nothing spent {range}.',
  'ask.answer.spentNoneOn': 'Nothing on {category} {range}.',
  'ask.answer.spentNoneAt': 'Nothing at {merchant} {range}.',
  'ask.answer.breakdown': 'Of {total} {range}, the most went to {top}.',
  'ask.answer.compared.up': 'That’s {now} {range}, up from {before} {against}.',
  'ask.answer.compared.down': 'That’s {now} {range}, down from {before} {against}.',
  'ask.answer.compared.same': 'About the same: {now} {range}, {before} {against}.',
  'ask.answer.listed': {
    one: 'One spend {range}: {total}.',
    other: '{count} spends {range}, {total} in all.',
  },
  'ask.answer.listedMore': 'And {more} more.',
  'ask.answer.listedNone': 'No spends like that {range}.',
  'ask.answer.bills': {
    one: 'One bill left before payday: {total}.',
    other: '{count} bills left before payday, {total} in all.',
  },
  'ask.answer.billsNone': 'No bills left before payday.',
  'ask.answer.how': 'Here’s what stands out right now.',
  'ask.answer.howNothing': 'All quiet so far. Nothing stands out yet.',
  'ask.answer.noSuchCategory': 'I can’t find a {category} category. Ask about one of yours.',
  'ask.answer.noRange': 'There’s nothing to look at for that yet.',
  'ask.answer.chat': 'Anytime. Ask me about your money whenever you like.',
  'ask.answer.partial': 'This counts what 6pm has kept since {since}.',
  'ask.row.total': 'Total',
  'ask.row.before': 'Before',
} as const;
