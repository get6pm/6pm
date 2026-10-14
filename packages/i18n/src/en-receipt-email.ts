/**
 * Receipt email: the forwarding address in Settings and its guide, where a receipt came from, and
 * a mail service's request to confirm forwarding.
 */
export const enReceiptEmail = {
  'receiptEmail.copy': 'Copy address',
  'receiptEmail.share': 'Share your 6pm address',
  'receiptEmail.offline': 'Your address shows once you’re online',
  'receiptEmail.from': 'From {address}',
  'receiptEmail.check.title': '{provider} is asking to confirm forwarding from {address}',
  'receiptEmail.check.titleNoAddress': '{provider} is asking to confirm forwarding to 6pm',
  'receiptEmail.check.code': 'Confirmation code',
  'receiptEmail.check.copy': 'Copy',
  'receiptEmail.check.copyLabel': 'Copy the confirmation code',
  'receiptEmail.check.copied': 'Code copied.',
  'receiptEmail.check.hint':
    'Open the confirm page, or paste the code in {provider} settings. Then forwarded receipts land here.',
  'receiptEmail.check.open': 'Open confirm page',
  'receiptEmail.check.openFailed': 'Couldn’t open the page. Copy the code instead.',
  'receiptEmail.check.done': 'Done',
} as const;
