/**
 * Text iOS shows outside the app: permission prompts (written into each language's InfoPlist) and
 * the titles of the widgets, the share extension and the shortcuts (written into `.strings`
 * tables by `tools/scripts/generate-native.ts`). The key's second part names the table.
 */
export const enNative = {
  'native.permission.camera': '6pm uses the camera to read VietQR codes when you scan to pay.',
  'native.permission.microphone':
    '6pm listens while you hold to say a spend. What you say is understood on this iPhone.',
  'native.permission.speech':
    '6pm turns what you say into an amount and a name, on this iPhone. Nothing is sent anywhere.',
  'native.permission.photosAdd':
    '6pm saves your close receipt and money diary to Photos when you ask it to.',
  'native.permission.location':
    '6pm checks which country you are in so Travel mode can turn on by itself abroad.',
  'native.surfaces.safeToday.name': 'Safe today',
  'native.surfaces.safeToday.description': 'What you can spend today, at a glance.',
  'native.surfaces.setUp': 'Open 6pm to set up',
  'native.surfaces.markPaid.title': 'Paid',
  'native.share.title': 'Add to 6pm',
  'native.intents.logSpend.title': 'Log in 6pm',
  'native.intents.logSpend.amount': 'Amount',
  'native.intents.logSpend.merchant': 'Where',
} as const;
