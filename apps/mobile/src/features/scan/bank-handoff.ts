import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { appStoreUrl, handoffUrl, type BankInfo, type VietQR } from '@6pm/domain';

/**
 * What happened when 6pm tried to open the bank: it opened, it is not on this iPhone (the App
 * Store page opened instead), or 6pm has no link to it and the user opens it themselves.
 */
export type HandoffResult = 'opened' | 'store' | 'manual';

/**
 * Hands a payment to a bank app. A bank seen to take 6pm's transfer link opens with the payment
 * filled in; any other opens at its home. The amount goes on the clipboard either way (digits
 * only, as a bank's amount field wants it), for when the bank asks for it again.
 *
 * The app is opened without asking iOS first whether it is there: that check is deprecated and
 * capped at 25 apps, and opening fails just as clearly when the app is missing.
 */
export async function handOff(
  bank: BankInfo | null,
  qr: VietQR,
  amount: number,
): Promise<HandoffResult> {
  await Clipboard.setStringAsync(String(amount));
  const app = bank?.ios;
  if (!app) return 'manual';
  const opened = await Linking.openURL(handoffUrl(app, qr, amount)).then(
    () => true,
    () => false,
  );
  if (opened) return 'opened';
  await Linking.openURL(appStoreUrl(app));
  return 'store';
}
