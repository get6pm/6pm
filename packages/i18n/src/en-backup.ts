/** Backup: the Settings row, the Backup sheet, restoring on a new iPhone, and the companion's lines. */
export const enBackup = {
  'backup.title': 'Backup',
  'backup.row.off': 'Off',
  'backup.row.on': 'iCloud · {when}',
  'backup.row.found': 'Found a backup',
  'backup.row.deleting': 'Deleting…',
  'backup.ago.now': 'just now',
  'backup.ago.minutes': { one: '{count} minute ago', other: '{count} minutes ago' },
  'backup.ago.hours': { one: '{count} hour ago', other: '{count} hours ago' },
  'backup.ago.days': { one: '{count} day ago', other: '{count} days ago' },

  'backup.status.on': 'Backed up {when}.',
  'backup.status.sub': {
    one: 'iCloud · {count} item · encrypted. 6pm still works without it.',
    other: 'iCloud · {count} items · encrypted. 6pm still works without it.',
  },
  'backup.status.never': 'Ready when you are.',
  'backup.status.neverSub': 'iCloud · encrypted. 6pm still works without it.',
  'backup.off.title': 'Keep every day, forever.',
  'backup.off.sub':
    'Sealed on this iPhone before it leaves. The key stays in your iCloud Keychain, so we can’t read a thing.',
  'backup.tooLarge': 'The last backup was too big to send. Everything is still on this iPhone.',
  'backup.note':
    'Backs up once a day, after you close. To restore on a new iPhone, turn on iCloud Keychain in iOS Settings.',
  'backup.paused': 'Backup is paused without Max. Your last backup is still safe in iCloud.',
  'backup.empty': 'Nothing to back up yet. Close your first day and come back.',

  'backup.turnOn': 'Turn on backup',
  'backup.now': 'Back up now',
  'backup.working': 'Backing up…',
  'backup.delete': 'Delete backup',
  'backup.deleteConfirm': 'Tap again to delete your backup',
  'backup.deleting': 'Deleting…',
  'backup.deletePending':
    'Your backup will be deleted as soon as 6pm is online. Nothing more is sent meanwhile.',

  'backup.found.title': 'There’s already a backup in your iCloud.',
  'backup.found.sub':
    'It came from another iPhone or an earlier install. Backing up from here would replace it.',
  'backup.found.restore': 'Restore it here',
  'backup.found.restoreConfirm': 'Tap again to replace this iPhone’s days',
  'backup.found.replace': 'Replace it with this iPhone',

  'backup.restore.link': 'Restore from backup',
  'backup.restore.title': 'Restore from backup',
  'backup.restore.found': 'Found your backup from {date}.',
  'backup.restore.sub': {
    one: '{count} item · encrypted in iCloud.',
    other: '{count} items · encrypted in iCloud.',
  },
  'backup.restore.do': 'Restore my days',
  'backup.restore.working': 'Restoring…',
  'backup.restore.fresh': 'Start fresh instead',
  'backup.restore.freshNote':
    'Starting fresh keeps your backup until the first new one you make replaces it.',
  'backup.restore.looking': 'Looking for your backup…',
  'backup.restore.none': 'No backup found for this iCloud Keychain.',
  'backup.restore.unsupported':
    'This backup was made by a newer 6pm. Update the app to restore it.',
  'backup.restore.wrongKey': 'The key on this iPhone can’t open this backup.',
  'backup.restore.damaged': 'This backup is damaged and can’t be restored.',

  'backup.error.network': 'Couldn’t reach 6pm. Try again in a moment.',
  'backup.error.keychain':
    'iCloud Keychain wouldn’t keep the key, so nothing was backed up. Check it is on in iOS Settings.',
  'backup.error.tooLarge': 'This backup is too big to send. Everything is still on this iPhone.',
  'backup.retry': 'Try again',
  'backup.error.generic': 'That didn’t work. Try again.',

  'backup.toast.deleted': 'Backup deleted.',
  'companion.backupDone.soft': 'Backed up. Your days are safe.',
  'companion.backupDone.cheeky': 'Backed up. Even your worst Tuesday is safe now.',
  'companion.backupDone.roast': 'Backed up. Your mistakes are in the cloud forever.',
  'companion.backupDone.plain': 'Backup complete.',
  'companion.backupRestored.soft': 'Welcome back. Everything is here.',
  'companion.backupRestored.cheeky': 'Back from the cloud. Nothing missing.',
  'companion.backupRestored.roast': 'Restored. Try not to lose another phone.',
  'companion.backupRestored.plain': 'Backup restored.',
} as const;
