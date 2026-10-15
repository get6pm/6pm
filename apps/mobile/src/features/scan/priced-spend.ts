import {
  foreignToHome,
  homeRate,
  RATE_PENDING,
  rateNumber,
  type Currency,
  type SpendRow,
} from '@6pm/domain';

/** A spend's amount as its row keeps it: home minor units, and what it was priced from. */
export interface PricedAmount {
  readonly amount: number;
  readonly foreignAmount: SpendRow['foreignAmount'];
}

/**
 * Money paid in a currency (`amount` as an exact decimal: "45000", "12.5"), as a spend in the home
 * currency: priced through the server's đồng quotes, with what was paid and the rate (home units
 * for one unit) beside it. In the home currency itself it is kept as it is. With no rate yet it is
 * kept at 0 with a pending rate, to be priced when the rates come, never refused. Null when the
 * amount is not a number above zero.
 */
export function pricedInHome(
  currency: string,
  amount: string,
  home: Currency,
  dongPerUnit: (code: string) => string | null,
): PricedAmount | null {
  if (currency === home.code) {
    const own = foreignToHome(amount, '1', home);
    return own === null ? null : { amount: own, foreignAmount: null };
  }
  const paid = Number(amount);
  if (!(paid > 0) || foreignToHome(amount, '1', home) === null) return null;
  const rate = homeRate(currency, home, dongPerUnit);
  const priced = rate === null ? null : foreignToHome(amount, rate, home);
  if (rate === null || priced === null || priced <= 0) {
    return { amount: 0, foreignAmount: { currency, amount: paid, rate: RATE_PENDING } };
  }
  return { amount: priced, foreignAmount: { currency, amount: paid, rate: rateNumber(rate) } };
}

/** A VietQR's đồng as a spend in the home currency; in Vietnam, the đồng as they are. */
export function dongInHome(
  dong: number,
  home: Currency,
  dongPerUnit: (code: string) => string | null,
): PricedAmount {
  return (
    pricedInHome('VND', String(Math.round(dong)), home, dongPerUnit) ?? {
      amount: 0,
      foreignAmount: null,
    }
  );
}
