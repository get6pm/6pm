import type { Currency, Money } from '../money/currency';
import { foreignToHome, homeRate } from '../travel/home-fx';

/** Minor units written as an exact decimal of major units: 1234 cents is "12.34". */
function majorText(amount: Money, currency: Currency): string {
  const digits = String(amount).padStart(currency.minorDigits + 1, '0');
  if (currency.minorDigits === 0) return digits;
  return `${digits.slice(0, -currency.minorDigits)}.${digits.slice(-currency.minorDigits)}`;
}

/**
 * What a contribution to a pot kept in `pot`'s currency counts as against a plan in `home`, from
 * the server's đồng quotes. The same currency is the amount itself. Null when a quote is missing,
 * so nothing is counted on a guess.
 */
export function sharedInHome(
  amount: Money,
  pot: Currency,
  home: Currency,
  dongPerUnit: (code: string) => string | null,
): Money | null {
  if (pot.code === home.code) return amount;
  if (!Number.isSafeInteger(amount) || amount < 0) return null;
  const rate = homeRate(pot.code, home, dongPerUnit);
  if (rate === null) return null;
  return foreignToHome(majorText(amount, pot), rate, home);
}
