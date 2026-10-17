import type { Variants } from './catalogue-types';

/**
 * How Android reads the keys that are not true there as the catalogue writes them: "this phone"
 * for "this iPhone", Google Play for the App Store, a backup key that stays on the phone, and no
 * share sheet, Apple Pay, widgets or Siri to point at.
 */
export const enAndroid = {
  // Ask: the ways in that this phone has, and what to do instead of the ones it lacks.
  'ask.howTo.ways':
    'Three ways in: Quick add (typed or said), scanning a QR or a receipt, and forwarding receipt emails. What 6pm catches waits in your Inbox until the close.',
  'capture.share.headline':
    'Save the receipt as a picture, then choose it in Scan. I’ll read the amount.',
  'capture.wallet.headline':
    'Apple Pay isn’t on this phone. Forward your card’s receipt emails and they turn up on their own.',
  'capture.widgets.headline':
    'There are no 6pm widgets on this phone. Hold the scan button and Quick add opens.',

  // Backup: the key is kept on this phone only, so a backup opens only here.
  'backup.row.on': 'Encrypted · {when}',
  'backup.status.sub': {
    one: '{count} item · encrypted. 6pm still works without it.',
    other: '{count} items · encrypted. 6pm still works without it.',
  },
  'backup.status.neverSub': 'Encrypted. 6pm still works without it.',
  'backup.off.sub':
    'Sealed on this phone before it leaves. The key stays on this phone, so we can’t read a thing.',
  'backup.tooLarge': 'The last backup was too big to send. Everything is still on this phone.',
  'backup.note':
    'Backs up once a day, after you close. The key never leaves this phone, so a backup opens only here, not on a new phone.',
  'backup.paused': 'Backup is paused without Max. Your last backup is still safe, encrypted.',
  'backup.found.title': 'There’s already a backup for this phone.',
  'backup.found.sub': 'It came from an earlier install. Backing up from here would replace it.',
  'backup.found.restoreConfirm': 'Tap again to replace this phone’s days',
  'backup.found.replace': 'Replace it with this phone',
  'backup.restore.sub': { one: '{count} item · encrypted.', other: '{count} items · encrypted.' },
  'backup.restore.none': 'No backup found for this phone.',
  'backup.restore.wrongKey': 'The key on this phone can’t open this backup.',
  'backup.error.keychain': 'This phone wouldn’t keep the key, so nothing was backed up. Try again.',
  'backup.error.tooLarge': 'This backup is too big to send. Everything is still on this phone.',

  // How spending gets caught.
  'capture.email.sub': 'No forwarding address on this phone',
  'capture.scan.tip': 'Hold the scan button for Quick add when there’s no code to scan.',
  'onboarding.catch.add.body': 'Hold the scan button for Quick add and say “coffee {amount}”.',
  'today.list.empty': 'Nothing caught yet. Scan a QR or a receipt, or tap + when you spend.',

  // Looks and Max are bought through Google Play.
  'looks.restore.none': 'Nothing to restore on this Google account.',
  'looks.restore.failed': 'Couldn’t reach Google Play. Try again.',
  'looks.legal':
    'Looks are one-time purchases on your Google account. Max is a subscription you can cancel any time in Google Play. Prices are shown by Google Play.',
  'look.buying': 'Waiting for Google Play…',
  'look.noteStoreOff': 'Google Play isn’t answering, so this look can’t be bought just yet.',
  'max.cta.waiting': 'Waiting for Google Play…',
  'max.terms.storeOff': 'Max can’t be bought just now: Google Play isn’t answering.',
  'max.sub.backup': 'Encrypted backup, full history, CSV and Sheets.',
  'max.note.backup': 'Encrypted backup, CSV and Sheets',
  'max.welcome.win.more': 'Pots, travel and the Year book',

  // Where AI runs, and privacy.
  'privacy.ai.device.title': 'Only on this phone',
  'privacy.ai.device.unavailable': 'This phone doesn’t have the memory for a model of its own.',
  'settings.ai.device': 'On this phone',
  'privacy.leaves.device.none': 'Nothing AI. Everything is worked out on this phone.',
  'receiptEmail.deviceMode': 'Off while AI stays on this phone',
  'receiptEmail.deviceMode.body':
    'Receipt email needs our server to read your mail, so it’s off while 6pm keeps AI on this phone. Scan the receipt instead.',
  'settings.privacyBody':
    'Your money stays on this phone, encrypted. To read your Ask questions and write your companion’s lines, 6pm sends Anthropic, an AI service, the question or a few facts about your day: amounts, places and category names, never your list of spends. A receipt photo your phone can’t read goes there too. Anthropic doesn’t train on them and deletes them within 30 days. When you say a spend, your voice goes to Deepgram to become text. Under AI, above, you can keep all of this on this phone. Backup leaves only if you turn it on, end-to-end encrypted. Crash reports go to Sentry without amounts, names or notes, and RevenueCat handles purchases.',

  // Scan's bank hand-off, and pictures saved to the phone.
  'scan.handoff.store': '{wallet} isn’t on this phone',
  'scan.handoff.savedQr':
    'QR saved to your gallery: scan it from your photos in the bank app. I’ll ask when you’re back.',
  'sharing.saved': 'Saved to your gallery.',
  'sharing.photosOff': 'Photo access is off for 6pm.',

  'startup.failedSub': 'Nothing is lost. Try again, and if it keeps happening, restart your phone.',
  'voice.unavailable': 'Voice needs {language} dictation on this phone',
} as const satisfies Variants;
