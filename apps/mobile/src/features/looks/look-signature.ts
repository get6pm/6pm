import { lookById, mixHex, type LookId, type Palette } from '@6pm/theme';

import {
  band,
  leafSun,
  NONE,
  paperColours,
  plain,
  text,
  texts,
  type LookSignature,
  type Variant,
} from './look-signature-parts';

export type { Conic, Hatch, LookSignature, Rings, SigSun } from './look-signature-parts';

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
  const flip = typeof v.dark === 'number' ? v.dark : def.dark;
  const dark = hour >= flip;
  switch (look) {
    case 'lacquer': {
      const metal = text(v, 'metal', st[3]);
      const flecks = [
        [16, 44, 1.6],
        [30, 40, 2.4],
        [62, 38, 1.4],
        [84, 42, 2],
        [46, 30, 1.2],
      ] as const;
      return {
        ...NONE,
        image: [
          `linear-gradient(177deg, ${band('transparent', '0%', '51%')}, ${band(`${metal}ee`, '51%', '52.6%')}, transparent 52.6%)`,
          ...flecks.map(
            ([x, y, r]) =>
              `radial-gradient(circle at ${x}% ${y}%, ${band(metal, '0px', `${r}px`)}, transparent ${r + 0.6}px)`,
          ),
          `radial-gradient(circle at 20% 80%, ${st[3]}66 0px, ${st[3]}00 70px)`,
          `radial-gradient(circle at 80% 70%, ${st[4]}55 0px, ${st[4]}00 60px)`,
        ].join(', '),
        sun: leafSun(metal, 7, `0 0 20px 4px ${metal}44`),
      };
    }
    case 'glaze': {
      const cob = text(v, 'cob', st[3]);
      const c = dark ? '#eef2fa' : cob;
      const rim = [
        band('transparent', '0%', '56%'),
        band(c, '56%', '57.2%'),
        band('transparent', '57.2%', '59%'),
        band(`${c}cc`, '59%', '59.7%'),
        band('transparent', '59.7%', '64%'),
        band(`${c}cc`, '64%', '64.7%'),
        band('transparent', '64.7%', '66.4%'),
        band(c, '66.4%', '67.6%'),
        'transparent 67.6%',
      ].join(', ');
      const sun = dark
        ? `radial-gradient(closest-side, ${band(cob, '0%', '28%')}, ${band('#f7f8fb', '31%', '57%')}, ${band(cob, '60%', '67%')}, ${band('#f7f8fb', '70%', '100%')})`
        : `radial-gradient(closest-side, ${band(c, '0%', '49%')}, ${band(`${c}00`, '53%', '63%')}, ${band(c, '66%', '72%')}, ${c}00 75%)`;
      return {
        ...NONE,
        image: [
          `linear-gradient(180deg, ${rim})`,
          `radial-gradient(60% 40% at 18% 8%, rgba(255,255,255,${dark ? 0.12 : 0.6}), transparent 70%)`,
        ].join(', '),
        sun: plain({ image: sun, glow: 'none' }),
      };
    }
    case 'riso': {
      const i1 = text(v, 'i1', st[3]);
      const i2 = text(v, 'i2', st[4]);
      return {
        ...NONE,
        image: `radial-gradient(${i2} 1px, transparent 1.6px), radial-gradient(circle at 18% 112%, ${band(`${i1}99`, '0%', '42%')}, transparent 42.5%)`,
        size: '6px 6px, auto',
        sun: plain({ color: i1, glow: `6px -4px 0 ${i2}b0` }),
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
          'linear-gradient(180deg, transparent 45%, rgba(255,255,255,.22) 68%, transparent 90%)',
        ].join(', '),
        hatch: { angle: 98, every: 14, color: 'rgba(255,255,255,.12)' },
        sun: plain({
          image: 'radial-gradient(circle, rgba(255,250,240,.95), rgba(255,250,240,0) 70%)',
          glow: '0 0 30px 14px rgba(255,255,255,.2)',
        }),
      };
    }
    case 'cafe': {
      const coffee = text(v, 'coffee', st[3]);
      const milk = text(v, 'milk', st[4]);
      const cof = dark ? '#1a0d07' : coffee;
      const mk = dark ? '#3a2214' : milk;
      return {
        ...NONE,
        image: `radial-gradient(circle at 20% 42%, ${band('transparent', '0px', '17px')}, ${band(`${mixHex(coffee, milk, 0.35)}30`, '17px', '19px')}, transparent 19.5px)`,
        sun: plain({
          image: `radial-gradient(closest-side, ${band('transparent', '0%', '84%')}, ${band('rgba(255,255,255,.55)', '88%', '94%')}, transparent 97%)`,
          conic: {
            from: 20,
            x: 50,
            y: 50,
            colors: [cof, mk, cof, mk, cof, mk, cof],
            positions: [0, 0.18, 0.36, 0.58, 0.76, 0.9, 1],
          },
          glow: '0 6px 12px rgba(50,25,10,.3)',
        }),
      };
    }
    case 'neon': {
      const t1 = text(v, 't1', st[3]);
      const t2 = text(v, 't2', st[4]);
      const tube = dark ? '#ffffff' : 'rgba(255,255,255,.8)';
      return {
        ...NONE,
        image: [
          `linear-gradient(180deg, ${band('transparent', '0%', '40%')}, ${band(tube, '40%', '42%')}, transparent 42%)`,
          ...(dark
            ? [
                `radial-gradient(70% 24% at 40% 41%, ${t1}66, transparent 70%)`,
                `radial-gradient(40% 40% at 70% 22%, ${t2}40, transparent 70%)`,
              ]
            : []),
        ].join(', '),
        sun: plain({
          image: `radial-gradient(closest-side, ${band('transparent', '0%', '74%')}, ${band(dark ? '#ffffff' : 'rgba(255,255,255,.85)', '78%', '90%')}, transparent 94%)`,
          glow: dark
            ? `0 0 8px 1px ${t2}, inset 0 0 8px 1px ${t2}`
            : '0 3px 3px -1px rgba(0,0,0,.2)',
        }),
      };
    }
    case 'basic':
      return { ...NONE, sun: plain({ color: dark ? '#ffffff' : '#000000', glow: 'none' }) };
    case 'expo':
      return {
        ...NONE,
        image: [
          `linear-gradient(175deg, ${band('transparent', '0%', '62%')}, ${band('#fff4e0cc', '62.3%', '62.8%')}, ${band('transparent', '63.1%', '64.2%')}, ${band(`${st[3]}cc`, '64.4%', '64.9%')}, ${band('transparent', '65.2%', '67%')}, ${band(`${st[4]}cc`, '67.2%', '67.8%')}, ${band('transparent', '68.1%', '69.2%')}, ${band(`${st[4]}99`, '69.4%', '69.8%')}, transparent 70.1%)`,
          `radial-gradient(80% 30% at 50% 70%, ${st[3]}33, transparent 70%)`,
        ].join(', '),
        rings: { x: 82, y: 10, every: 7, color: 'rgba(255,255,255,.2)' },
        sun: plain({ glow: 'none' }),
      };
    case 'paper': {
      const cols = paperColours(v, st, hour);
      const layers: string[] = [];
      for (let i = cols.length - 1; i >= 0; i--) {
        const top = 50 + i * 10;
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
