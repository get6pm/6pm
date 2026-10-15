import { parseSpokenSpend } from '../capture/spoken-spend';
import { parseWalletAmount } from '../capture/wallet-amount';
import {
  SURFACES_VERSION,
  type InboxSpend,
  type LogSpendResult,
  type SurfaceContext,
} from '../contracts/surfaces';
import { currencyOf } from '../money/currency';
import { foreignToHome } from '../travel/home-fx';
import { contextMoney } from './context-money';
import { amountText, fileCategory, safeAfterText } from './file-category';

const titleOf = (name: string, category: string | undefined) =>
  [name, category].filter((part): part is string => !!part).join(' · ');

/** Minor units of a currency as an exact decimal in its own units: 350 cents is "3.50". */
function decimalOf(minor: number, code: string): string {
  const digits = currencyOf(code).minorDigits;
  return (minor / 10 ** digits).toFixed(digits);
}

/**
 * Logging a spend from the shortcut, as Wallet's automation or Siri calls it.
 *
 * - With a merchant it is an Apple Pay tap: source `applePay`, caught for the close. An amount
 *   Wallet could not read ("0.0", blank) still logs, with no amount, for the close to fix. An
 *   amount in another currency than home ("$3.50" on a phone counting đồng) is priced at the
 *   app's last rate for it; with none it logs without an amount, its foreign amount waiting
 *   for the rate the app finds for that day.
 * - Without one it was said to Siri: source `voice`, kept. The words are read like Quick add's
 *   voice ("phở forty-five k"), in the home currency; with no amount in them Siri asks again
 *   (`needsAmount`).
 */
export function buildLogSpend(
  spokenOrAmount: string,
  merchant: string | null,
  context: SurfaceContext | null,
  now: Date,
  id: string,
): LogSpendResult {
  const money = contextMoney(context);
  const { home, format } = money;
  const merchantName = (merchant ?? '').trim();
  const fromWallet = merchantName !== '';
  const wallet = fromWallet ? parseWalletAmount(spokenOrAmount, home) : null;
  const spoken = fromWallet ? null : parseSpokenSpend(spokenOrAmount, home);

  const abroad = wallet !== null && wallet.currency !== home.code;
  const printed = wallet && abroad ? decimalOf(wallet.amount, wallet.currency) : null;
  const rate = wallet && abroad ? money.rate(wallet.currency) : null;
  const priced = printed !== null && rate !== null ? foreignToHome(printed, rate, home) : null;
  const amount = wallet
    ? abroad
      ? priced !== null && priced > 0
        ? priced
        : null
      : wallet.amount
    : (spoken?.amount ?? null);
  if (!fromWallet && amount === null) {
    return { item: null, needsAmount: true, amountText: '', title: '', safeAfterText: null };
  }
  const name = fromWallet ? merchantName : (spoken?.name ?? '');
  const category = fileCategory(context, name, fromWallet ? name : spokenOrAmount, now);
  const foreign: InboxSpend['foreign'] =
    wallet && printed !== null
      ? {
          currency: wallet.currency,
          amount: printed,
          ...(rate !== null && amount !== null ? { rate } : {}),
        }
      : undefined;
  const shown =
    amount !== null
      ? amountText(format, amount)
      : foreign
        ? money.foreignText(foreign.amount, foreign.currency)
        : format.full(0);
  return {
    item: {
      v: SURFACES_VERSION,
      id,
      kind: 'spend',
      source: fromWallet ? 'applePay' : 'voice',
      status: fromWallet ? 'caught' : 'kept',
      at: now.toISOString(),
      amount,
      ...(home.code === 'VND' ? {} : { currency: home.code }),
      merchant: name,
      categoryId: category?.id ?? null,
      ...(foreign ? { foreign } : {}),
    },
    needsAmount: false,
    amountText: shown,
    title: titleOf(name, category?.name),
    safeAfterText: safeAfterText(context, format, category, amount),
  };
}
