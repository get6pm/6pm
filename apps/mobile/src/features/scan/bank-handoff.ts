import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { appStoreUrl, handoffUrl, payloadFor, type BankInfo, type VietQR } from '@6pm/domain';

import { saveImage } from '../sharing/share-image';
import { shareFileName } from '../sharing/share-file';
import { qrImage } from './qr-image';

/**
 * What happened when 6pm tried to open the bank: it opened, it is not on this iPhone (the App
 * Store page opened instead), or 6pm has no link to it and the user opens it themselves.
 */
export type HandoffResult = 'opened' | 'store' | 'manual';

export interface Handoff {
  readonly result: HandoffResult;
  /** The payment's QR is in Photos, for the bank app's "scan from photo". */
  readonly qrSaved: boolean;
}

/**
 * Hands a payment to a bank app. A bank seen to take 6pm's transfer link opens with the payment
 * filled in. Any other bank cannot be handed it, so the payment's QR (the amount written in, a
 * shop's code as scanned) is saved to Photos for the bank's own scanner to read back, and the app
 * opens at its home. The amount goes on the clipboard either way (digits only, as a bank's amount
 * field wants it).
 *
 * The app is opened without asking iOS first whether it is there: that check is deprecated and
 * capped at 25 apps, and opening fails just as clearly when the app is missing.
 */
export async function handOff(bank: BankInfo | null, qr: VietQR, amount: number): Promise<Handoff> {
  await Clipboard.setStringAsync(String(amount));
  const app = bank?.ios;
  const url = app ? handoffUrl(app, qr, amount) : null;
  const filledIn = app !== undefined && app !== null && url !== app.scheme;
  const qrSaved = filledIn ? false : await saveQr(payloadFor(qr, amount));
  if (!app || url === null) return { result: 'manual', qrSaved };
  const opened = await Linking.openURL(url).then(
    () => true,
    () => false,
  );
  if (opened) return { result: 'opened', qrSaved };
  await Linking.openURL(appStoreUrl(app));
  return { result: 'store', qrSaved };
}

/** Saves the code to Photos; a refusal or a failure leaves the copied amount to carry the payment. */
async function saveQr(payload: string): Promise<boolean> {
  try {
    const saved = await saveImage(
      () => Promise.resolve(qrImage(payload)),
      shareFileName('payment-qr', ''),
    );
    return saved === 'saved';
  } catch {
    return false;
  }
}
