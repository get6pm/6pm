import type { Vnd } from './format';

const BILLION = /^(tỷ|tỉ|ty|ti|bn|billion|billions)$/;
const MILLION = /^(tr|triệu|trieu|củ|cu|m|mil|million|millions)$/;
const THOUSAND = /^(k|nghìn|nghin|ngàn|ngan|ng|nghìn đồng|thousand|thousands)$/;

/**
 * Reads an amount the way people say or type it in Vietnam: "45k", "45 nghìn", "45.000",
 * "1tr2" (1.200.000), "1,5tr", "2 triệu rưỡi" (2.500.000), "3 tỷ", "1ty2" (1.200.000.000), "350". A bare small number means
 * thousands ("35" → 35.000), as the design's keypad and Ask do; a bare number of 1000 or more is
 * taken as written. Returns null when no amount is found.
 */
export function parseAmount(text: string): Vnd | null {
  const s = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/₫|đ\b|vnd|đồng/g, ' ');
  const match =
    /(\d+(?:[.,]\d+)*)\s*(?:(tỷ|tỉ|ty|ti|billions?|bn|triệu|trieu|tr|củ|cu|millions?|mil|m|nghìn|nghin|ngàn|ngan|ng|thousands?|k)(?!\p{L}))?(\d{1,3})?(?:\s*(rưỡi|ruoi)(?!\p{L}))?/u.exec(
      s,
    );
  if (!match) return null;
  const [, rawNumber = '', rawUnit, trailing, half] = match;
  const unit = rawUnit ?? '';
  const isBillion = BILLION.test(unit);
  const isMillion = MILLION.test(unit);
  const isThousand = THOUSAND.test(unit);

  let value = readNumber(rawNumber, isBillion || isMillion || isThousand);
  if (value === null) return null;

  if (isBillion) {
    value *= 1_000_000_000;
    // "1ty2" = 1.2 billion.
    if (trailing) value += Number(trailing) * 10 ** (9 - trailing.length);
  } else if (isMillion) {
    value *= 1_000_000;
    // "1tr2" = 1.2 million, "1tr25" = 1.25 million.
    if (trailing) value += Number(trailing) * 10 ** (6 - trailing.length);
  } else if (isThousand) {
    value *= 1000;
    if (trailing) value += Number(trailing) * 10 ** (3 - trailing.length);
  } else if (value < 1000) {
    value *= 1000;
  }
  // "rưỡi" is half of the unit: "2 triệu rưỡi" is 2.500.000, "45 nghìn rưỡi" is 45.500.
  if (half) value += isBillion ? 500_000_000 : isMillion ? 500_000 : 500;
  return Math.round(value);
}

/**
 * "45.000" and "1.250.000" are grouped thousands; "1.5" and "1,5" are decimals (only meaningful
 * before a unit).
 */
function readNumber(raw: string, hasUnit: boolean): number | null {
  const groups = raw.split(/[.,]/);
  if (groups.length === 1) return Number(raw);
  const grouped = groups.slice(1).every((g) => g.length === 3);
  if (grouped && !(hasUnit && groups.length === 2 && raw.includes(','))) {
    return Number(groups.join(''));
  }
  if (groups.length === 2) return Number(`${groups[0]}.${groups[1]}`);
  return null;
}
