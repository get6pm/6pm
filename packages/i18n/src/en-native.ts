/**
 * Text iOS shows outside the app: permission prompts (written into each language's InfoPlist) and
 * the titles of the widgets, the share extension and the shortcuts (written into `.strings`
 * tables by `tools/scripts/generate-native.ts`). The key's second part names the table.
 */
export const enNative = {
  'native.permission.camera':
    '6pm uses the camera to read the QR codes and receipts you scan. Photos stay on your iPhone unless a receipt needs a closer look.',
  'native.permission.microphone':
    '6pm listens while you say a spend. Your voice goes to a speech-to-text service to be written down, or stays on this iPhone in on-device mode.',
  'native.permission.speech':
    '6pm turns what you say into an amount and a name, on this iPhone. Nothing is sent anywhere.',
  'native.permission.photos':
    '6pm only saves your close receipt and money diary to Photos. It never looks through your library.',
  'native.permission.photosAdd':
    '6pm saves your close receipt and money diary to Photos when you ask it to.',
  'native.permission.location':
    '6pm checks which country you are in so Travel mode can turn on by itself abroad.',
  'native.surfaces.safeToday.name': 'Safe today',
  'native.surfaces.safeToday.description': 'What you can spend today, at a glance.',
  'native.surfaces.setUp': 'Open 6pm to set up',
  'native.surfaces.markPaid.title': 'Paid',
  'native.surfaces.todayList.name': 'Today',
  'native.surfaces.todayList.description': 'What you spent today, newest first.',
  'native.share.title': 'Add to 6pm',
  'native.share.readFromBank': 'Read on this iPhone from your {bank} receipt',
  'native.share.readHere': 'Read on this iPhone from your receipt',
  'native.share.unreadable': 'Couldn’t read this receipt. Type the amount.',
  'native.share.to': 'To',
  'native.share.when': 'When',
  'native.share.code': 'Code',
  'native.share.category': 'Category',
  'native.share.unsure': 'Not sure about the name. Tap it to check.',
  'native.share.checkName': 'Check the name',
  'native.share.amountHint': 'Amount',
  'native.share.nameHint': 'Who you paid',
  'native.share.chooseCategory': 'Choose',
  'native.share.edit': 'Edit',
  'native.share.done': 'Done',
  'native.share.confirm': 'Confirm',
  'native.share.currency': 'Currency',
  'native.share.currencyUnsure': 'The receipt doesn’t print its currency. Tap it to check.',
  'native.share.checkCurrency': 'Check the currency',
  'native.share.inDong': '≈ {amount}',
  'native.share.noRate': 'No rate yet. 6pm prices it at that day’s rate once it has one.',
  'native.share.unknownCurrency': 'Couldn’t tell the currency. Type the amount in đồng.',
  'native.share.unknownCurrencyIn': 'Couldn’t tell the currency. Type the amount in {currency}.',
  'native.share.looking': 'Reading it more closely…',
  'native.share.step': '{n} of {total}',
  'native.share.skip': 'Skip',
  'native.intents.logSpend.title': 'Log in 6pm',
  'native.intents.logSpend.amount': 'Amount',
  'native.intents.logSpend.merchant': 'Where',
  'native.intents.logSpend.description':
    'Log a spend in 6pm: Apple Pay taps from Wallet, or what you say to Siri.',
  'native.intents.logSpend.short': 'Log a spend',
  'native.intents.logSpend.askAmount': 'How much was it?',
  'native.intents.logSpend.logged': 'Logged.',
  'native.intents.logSpend.failed': '6pm could not log that. Open 6pm and try Quick add.',
  'native.intents.scan.title': 'Scan QR',
  'native.intents.scan.description': 'Open Scan to pay in 6pm.',
  'native.intents.quickAdd.title': 'Quick add',
  'native.intents.quickAdd.description': 'Open Quick add in 6pm.',
} as const;
