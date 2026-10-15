/**
 * The capture guide's step-by-step walkthroughs: each step's words, and the other apps' labels drawn
 * inside the pictured screens. Those labels are iOS's and Gmail's own, as their English screens
 * show them, so they read the same as what the user will see.
 */
export const enCaptureWalk = {
  'capture.walk.stepOf': 'Step {step} of {total}',
  'capture.walk.next': 'Next',
  'capture.walk.back': 'Back',
  'capture.walk.again': 'Start again',
  'capture.walk.mistakes': 'Common mistakes',

  'capture.walk.wallet.s1Title': 'Add the 6pm shortcut',
  'capture.walk.wallet.s1Body':
    'Tap “Add the 6pm shortcut” below, then Add Shortcut. It’s called “Log to 6pm”.',
  'capture.walk.wallet.s2Title': 'Open Automation and tap +',
  'capture.walk.wallet.s2Body':
    'In Shortcuts, tap Library, then Automation, then +. If you see “Describe a shortcut”, tap Edit.',
  'capture.walk.wallet.s3Title': 'Add the Wallet trigger',
  'capture.walk.wallet.s3Body':
    'In the panel at the bottom, tap Automation, then Wallet. The card “When Any Card is tapped” appears.',
  'capture.walk.wallet.s4Title': 'Run “Log to 6pm”',
  'capture.walk.wallet.s4Body':
    'Tap Search, type “Run Shortcut” and tap it. Then tap Shortcut and pick “Log to 6pm”.',
  'capture.walk.wallet.s5Title': 'Turn off Show When Run, then go back',
  'capture.walk.wallet.s5Body':
    'Leave Automation on. Going back saves it. To catch only some cards, tap Any Card and pick them.',
  'capture.walk.wallet.s6Title': 'Test it',
  'capture.walk.wallet.s6Body':
    'Pay for something with Apple Pay on this iPhone, then open 6pm. The tap is in your Inbox.',
  'capture.walk.wallet.mistake1':
    'A shortcut with no “When Any Card is tapped” card at the top. It only runs when you run it yourself.',
  'capture.walk.wallet.mistake2':
    'Run Shortcut left without a shortcut. Tap Shortcut and pick “Log to 6pm”, or taps log nothing.',
  'capture.walk.wallet.mistake3':
    'Show When Run left on. Every tap stops to show you a card instead of logging quietly.',
  'capture.walk.wallet.olderTitle': 'On iOS 26',
  'capture.walk.wallet.older1': 'In Shortcuts, open the Automation tab and tap +.',
  'capture.walk.wallet.older2': 'Tap Wallet, choose your cards, pick Run Immediately, then Next.',
  'capture.walk.wallet.older3': 'Pick “Log to 6pm” from your shortcuts, then Done.',
  'capture.walk.wallet.handTitle': 'Rather build it yourself?',
  'capture.walk.wallet.hand1':
    'Instead of Run Shortcut, add “Log in 6pm” and turn off Show When Run.',
  'capture.walk.wallet.hand2':
    'Set Amount to Transaction › Amount, and Where to Transaction › Merchant.',

  'capture.walk.email.s1Title': 'On a computer, open Gmail’s settings',
  'capture.walk.email.s1Body':
    'Forwarding can’t be set in the Gmail app. In Gmail on the web, click the gear, then See all settings.',
  'capture.walk.email.s2Title': 'Forwarding and POP/IMAP',
  'capture.walk.email.s2Body': 'Open that tab and click Add a forwarding address.',
  'capture.walk.email.s3Title': 'Paste your 6pm address',
  'capture.walk.email.s3Body': 'Copy it with the button below, paste it, then Next and Proceed.',
  'capture.walk.email.s4Title': 'Enter the code 6pm shows you',
  'capture.walk.email.s4Body':
    'Gmail sends a confirmation to your 6pm address and 6pm shows you the code. Type it next to Verify.',
  'capture.walk.email.s5Title': 'Make a filter for receipts',
  'capture.walk.email.s5Body':
    'Don’t forward everything. Open the search options and put your receipt senders in From.',
  'capture.walk.email.s6Title': 'Forward it to 6pm',
  'capture.walk.email.s6Body':
    'Click Create filter, tick Forward it to, choose your 6pm address, and Create filter again.',
  'capture.walk.email.otherTitle': 'Other mail',
  'capture.walk.email.outlook': 'Outlook.com',
  'capture.walk.email.outlook1': 'On the web, open Settings, then Mail, then Rules.',
  'capture.walk.email.outlook2':
    'Add new rule: when it’s from your receipt senders, forward it to your 6pm address.',
  'capture.walk.email.outlook3': 'Save. Outlook may ask you to sign in again first.',
  'capture.walk.email.icloud': 'iCloud Mail',
  'capture.walk.email.icloud1': 'On icloud.com/mail, open Settings, then Rules, then +.',
  'capture.walk.email.icloud2':
    'If a message is from a receipt sender, forward it to your 6pm address.',
  'capture.walk.email.icloud3': 'Add one rule per sender. It can take 15 minutes to start.',

  'capture.walk.share.s1Title': 'Open the receipt in your bank app',
  'capture.walk.share.s1Body': 'The screen after a transfer, or one from your history. Tap Share.',
  'capture.walk.share.s2Title': 'Tap 6pm',
  'capture.walk.share.s2Body':
    'Scroll the app row if it’s not there. You can share one or more photos of receipts too.',
  'capture.walk.share.s3Title': 'Check it and confirm',
  'capture.walk.share.s3Body':
    'I read the amount and who you paid. Confirm, and it’s in your Inbox.',
  'capture.walk.share.inInbox': 'In your Inbox',

  'capture.walk.bank.done': 'Transfer successful',
  'capture.walk.bank.from': 'From',
  'capture.walk.bank.yourBank': 'Your bank',
  'capture.walk.bank.share': 'Share',
  'capture.walk.bank.home': 'Home',

  'capture.walk.test.paid': 'Done',
  'capture.walk.test.inbox': 'Inbox',
  'capture.walk.test.row': 'Apple Pay · to review',

  'capture.walk.ios.library': 'Library',
  'capture.walk.ios.allShortcuts': 'All Shortcuts',
  'capture.walk.ios.shareSheet': 'Share Sheet',
  'capture.walk.ios.gallery': 'Gallery',
  'capture.walk.ios.automation': 'Automation',
  'capture.walk.ios.apps': 'Apps',
  'capture.walk.ios.edit': 'Edit',
  'capture.walk.ios.noAutomations': 'No Automations',
  'capture.walk.ios.noAutomationsSub': 'Make shortcuts run automatically.',
  'capture.walk.ios.newShortcut': 'New Shortcut',
  'capture.walk.ios.describe': 'Describe a shortcut',
  'capture.walk.ios.addActions': 'Add actions from below to create a shortcut.',
  'capture.walk.ios.search': 'Search',
  'capture.walk.ios.scripting': 'Scripting',
  'capture.walk.ios.sendMessage': 'Send Message',
  'capture.walk.ios.openApp': 'Open App',
  'capture.walk.ios.playMusic': 'Play Music',
  'capture.walk.ios.app': 'App',
  'capture.walk.ios.appEx': '“When Weather is opened or closed”',
  'capture.walk.ios.wallet': 'Wallet',
  'capture.walk.ios.walletEx': '“When I tap a Wallet Card or Pass”',
  'capture.walk.ios.screenshot': 'Screenshot',
  'capture.walk.ios.screenshotEx': '“When a screenshot is saved”',
  'capture.walk.ios.when': 'When',
  'capture.walk.ios.isTapped': 'is tapped',
  'capture.walk.ios.anyCard': 'Any Card',
  'capture.walk.ios.showWhenRun': 'Show When Run',
  'capture.walk.ios.addShortcut': 'Add Shortcut',
  'capture.walk.ios.dontAdd': 'Don’t Add',
  'capture.walk.ios.runShortcut': 'Run Shortcut',
  'capture.walk.ios.run': 'Run',
  'capture.walk.ios.shortcut': 'Shortcut',
  'capture.walk.ios.shortcutA': 'Home ETA',
  'capture.walk.ios.shortcutB': 'Laundry Timer',
  'capture.walk.ios.personal': 'Personal',
  'capture.walk.ios.walletSummary': 'When I tap a Wallet pass or payment card',
  'capture.walk.ios.messages': 'Messages',
  'capture.walk.ios.mail': 'Mail',
  'capture.walk.ios.image': 'Image',
  'capture.walk.ios.copy': 'Copy',
  'capture.walk.ios.saveImage': 'Save Image',

  'capture.walk.gmail.searchMail': 'Search mail',
  'capture.walk.gmail.quickSettings': 'Quick settings',
  'capture.walk.gmail.seeAll': 'See all settings',
  'capture.walk.gmail.settings': 'Settings',
  'capture.walk.gmail.general': 'General',
  'capture.walk.gmail.labels': 'Labels',
  'capture.walk.gmail.filters': 'Filters and Blocked Addresses',
  'capture.walk.gmail.forwarding': 'Forwarding and POP/IMAP',
  'capture.walk.gmail.forwardingHead': 'Forwarding:',
  'capture.walk.gmail.addAddress': 'Add a forwarding address',
  'capture.walk.gmail.enterAddress': 'Please enter a new forwarding email address:',
  'capture.walk.gmail.next': 'Next',
  'capture.walk.gmail.cancel': 'Cancel',
  'capture.walk.gmail.proceed': 'Proceed',
  'capture.walk.gmail.forwardTo': 'Forward incoming email to',
  'capture.walk.gmail.verify': 'Verify',
  'capture.walk.gmail.code': 'confirmation code',
  'capture.walk.gmail.disable': 'Disable forwarding',
  'capture.walk.gmail.from': 'From',
  'capture.walk.gmail.subject': 'Subject',
  'capture.walk.gmail.hasWords': 'Has the words',
  'capture.walk.gmail.createFilter': 'Create filter',
  'capture.walk.gmail.search': 'Search',
  'capture.walk.gmail.whenArrives': 'When a message is an exact match for your search criteria:',
  'capture.walk.gmail.skipInbox': 'Skip the Inbox (Archive it)',
  'capture.walk.gmail.markRead': 'Mark as read',
  'capture.walk.gmail.forwardIt': 'Forward it to:',
  'capture.walk.gmail.inbox': 'Inbox',
} as const;
