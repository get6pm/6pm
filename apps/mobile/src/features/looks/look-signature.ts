import { lookById, mixHex, type LookId, type Palette } from '@6pm/theme';

/** Slanted hairlines the card draws over its sky (CSS repeating gradients have no native twin). */
export interface Hatch {
  /** The CSS gradient angle: the lines run perpendicular to it. */
  readonly angle: number;
  readonly every: number;
  readonly color: string;
}

/** Concentric rings around a point, as a repeating radial gradient draws them. */
export interface Rings {
  /** The centre, in percent of the card. */
  readonly x: number;
  readonly y: number;
  readonly every: number;
  readonly color: string;
}

/** A conic gradient (CSS `conic-gradient`), drawn with a sweep. */
export interface Conic {
  /** CSS angle the sweep starts from, in degrees clockwise from the top. */
  readonly from: number;
  /** The centre in percent of the box. */
  readonly x: number;
  readonly y: number;
  readonly colors: readonly string[];
}

/** The sun of a look card: a gradient or colour, an optional sweep, and its glow. */
export interface SigSun {
  readonly image: string | null;
  readonly color: string | null;
  readonly conic: Conic | null;
  /** A CSS box-shadow. */
  readonly glow: string;
}

/** What a look card draws over its sky to say which look it is: the prototype's `sig()`. */
export interface LookSignature {
  /** Gradients React Native draws, as one `backgroundImage`; empty for none. */
  readonly image: string;
  /** The matching `backgroundSize`, one entry per layer. */
  readonly size: string;
  readonly hatch: Hatch | null;
  readonly rings: Rings | null;
  readonly conic: Conic | null;
  readonly sun: SigSun;
}

const HOLO_SWEEP = ['#ffc6e8', '#fff1b8', '#c4ffd6', '#bfefff', '#d9c8ff', '#ffc6e8'];

const spot = (x: number, y: number, c: string, r: number) =>
  `radial-gradient(circle at ${x}% ${y}%, ${c} 0px, ${c}00 ${r}px)`;

/** CSS `color from to` as two stops: React Native's gradients take one position per stop. */
const band = (color: string, from: string, to: string) => `${color} ${from}, ${color} ${to}`;

type Variant = Readonly<Record<string, unknown>>;

const text = (v: Variant, key: string, fallback: string): string => {
  const value = v[key];
  return typeof value === 'string' ? value : fallback;
};

const texts = (v: Variant, key: string): readonly string[] => {
  const value = v[key];
  return Array.isArray(value) ? value.filter((c): c is string => typeof c === 'string') : [];
};

/** The paper hills' colours at an hour (`paperCols`): dusk warms them, night sinks them. */
function paperColours(v: Variant, st: Palette['st'], hour: number): string[] {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const night = clamp((hour - 18.5) / 1.5);
  const dusk = clamp((hour - 16) / 2.2) * (1 - night);
  return texts(v, 'L').map((c, i) =>
    mixHex(mixHex(c, st[2], 0.1 + dusk * 0.32 * (1 - i / 6)), '#141a38', night * (0.66 - i * 0.05)),
  );
}

const plain = (sun: Partial<SigSun> & Pick<SigSun, 'glow'>): SigSun => ({
  image: null,
  color: null,
  conic: null,
  ...sun,
});

const NONE: Omit<LookSignature, 'sun'> = {
  image: '',
  size: 'auto',
  hatch: null,
  rings: null,
  conic: null,
};

/**
 * The prototype's `sig()` for one look and variant at an hour: the card's signature pattern and
 * its sun. `st` is the look's five sky colours at that hour.
 */
export function lookSignature(
  look: LookId,
  variantIndex: number,
  st: Palette['st'],
  hour: number,
): LookSignature {
  const def = lookById(look);
  const v: Variant = def.variants[variantIndex] ?? def.variants[0] ?? {};
  switch (look) {
    case 'neon':
      return {
        ...NONE,
        image: [
          spot(22, 74, st[3], 12),
          spot(46, 84, '#ffd27a', 7),
          spot(74, 70, st[4], 14),
          spot(88, 80, st[3], 6),
        ].join(', '),
        hatch: { angle: 104, every: 12, color: 'rgba(255,255,255,.18)' },
        sun: plain({
          image: `radial-gradient(circle, ${st[3]} 0%, ${st[3]}99 50%, ${st[3]}00 72%)`,
          glow: `0 0 30px 10px ${st[3]}55`,
        }),
      };
    case 'riso': {
      const i1 = text(v, 'i1', st[3]);
      const i2 = text(v, 'i2', st[4]);
      return {
        ...NONE,
        image: `radial-gradient(${i2} 1px, transparent 1.6px), radial-gradient(circle at 18% 112%, ${band(`${i1}99`, '0%', '42%')}, transparent 42.5%)`,
        size: '6px 6px, auto',
        sun: plain({ color: i1, glow: `7px -5px 0 ${i2}b0` }),
      };
    }
    case 'lacquer': {
      const metal = text(v, 'metal', st[3]);
      const flecks = [
        [18, 30, 2],
        [34, 72, 3],
        [78, 58, 2.5],
        [58, 18, 1.5],
        [88, 86, 2],
        [10, 60, 1.5],
      ] as const;
      return {
        ...NONE,
        image: [
          `linear-gradient(115deg, transparent 38%, ${metal}44 50%, transparent 62%)`,
          ...flecks.map(
            ([x, y, r]) =>
              `radial-gradient(circle at ${x}% ${y}%, ${band(metal, '0px', `${r}px`)}, transparent ${r + 0.6}px)`,
          ),
        ].join(', '),
        sun: plain({
          image: `radial-gradient(circle at 36% 30%, #fff8dc 0%, ${metal} 40%, ${mixHex(metal, '#000000', 0.45)} 100%)`,
          glow: `0 0 24px 4px ${metal}55`,
        }),
      };
    }
    case 'monsoon': {
      const drops = [
        [20, 30],
        [64, 22],
        [40, 62],
        [82, 54],
        [12, 80],
      ] as const;
      return {
        ...NONE,
        image: [
          ...drops.map(
            ([x, y]) =>
              `radial-gradient(circle at ${x}% ${y}%, ${band('rgba(255,255,255,.75)', '0px', '1.5px')}, ${band('rgba(255,255,255,.18)', '2.5px', '4.5px')}, transparent 5.5px)`,
          ),
          'linear-gradient(180deg, transparent 45%, rgba(255,255,255,.3) 68%, transparent 90%)',
        ].join(', '),
        hatch: { angle: 100, every: 14, color: 'rgba(255,255,255,.14)' },
        sun: plain({
          image: 'radial-gradient(circle, rgba(255,250,240,.95), rgba(255,250,240,0) 70%)',
          glow: '0 0 30px 14px rgba(255,255,255,.25)',
        }),
      };
    }
    case 'holo': {
      const sparks = [
        [20, 24],
        [82, 40],
        [40, 70],
        [66, 82],
      ] as const;
      return {
        ...NONE,
        image: sparks
          .map(
            ([x, y]) =>
              `radial-gradient(circle at ${x}% ${y}%, ${band('#ffffff', '0px', '1.5px')}, #ffffff00 4px)`,
          )
          .join(', '),
        conic: {
          from: 40,
          x: 70,
          y: 30,
          colors: ['#ff9ad577', '#ffd59a77', '#b6ff9a77', '#9af2ff77', '#b29aff77', '#ff9ad577'],
        },
        sun: plain({
          conic: { from: 210, x: 50, y: 50, colors: HOLO_SWEEP },
          glow: `0 0 0 5px #ffffff55, 0 0 30px 8px ${st[4]}88`,
        }),
      };
    }
    case 'arcade':
      return {
        ...NONE,
        image: `linear-gradient(180deg, ${band('rgba(0,0,0,.45)', '0px', '1px')}, ${band('transparent', '1px', '3px')})`,
        size: '100% 3px',
        sun: plain({
          image: `linear-gradient(180deg, ${st[3]}, ${st[4]})`,
          glow: `0 0 26px 4px ${st[3]}66`,
        }),
      };
    case 'basic':
      return {
        ...NONE,
        sun: plain({
          image: 'radial-gradient(circle, #fffaf0, #fff3dc 70%)',
          glow: '0 0 24px 6px rgba(255,255,255,.4)',
        }),
      };
    case 'expo':
      return {
        ...NONE,
        image: [
          `linear-gradient(173deg, ${band('transparent', '0%', '74%')}, ${band(`${st[3]}cc`, '74.4%', '75%')}, ${band('transparent', '75.4%', '77%')}, ${band(`${st[3]}88`, '77.3%', '77.8%')}, ${band('transparent', '78.2%', '80.5%')}, ${band(`${st[4]}cc`, '80.8%', '81.4%')}, ${band('transparent', '81.8%', '83.5%')}, ${band(`${st[4]}88`, '83.8%', '84.3%')}, transparent 84.7%)`,
          `radial-gradient(80% 30% at 50% 80%, ${st[3]}40, transparent 70%)`,
        ].join(', '),
        rings: { x: 82, y: 8, every: 8, color: 'rgba(255,255,255,.2)' },
        sun: plain({ glow: 'none' }),
      };
    case 'paper': {
      const cols = paperColours(v, st, hour);
      const layers: string[] = [];
      for (let i = 4; i >= 0; i--) {
        const top = 44 + i * 10;
        const c = cols[i] ?? st[2];
        layers.push(
          `radial-gradient(${34 + (i % 2) * 8}% 22% at ${18 + (i % 2) * 30}% ${top + 20}%, ${band(c, '0%', '98%')}, transparent 100%)`,
          `radial-gradient(${40 - (i % 2) * 6}% 24% at ${70 - (i % 2) * 26}% ${top + 22}%, ${band(c, '0%', '98%')}, transparent 100%)`,
          `linear-gradient(180deg, ${band('transparent', '0%', `${top + 14}%`)}, ${c} ${top + 14}%)`,
        );
      }
      return {
        ...NONE,
        image: layers.join(', '),
        sun: plain({
          image: `radial-gradient(circle at 40% 35%, ${mixHex(st[3], '#ffffff', 0.35)}, ${st[3]} 70%)`,
          glow: '0 6px 10px rgba(60,30,10,.25)',
        }),
      };
    }
    case 'lantern': {
      const lc = texts(v, 'lc');
      const pts = [
        [14, 32],
        [34, 37],
        [54, 38],
        [74, 36],
        [92, 30],
      ] as const;
      const at = (q: number) => lc[q % Math.max(1, lc.length)] ?? st[3];
      return {
        ...NONE,
        image: [
          ...pts.map(
            ([x, y], q) =>
              `radial-gradient(4.5% 7% at ${x}% ${y}%, ${band(at(q), '0%', '92%')}, transparent 100%)`,
          ),
          ...pts.map(
            ([x, y], q) =>
              `radial-gradient(13% 17% at ${x}% ${y}%, ${at(q)}66 0%, transparent 70%)`,
          ),
          `radial-gradient(70% 40% at 50% -10%, ${band('transparent', '0%', '98.5%')}, ${band('rgba(255,230,180,.6)', '98.5%', '99.3%')}, transparent 99.6%)`,
        ].join(', '),
        sun: plain({ glow: 'none' }),
      };
    }
    case 'golden':
    default:
      return {
        ...NONE,
        image: `radial-gradient(circle at 25% 88%, ${st[3]}99 0%, ${st[3]}00 45%), radial-gradient(circle at 88% 12%, ${st[4]}77 0%, ${st[4]}00 40%)`,
        sun: plain({
          image: `radial-gradient(circle at 50% 38%, #fff4dc 0%, #ffc46b 48%, ${st[3]} 100%)`,
          glow: `0 0 30px 8px ${st[3]}88`,
        }),
      };
  }
}
