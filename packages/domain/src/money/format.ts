/** Integer đồng. VND has no minor unit, so every amount is a whole number. */
export type Vnd = number;

/** The minus sign the design uses everywhere (U+2212), never a hyphen. */
export const MINUS = '−';

/** Groups digits with dots, the Vietnamese way: 1250000 → "1.250.000". Sign is dropped. */
export function groupDigits(amount: Vnd): string {
  return Math.abs(Math.round(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Full amount with the đồng sign: 49000 → "49.000₫", −1250000 → "−1.250.000₫". */
export function formatVnd(amount: Vnd): string {
  const rounded = Math.round(amount);
  return (rounded < 0 ? MINUS : '') + groupDigits(rounded) + '₫';
}

/**
 * The short form used in labels and companion lines: millions with one decimal and a comma
 * ("17,4tr", "2tr"), everything else in thousands ("353k", "0k").
 */
export function formatShort(amount: Vnd): string {
  const sign = amount < 0 ? MINUS : '';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return sign + (Math.round(abs / 100_000) / 10).toString().replace('.', ',') + 'tr';
  }
  const thousands = Math.round(abs / 1000);
  return (thousands === 0 ? '' : sign) + thousands + 'k';
}

/** Rounds down to whole thousands, as every daily line in the design does. */
export function floorToThousand(amount: Vnd): Vnd {
  return Math.floor(amount / 1000) * 1000;
}

/** Rounds up to the next 50.000₫, as pot and goal set-asides do. */
export function ceilToFiftyThousand(amount: Vnd): Vnd {
  return Math.ceil(amount / 50_000) * 50_000;
}
