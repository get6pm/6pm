import { toMinor, type MoneyFormat, type MoneyParts } from '@6pm/domain';

/**
 * What is typed on the keypad in the home currency, written as the amount will be: the whole part
 * grouped, and the decimals exactly as typed so far ("$12." while the cents are still coming).
 * Đồng reads "45.000₫", as it always has.
 */
export function typedParts(digits: string, money: MoneyFormat): MoneyParts {
  const [whole = '', fraction] = digits.split('.');
  const parts = money.parts(toMinor(whole === '' ? 0 : Number(whole), money.currency));
  if (fraction === undefined) return parts;
  return { ...parts, number: parts.number + money.locale.decimal + fraction };
}

/** `typedParts` as one string: "45.000₫", "$12.5", "12,5 €". */
export function typedText(digits: string, money: MoneyFormat): string {
  const p = typedParts(digits, money);
  return p.sign + p.prefix + p.number + p.suffix;
}

/** The decimal key's mark when the home currency has decimals; none for đồng or yen. */
export function homeDecimalMark(money: MoneyFormat): string | undefined {
  return money.currency.minorDigits > 0 ? money.locale.decimal : undefined;
}

/** The short form ("$17.4k", "353k") in pieces, so its symbol can be set apart as `full`'s is. */
export function shortParts(amount: number, money: MoneyFormat): MoneyParts {
  const { sign, prefix, suffix } = money.parts(amount);
  const short = money.short(amount);
  const signed = sign !== '' && short.startsWith(sign);
  const rest = signed ? short.slice(sign.length) : short;
  const before = prefix !== '' && rest.startsWith(prefix) ? prefix : '';
  const after = suffix !== '' && rest.endsWith(suffix) ? suffix : '';
  return {
    sign: signed ? sign : '',
    prefix: before,
    number: rest.slice(before.length, rest.length - after.length),
    suffix: after,
  };
}
