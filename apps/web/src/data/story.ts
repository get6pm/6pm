import { chipCount } from './flights';
import { tileInks } from './habits';
import { seeded } from './seeded';

/** The title cards: each fades in at `a` and out at `b` of its scene's scroll. */
export const titleLines = [
  { en: 'Every day, money leaves quietly.', vi: 'Mỗi ngày, tiền lặng lẽ ra đi.', a: -0.12, b: 0.3 },
  {
    en: 'A coffee. A ride. A “why not”.',
    vi: 'Một ly cà phê. Một cuốc xe. Một câu “thôi kệ”.',
    a: 0.32,
    b: 0.64,
  },
  { en: 'By the 25th, it’s just… gone.', vi: 'Đến ngày 25, chẳng còn gì.', a: 0.66, b: 1.2 },
] as const;

const chipKinds: readonly (readonly [string, string, string, number])[] = [
  ['local_cafe', 'Highlands Coffee', '45.000', 25],
  ['two_wheeler', 'Grab bike', '38.000', 220],
  ['shopping_bag', 'Shopee', '289.000', 20],
  ['ramen_dining', 'Phở bò', '65.000', 60],
  ['local_bar', 'Bia hơi', '120.000', 80],
  ['bakery_dining', 'Bánh mì', '25.000', 55],
  ['storefront', 'Circle K', '42.000', 150],
  ['local_mall', 'Uniqlo', '499.000', 330],
  ['movie', 'CGV', '110.000', 290],
  ['sports_esports', 'Steam', '215.000', 260],
  ['local_taxi', 'Be car', '86.000', 200],
  ['icecream', 'Trà sữa', '45.000', 340],
  ['redeem', 'Quà sinh nhật', '350.000', 10],
  ['restaurant', 'Lẩu', '380.000', 40],
  ['smartphone', 'Top-up', '100.000', 240],
  ['checkroom', 'Áo khoác', '450.000', 300],
];

/** The 84 spends that fly past in the leak. */
export const chips = Array.from({ length: chipCount }, (_, i) => {
  const [icon = '', name = '', amount = '', hue = 0] = chipKinds[(i * 7) % chipKinds.length] ?? [];
  return { icon, name, amount, ...tileInks(hue) };
});

export const stars = (() => {
  const r = seeded(7);
  return Array.from({ length: 70 }, () => ({
    x: (r() * 100).toFixed(2) + '%',
    y: (r() * 72).toFixed(2) + '%',
    z: (1 + r() * 1.8).toFixed(1) + 'px',
    d: (r() * 3).toFixed(2) + 's',
  }));
})();

/** The hour ruler: 17:00 to 22:00, labelled only at six. */
export const ruler = [17, 18, 19, 20, 21, 22].map((h, i) => ({
  label: h === 18 ? '6PM' : '',
  top: i * 20 + '%',
}));

/** The sixty second ticks of the dial. */
export const ticks = Array.from({ length: 60 }, (_, i) => ({
  i,
  angle: i * 6 + 'deg',
  w: i % 5 === 0 ? '4px' : '2px',
  h: i % 5 === 0 ? '7%' : '4%',
}));

/** How one number is made. `d` is when the line lights up. */
export const sums = [
  { label: 'Money in, October', value: '18.500.000', d: 0, ink: '#fbf4ec' },
  { label: 'Fixed bills', value: '− 6.836.000', d: 0.1, ink: '#ffb4a3' },
  { label: 'Pots: Tết, Lan’s birthday', value: '− 2.800.000', d: 0.28, ink: '#ffb4a3' },
  { label: 'Future you', value: '− 2.000.000', d: 0.46, ink: '#9fe0b6' },
  { label: '÷ 22 days to payday', value: '= 312.000', d: 0.64, ink: '#ff8552' },
] as const;

/** Thirty diary days; days 6, 13 and 24 were never closed. */
export const diaryTiles = (() => {
  const dows = ['TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'MON'];
  const skipped = [6, 13, 24];
  const r = seeded(3);
  return Array.from({ length: 30 }, (_, i) => {
    const n = i + 1;
    const open = skipped.includes(n);
    const amount = Math.round(120 + r() * 230);
    const tilt = ((r() - 0.5) * 7).toFixed(1) + 'deg';
    // The design draws one more number for each closed day (an unused stamp flag); keep the sequence.
    if (!open) r();
    return {
      n: String(n).padStart(2, '0'),
      dow: dows[i % 7] ?? '',
      tilt,
      open,
      amount: open ? 'not closed' : `≈ ${amount}k`,
      over: amount > 290,
    };
  });
})();
