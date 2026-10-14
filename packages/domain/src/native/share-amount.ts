import { readPrintedNumber } from '../capture/wallet-amount';
import type { ShareCard, ShareCurrency, SurfaceContext } from '../contracts/surfaces';
import { formatVnd, groupDigits, type Vnd } from '../money/format';
import { parseAmount } from '../money/parse-amount';
import { travelCurrency } from '../travel/currencies';
import { DECIMAL_PATTERN, foreignToVnd, formatForeign, isRate } from '../travel/fx';

/** The rate the app last had for a currency, đồng for one unit. */
export function rateIn(context: SurfaceContext | null, currency: string): string | null {
  const rate = context?.rates?.find((r) => r.currency === currency)?.rate;
  return rate !== undefined && isRate(rate) ? rate : null;
}

/** Decimals a currency's prices are written with; đồng and the Travel list's whole ones none. */
export function decimalsOf(currency: string): 0 | 2 {
  if (currency === 'VND') return 0;
  return travelCurrency(currency)?.decimals ?? 2;
}

function symbolOf(currency: string): string {
  return currency === 'VND' ? '₫' : (travelCurrency(currency)?.symbol ?? currency);
}

export function currencyOption(context: SurfaceContext | null, code: string): ShareCurrency {
  return {
    code,
    label: `${symbolOf(code)} · ${code}`,
    rate: code === 'VND' ? null : rateIn(context, code),
  };
}

/** A decimal string rounded to the currency's decimals: "68.80" for 68.8 in SGD. */
export function toDecimal(value: number, currency: string): string | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const fixed = value.toFixed(decimalsOf(currency));
  return DECIMAL_PATTERN.test(fixed) && Number(fixed) > 0 ? fixed : null;
}

/** "S$68,80", "Rp935.550", or "68.80 CHF" for a currency 6pm has no symbol for. */
export function foreignText(amount: string, currency: string): string {
  const known = travelCurrency(currency);
  if (!known) return `${amount} ${currency}`;
  return formatForeign(Math.round(Number(amount) * 10 ** known.decimals), known);
}

/** What the Edit field opens with: "120.000" in đồng, "68,80" abroad. */
export function editTextOf(amount: string | null, currency: string): string {
  if (amount === null) return '';
  if (decimalsOf(currency) === 0) return groupDigits(Math.round(Number(amount)));
  const [whole = '0', cents = ''] = amount.split('.');
  return `${groupDigits(Number(whole))}${cents === '' ? '' : `,${cents}`}`;
}

/** What the card and its inbox item say once the edits are applied. */
export interface ShareAmount {
  readonly amount: Vnd | null;
  readonly foreign: { currency: string; amount: string; rate: string | null } | null;
  readonly amountText: string;
  readonly inDongText: string | null;
  readonly decimalEntry: boolean;
}

/** An amount typed in a foreign currency: "68,80", "68.8", "935.550". */
function typedForeign(text: string, currency: string): string | null {
  const digits = /\d(?:[\d.,\s]*\d)?/.exec(text)?.[0];
  const value = digits === undefined ? null : readPrintedNumber(digits);
  return value === null ? null : toDecimal(value, currency);
}

/**
 * The card's amount in the currency chosen: as read, or as typed in Edit. In đồng it is read
 * like Quick add reads it ("45" is 45.000₫); in another currency as printed, priced at the
 * app's rate when there is one.
 */
export function shareAmount(
  card: ShareCard,
  edits: { readonly amountText?: string | undefined; readonly currency?: string | undefined },
): ShareAmount {
  const typed = edits.amountText !== undefined && edits.amountText.trim() !== '';
  const currency = edits.currency ?? card.currency ?? 'VND';
  if (currency === 'VND') {
    const printed =
      card.printed !== null && !card.printed.includes('.') ? Number(card.printed) : null;
    const read = card.currency === 'VND' ? card.amount : printed;
    const amount = typed ? parseAmount(edits.amountText ?? '') : read;
    const usable = amount !== null && amount > 0 ? amount : null;
    return {
      amount: usable,
      foreign: null,
      amountText: usable === null ? '' : formatVnd(usable),
      inDongText: null,
      decimalEntry: false,
    };
  }
  const value = typed ? typedForeign(edits.amountText ?? '', currency) : card.printed;
  const listed = card.currencies.find((c) => c.code === currency)?.rate;
  const rate = listed ?? (card.foreign?.currency === currency ? card.foreign.rate : null);
  const vnd = value !== null && rate !== null ? foreignToVnd(value, rate) : null;
  return {
    amount: vnd !== null && vnd > 0 ? vnd : null,
    foreign: value === null ? null : { currency, amount: value, rate },
    amountText: value === null ? '' : foreignText(value, currency),
    inDongText: vnd !== null && vnd > 0 ? formatVnd(vnd) : null,
    decimalEntry: decimalsOf(currency) > 0,
  };
}
