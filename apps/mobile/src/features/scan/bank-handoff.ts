import * as Clipboard from 'expo-clipboard';
import { Linking } from 'react-native';

import { appStoreUrl, type BankInfo } from '@6pm/domain';

/**
 * What happened when 6pm tried to open the bank: it opened, it is not on this iPhone (the App
 * Store page opened instead), or 6pm has no link to it and the user opens it themselves.
 */
export type HandoffResult = 'opened' | 'store' | 'manual';

/**
 * Hands a payment to a bank app. No Vietnamese bank takes an amount through its link, so the
 * amount goes on the clipboard first (digits only, as a bank's amount field wants it).
 */
export async function handOff(
  bank: BankInfo | null,
  amount: number | null,
): Promise<HandoffResult> {
  if (amount !== null) await Clipboard.setStringAsync(String(amount));
  const app = bank?.ios;
  if (!app) return 'manual';
  if (await Linking.canOpenURL(app.scheme).catch(() => false)) {
    await Linking.openURL(app.scheme);
    return 'opened';
  }
  await Linking.openURL(appStoreUrl(app));
  return 'store';
}
