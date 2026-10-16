/**
 * The page's day: each section carries the hour it stands for (`data-hour`), and as the visitor
 * scrolls, the hour at the middle of the screen paints the sky, moves the sun, lights the stars,
 * flips the ink from day to night and sets the nav's clock.
 */

/** Hour, then the sky's top, middle and bottom colours and its sun's colour. */
const stops: readonly (readonly [number, string, string, string, string])[] = [
  [6, '#b9b4dc', '#efc9d2', '#ffe1b0', '#ff9f8a'],
  [9, '#8fd0c6', '#e4efcf', '#fff1cf', '#fff07a'],
  [13, '#62b7c2', '#cfe8d2', '#f9eccb', '#ffe36b'],
  [16, '#5f97a8', '#f0c39c', '#ff9d6a', '#ffcf5a'],
  [17.4, '#33427f', '#e0607a', '#ffad45', '#ffd23f'],
  [18.2, '#1a2456', '#b8336a', '#ff6b35', '#ffc53d'],
  [19.3, '#0f1838', '#3a1c5a', '#8e2a58', '#ff5470'],
  [21, '#081026', '#0f2038', '#16384a', '#1fbf9a'],
  [24, '#04070e', '#08141e', '#0c2628', '#17a387'],
];

/** From this hour the page is dark and its ink light. */
const nightFrom = 17.3;

const day = {
  '--ink': '#1b1e2e',
  '--ink2': 'rgba(27,30,46,.72)',
  '--line': 'rgba(27,30,46,.16)',
  '--glass': 'rgba(255,253,249,.5)',
  '--inv': '#fbf4ec',
  '--acc': '#c4441c',
  '--nav': 'rgba(240,246,236,.55)',
};
const night: typeof day = {
  '--ink': '#fbf4ec',
  '--ink2': 'rgba(251,244,236,.74)',
  '--line': 'rgba(251,244,236,.16)',
  '--glass': 'rgba(255,255,255,.08)',
  '--inv': '#1b1e2e',
  '--acc': '#ff8552',
  '--nav': 'rgba(12,9,22,.5)',
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const rgb = (hex: string): number[] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** `a` mixed towards `b` by `k`, as `rgb(…)` (or `rgba(…)` with an alpha). */
function mix(a: string, b: string, k: number, alpha?: number): string {
  const from = rgb(a);
  const to = rgb(b);
  const parts = from.map((v, i) => Math.round(v + ((to[i] ?? v) - v) * k));
  return alpha === undefined ? `rgb(${parts.join(',')})` : `rgba(${parts.join(',')},${alpha})`;
}

/** The sky's three colours and the sun's colour at an hour. */
export function skyAt(hour: number): string[] {
  const h = Math.max(6, Math.min(24, hour));
  let i = 0;
  while (i < stops.length - 2 && h > (stops[i + 1]?.[0] ?? 24)) i++;
  const a = stops[i];
  const b = stops[i + 1];
  if (!a || !b) return [];
  const k = clamp01((h - a[0]) / (b[0] - a[0]));
  return [1, 2, 3, 4].map((j) => mix(a[j] as string, b[j] as string, k));
}

/** The hour at the middle of the screen, read from where each section sits. */
function hourNow(sections: readonly HTMLElement[]): number {
  const mid = innerHeight * 0.5;
  const points = sections.map(
    (s) =>
      [
        s.getBoundingClientRect().top + Math.min(s.offsetHeight, innerHeight) * 0.5,
        Number(s.dataset.hour),
      ] as const,
  );
  const first = points[0];
  if (!first) return 9;
  if (mid <= first[0]) return first[1];
  for (let i = 0; i < points.length - 1; i++) {
    const [y0, h0] = points[i] as readonly [number, number];
    const [y1, h1] = points[i + 1] as readonly [number, number];
    if (mid <= y1) return h0 + ((h1 - h0) * (mid - y0)) / (y1 - y0);
  }
  return points[points.length - 1]?.[1] ?? 9;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function startSky(root: HTMLElement): void {
  const sky = root.querySelector<HTMLElement>('[data-sky]');
  const sun = root.querySelector<HTMLElement>('[data-sun]');
  const stars = root.querySelector<HTMLElement>('[data-stars]');
  const haze = root.querySelector<HTMLElement>('[data-haze]');
  const horizon = root.querySelector<HTMLElement>('[data-horizon]');
  const leak = root.querySelector<HTMLElement>('[data-leak]');
  const clock = root.querySelector<HTMLElement>('[data-nav-clock]');
  const chrome = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const sections = [...root.querySelectorAll<HTMLElement>('[data-hour]')];
  if (!sky || !sun || !sections.length) return;

  let last = -1;
  let wasNight: boolean | null = null;
  const paint = (): void => {
    const h = hourNow(sections);
    if (h === last) return;
    last = h;
    const [top = '', middle = '', bottom = ''] = skyAt(h);
    sky.style.background = `linear-gradient(180deg, ${top} 0%, ${middle} 52%, ${bottom} 100%)`;
    document.body.style.background = top;
    chrome?.setAttribute('content', top);

    const isNight = h >= nightFrom;
    if (isNight !== wasNight) {
      wasNight = isNight;
      for (const [name, value] of Object.entries(isNight ? night : day)) {
        root.style.setProperty(name, value);
      }
    }

    const dusk = clamp01((h - 15.5) / 2.7);
    const top0 = h <= 18.2 ? 14 + ((h - 9) / 9.2) * 64 : 78 + (h - 18.2) * 40;
    sun.style.top = `${Math.max(14, top0)}vh`;
    sun.style.setProperty('--sun', mix('#fff3b0', '#ffb070', dusk));
    sun.style.setProperty('--rim', mix('#ffe08a', '#e8503a', dusk));
    sun.style.setProperty('--haze', String(dusk > 0.5 ? (dusk - 0.5) * 2 : 0));
    sun.style.transform = `scale(${1 + dusk * 0.14}, ${1 - dusk * 0.06})`;
    sun.style.opacity = h > 19.4 ? '0' : '1';
    if (haze) {
      const warm = mix('#ffe2bf', '#ff7a4a', dusk, h > 20 ? 0.1 : 0.38);
      const cool = (0.18 + dusk * 0.25).toFixed(2);
      haze.style.background = `radial-gradient(120% 60% at 50% 100%, ${warm}, transparent 60%), radial-gradient(80% 50% at 10% 0%, rgba(40,30,90,${cool}), transparent 70%)`;
    }
    if (leak) leak.style.filter = `hue-rotate(${h > 19.5 ? 160 : 0}deg)`;
    if (stars) stars.style.opacity = String(clamp01((h - 19.2) / 1.8));
    if (horizon) horizon.style.opacity = String(Math.max(0, 1 - Math.abs(h - 18.4) / 1.4));
    if (clock) {
      const hh = Math.floor(h);
      const mm = Math.floor((h - hh) * 60);
      clock.textContent = `${pad(Math.min(23, hh))}:${pad(hh >= 24 ? 59 : mm)}`;
    }
  };

  let frame = 0;
  const schedule = (): void => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      paint();
    });
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  paint();
}
