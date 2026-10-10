import { clamp01 } from './seeded';

/**
 * The evening sky by the hour: [hour, horizon top, horizon middle, horizon bottom, bloom 1,
 * bloom 2]. The same keyframes as the Saigon look's evening in the app.
 */
const keyframes: readonly (readonly [number, string, string, string, string, string])[] = [
  [16, '#5f97a8', '#f0c39c', '#ff9d6a', '#ffcf5a', '#ff7aa0'],
  [17.4, '#33427f', '#e0607a', '#ffad45', '#ffd23f', '#ff4f8b'],
  [18.2, '#1a2456', '#b8336a', '#ff6b35', '#ffc53d', '#ff3f7f'],
  [19.3, '#0f1838', '#3a1c5a', '#8e2a58', '#ff5470', '#28c9b5'],
  [21, '#081026', '#0f2038', '#16384a', '#1fbf9a', '#ff3d6e'],
  [24, '#04070e', '#08141e', '#0c2628', '#17a387', '#d6335c'],
];

function rgb(hex: string): readonly number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear RGB mix of two hex colours, as the design mixes them (`t` 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const from = rgb(a);
  const to = rgb(b);
  return (
    '#' +
    from
      .map((v, i) =>
        Math.round(v + ((to[i] ?? 0) - v) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** The five sky colours at a decimal hour (18.5 is 18:30). */
export function palette(hour: number): readonly string[] {
  let i = 0;
  while (i < keyframes.length - 2 && hour > (keyframes[i + 1]?.[0] ?? Infinity)) i++;
  const a = keyframes[i];
  const b = keyframes[i + 1];
  if (!a || !b) return [];
  const t = clamp01((hour - a[0]) / (b[0] - a[0]));
  return [1, 2, 3, 4, 5].map((k) => mix(a[k] as string, b[k] as string, t));
}

/** The page's sky custom properties at an hour: the hero horizon, the blooms and the backdrop. */
export function skyVariables(hour: number): readonly (readonly [string, string])[] {
  const [h0 = '', h1 = '', h2 = '', b1 = '', b2 = ''] = palette(hour);
  const dark = [h0, h1, h2].map((c) => mix(c, '#09070f', 0.52));
  return [
    ['--h0', h0],
    ['--h1', h1],
    ['--h2', h2],
    ['--sea0', mix(h2, '#0b0716', 0.5)],
    ['--b1', b1],
    ['--b2', b2],
    ['--s0', dark[0] ?? ''],
    ['--s1', dark[1] ?? ''],
    ['--s2', dark[2] ?? ''],
    ['--hourT', clamp01((hour - 17) / 5).toFixed(4)],
    ['--night', clamp01((hour - 19.4) / 1.4).toFixed(3)],
  ];
}

/** "18:05" for a decimal hour. */
export function clockAt(hour: number): string {
  const hh = Math.floor(hour);
  const mm = Math.min(59, Math.floor((hour - hh) * 60));
  return `${String(hh % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
