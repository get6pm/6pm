/** Budget together. */
export const enTogether = {
  'together.title': 'Budget together',
  'together.card.subOn': 'Invite someone to share a pot.',
  'together.card.subPaired': {
    one: 'With {name} · 1 shared pot',
    other: 'With {name} · {count} shared pots',
  },
  'together.card.open': 'Open Budget together',
  'together.you': 'You',
  'together.partner': 'Your partner',

  'together.intro.title': 'Save for it together.',
  'together.intro.sub':
    'Share a pot with the person you save with. You both add to it, and each of you sees who put in what. Your own days stay on your phone.',
  'together.intro.note':
    'Sign in with Apple is only for Budget together. 6pm asks for your first name, never your email.',
  'together.signIn.failed': 'Couldn’t sign in with Apple. Try again.',
  'together.signIn.unavailable': 'Sign in with Apple isn’t available on this iPhone.',

  'together.waiting.title': 'Just you so far.',
  'together.waiting.sub':
    'Send the link to the person you save with. When they join, they see your shared pots.',
  'together.paired.title': 'You and {name}',
  'together.paired.sub': { one: '1 shared pot', other: '{count} shared pots' },
  'together.invite': 'Invite someone',
  'together.invite.again': 'Send a new invite link',
  'together.invite.message': 'Save with me on 6pm: {url}',
  'together.invite.note': 'An invite link works once, for 7 days.',
  'together.offline': 'Offline. This is what you saw last.',

  'together.pots.title': 'Shared pots',
  'together.newPot': 'New shared pot',
  'together.newPotSub': 'You both add to it.',
  'together.jar.add': 'Add {amount} to {name}',
  'together.jar.split': 'You {mine} · {partner} {theirs}',
  'together.jar.mine': 'You put in {mine}',

  'together.pot.edit': 'Edit shared pot',
  'together.pot.start': 'Start shared pot',
  'together.pot.save': 'Save',
  'together.pot.sumMonthly': 'About {amount} a month, both of you together',
  'together.pot.sumSub': 'What you put in counts like a top-up to your own pots.',
  'together.pot.sumNone': 'No date, no rush',
  'together.pot.sumNoneSub': 'Add to it whenever you like.',
  'together.pot.amount': 'Add',
  'together.pot.addButton': 'Add {amount}',
  'together.pot.entries': 'Who put in what',
  'together.pot.empty': 'Nothing in it yet.',
  'together.pot.entry': '{who} · {day}',
  'together.pot.takeBack': 'Take back',
  'together.pot.takeBackLabel': 'Take back {amount}',
  'together.pot.delete': 'Delete shared pot',
  'together.pot.deleteConfirm': 'Tap again to delete it for both of you',
  'together.pot.deleted': 'Deleted {name}',
  'together.pot.gone': 'This pot is gone. Your partner may have deleted it.',

  'together.leave': 'Leave Budget together',
  'together.leaveConfirm': 'Tap again to leave',
  'together.leave.note':
    'Leaving ends it for both of you and deletes the shared pots from our server. Each of you keeps what you put in, on your own phone.',
  'together.deleteAccount': 'Delete Budget together account',
  'together.deleteConfirm': 'Tap again to delete your account',
  'together.delete.note':
    'Deletes your sign-in and everything you share, and tells Apple 6pm no longer uses your Apple ID. Your own days stay on this phone.',
  'together.kept.title': 'Kept on this iPhone',
  'together.kept.sub': 'What you put into shared pots: {amount}. It stays here when a pot is gone.',

  'together.join.title': 'Join Budget together',
  'together.join.sub':
    'Someone invited you to share pots on 6pm. Sign in with Apple to join them. Your own days stay on your phone.',
  'together.join.button': 'Join',
  'together.join.expired': 'This invite has expired. Ask for a new link.',
  'together.join.used': 'This invite has already been used. Ask for a new link.',
  'together.join.full': 'Two people already share pots there.',
  'together.join.own': 'This is your own invite. Send it to the person you save with.',
  'together.join.paired':
    'You already share pots. Leave Budget together first, then open the link again.',
  'together.join.missing': 'This invite link doesn’t work. Ask for a new one.',

  'together.error.offline': 'Couldn’t reach 6pm. Nothing changed.',
  'together.error.failed': 'That didn’t go through. Nothing changed.',
  'together.ended': 'Budget together has ended. What you put in stays on this phone.',
  'together.left': 'You left Budget together.',
  'together.deleted': 'Budget together account deleted.',
  'together.joined': 'You’re in. Budget together with {name}.',
} as const;
