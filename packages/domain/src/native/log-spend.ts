import { parseSpokenSpend } from '../capture/spoken-spend';
import { parseWalletAmount } from '../capture/wallet-amount';
import { SURFACES_VERSION, type LogSpendResult, type SurfaceContext } from '../contracts/surfaces';
import { formatVnd } from '../money/format';
import { amountText, fileCategory, safeAfterText } from './file-category';

const titleOf = (name: string, category: string | undefined) =>
  [name, category].filter((part): part is string => !!part).join(' · ');

/**
 * Logging a spend from the shortcut, as Wallet's automation or Siri calls it.
 *
 * - With a merchant it is an Apple Pay tap: source `applePay`, caught for the close. An amount
 *   Wallet could not read ("0.0", blank) still logs, as 0₫ with no amount, for the close to fix;
 *   a foreign amount ("$3.50") logs the same way with what was printed as its note.
 * - Without one it was said to Siri: source `voice`, kept. The words are read like Quick add's
 *   voice ("phở forty-five k"); with no amount in them Siri asks again (`needsAmount`).
 */
export function buildLogSpend(
  spokenOrAmount: string,
  merchant: string | null,
  context: SurfaceContext | null,
  now: Date,
  id: string,
): LogSpendResult {
  const merchantName = (merchant ?? '').trim();
  const fromWallet = merchantName !== '';
  const wallet = fromWallet ? parseWalletAmount(spokenOrAmount) : null;
  const spoken = fromWallet ? null : parseSpokenSpend(spokenOrAmount);

  const amount = wallet
    ? wallet.currency === 'VND'
      ? wallet.amount
      : null
    : (spoken?.amount ?? null);
  if (!fromWallet && amount === null) {
    return { item: null, needsAmount: true, amountText: '', title: '', safeAfterText: null };
  }
  const name = fromWallet ? merchantName : (spoken?.name ?? '');
  const category = fileCategory(context, name, fromWallet ? name : spokenOrAmount, now);
  const foreign = wallet && wallet.currency !== 'VND' ? spokenOrAmount.trim() : null;
  return {
    item: {
      v: SURFACES_VERSION,
      id,
      kind: 'spend',
      source: fromWallet ? 'applePay' : 'voice',
      status: fromWallet ? 'caught' : 'kept',
      at: now.toISOString(),
      amount,
      merchant: name,
      categoryId: category?.id ?? null,
      ...(foreign ? { note: foreign } : {}),
    },
    needsAmount: false,
    amountText: amount === null ? formatVnd(0) : amountText(amount),
    title: titleOf(name, category?.name),
    safeAfterText: safeAfterText(context, category, amount),
  };
}
