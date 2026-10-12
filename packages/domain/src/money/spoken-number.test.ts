import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { readSpokenNumbers, spokenAmount, spokenToDigits } from './spoken-number';

const amountOf = (text: string) => {
  const numbers = readSpokenNumbers(text);
  const spoken = [...numbers].reverse().find((n) => n.scaled) ?? numbers[numbers.length - 1];
  return spoken ? spokenAmount(spoken) : null;
};

const EN_SMALL =
  'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(
    ' ',
  );
const EN_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

/** 1…999 the way English says it: "one hundred and forty-five". */
function english(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const tens =
    rest < 20
      ? EN_SMALL[rest]
      : `${EN_TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${EN_SMALL[rest % 10]}` : ''}`;
  if (hundreds === 0) return tens ?? '';
  return `${EN_SMALL[hundreds]} hundred${rest ? ` and ${tens}` : ''}`;
}

const VI = 'không một hai ba bốn năm sáu bảy tám chín'.split(' ');

/** 1…999 the way Vietnamese says it in full: "một trăm linh năm", "hai mươi mốt", "mười lăm". */
function vietnamese(n: number): string {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const units = n % 10;
  const parts: string[] = [];
  if (hundreds > 0) parts.push(VI[hundreds] ?? '', 'trăm');
  if (tens === 0 && units > 0 && hundreds > 0) parts.push('linh', VI[units] ?? '');
  else if (tens === 1)
    parts.push('mười', ...(units === 0 ? [] : [units === 5 ? 'lăm' : (VI[units] ?? '')]));
  else if (tens > 1) {
    parts.push(VI[tens] ?? '', 'mươi');
    if (units === 1) parts.push('mốt');
    else if (units === 5) parts.push('lăm');
    else if (units > 0) parts.push(VI[units] ?? '');
  } else if (units > 0) parts.push(VI[units] ?? '');
  return parts.join(' ');
}

describe('readSpokenNumbers', () => {
  it.each([
    ['forty-five k', 45_000],
    ['forty five thousand', 45_000],
    ['one point two million', 1_200_000],
    ['two and a half million', 2_500_000],
    ['a million and a half', 1_500_000],
    ['half a million', 500_000],
    ['one hundred and fifty k', 150_000],
    ['twenty one thousand five hundred', 21_500],
    ['a hundred thousand', 100_000],
  ])('reads English "%s" as %i', (text, value) => {
    expect(amountOf(text)).toBe(value);
  });

  it.each([
    ['bốn mươi lăm nghìn', 45_000],
    ['bốn lăm k', 45_000],
    ['bốn lăm nghìn', 45_000],
    ['một triệu hai', 1_200_000],
    ['hai trăm rưỡi', 250_000],
    ['hai triệu rưỡi', 2_500_000],
    ['bốn lăm nghìn rưỡi', 45_500],
    ['một trăm hai mươi nghìn', 120_000],
    ['một trăm hai nghìn', 120_000],
    ['hai trăm linh năm nghìn', 205_000],
    ['mười lăm nghìn', 15_000],
    ['hai mươi mốt nghìn', 21_000],
    ['ba mươi tư nghìn', 34_000],
    ['năm nghìn tư', 5_400],
    ['một nghìn không trăm năm mươi', 1_050],
    ['chục nghìn', 10_000],
    ['hai chục nghìn', 20_000],
    ['triệu rưỡi', 1_500_000],
    ['một triệu hai trăm nghìn', 1_200_000],
    ['ba tỷ', 3_000_000_000],
  ])('reads Vietnamese "%s" as %i', (text, value) => {
    expect(amountOf(text)).toBe(value);
  });

  it.each([
    ['45k', 45_000],
    ['45 nghìn', 45_000],
    ['45.000', 45_000],
    ['45.000đ', 45_000],
    ['1tr2', 1_200_000],
    ['1 triệu hai', 1_200_000],
    ['1,5tr', 1_500_000],
    ['1tr25', 1_250_000],
    ['45', 45_000],
  ])('reads dictated digits "%s" as %i', (text, value) => {
    expect(amountOf(text)).toBe(value);
  });

  it('reads a number without a unit as a typed one would be', () => {
    expect(readSpokenNumbers('forty-five')).toMatchObject([{ value: 45, scaled: false }]);
    expect(amountOf('forty-five')).toBe(45_000);
    expect(amountOf('hai trăm')).toBe(200_000);
  });

  it('finds each number and where it sits', () => {
    const text = 'Phở Hai Thìn, bốn lăm nghìn';
    const found = readSpokenNumbers(text);
    expect(found.map((n) => [n.value, n.scaled])).toEqual([
      [2, false],
      [45_000, true],
    ]);
    expect(found.map((n) => text.slice(n.start, n.end))).toEqual(['Hai', 'bốn lăm nghìn']);
  });

  it('leaves alone words that only count inside a number', () => {
    expect(readSpokenNumbers('a coffee and a cake')).toEqual([]);
    expect(readSpokenNumbers('trà không đường')).toEqual([]);
    expect(readSpokenNumbers('half price')).toEqual([]);
    expect(readSpokenNumbers('k')).toEqual([]);
    expect(readSpokenNumbers('lăm tư mốt')).toEqual([]);
    expect(readSpokenNumbers('')).toEqual([]);
  });

  it('keeps two numbers said one after the other apart', () => {
    expect(readSpokenNumbers('2 45k').map((n) => n.value)).toEqual([2, 45_000]);
    expect(readSpokenNumbers('forty fifty').map((n) => n.value)).toEqual([40, 50]);
  });

  it('reads every English number from one to 999 thousand', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 999 }), (n) => {
        expect(amountOf(`${english(n)} thousand`)).toBe(n * 1000);
        expect(amountOf(`${english(n)} k`)).toBe(n * 1000);
      }),
      { numRuns: 400 },
    );
  });

  it('reads every Vietnamese number from một to 999 nghìn', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 999 }), (n) => {
        expect(amountOf(`${vietnamese(n)} nghìn`)).toBe(n * 1000);
      }),
      { numRuns: 400 },
    );
  });

  it('reads millions with thousands after them in both languages', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), fc.integer({ min: 1, max: 999 }), (m, k) => {
        expect(amountOf(`${english(m)} million ${english(k)} thousand`)).toBe(m * 1e6 + k * 1e3);
        expect(amountOf(`${vietnamese(m)} triệu ${vietnamese(k)} nghìn`)).toBe(m * 1e6 + k * 1e3);
      }),
    );
  });

  it('never throws, and gives only finite numbers inside the text', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 60 }), (text) => {
        for (const n of readSpokenNumbers(text)) {
          expect(Number.isFinite(n.value)).toBe(true);
          expect(n.start).toBeLessThan(n.end);
          expect(n.end).toBeLessThanOrEqual(text.normalize('NFC').length);
        }
      }),
    );
  });
});

describe('spokenAmount', () => {
  it('has no amount for zero', () => {
    const [zero] = readSpokenNumbers('zero k');
    expect(zero && spokenAmount(zero)).toBeNull();
  });
});

describe('spokenToDigits', () => {
  it('writes each spoken number in digits and keeps the rest', () => {
    expect(spokenToDigits('trà sữa, forty-five k')).toBe('trà sữa, 45000');
    expect(spokenToDigits('bốn lăm nghìn rưỡi nhé')).toBe('45500 nhé');
    expect(spokenToDigits('Phở Hai Thìn')).toBe('Phở 2 Thìn');
    expect(spokenToDigits('no numbers')).toBe('no numbers');
  });
});
