import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { crc32, deflateSync } from 'node:zlib';

import type { CompanionForm } from '../../apps/mobile/src/ui/companion/companion-mood';
import { oklchToLinearSrgb } from '../../packages/theme/src/oklch';
import type * as IconArt from './app-icon-art';
import type { Placement } from './app-icon-art';
import { importWithSkia, loadSkia, repoRoot } from './skia-node';

/**
 * Renders the companions' alternate app icons from the app's own drawing code: for each, a
 * light, a dark and a tinted 1024² PNG, opaque RGB with square corners, into
 * `apps/mobile/assets/icon/<id>/`. Grounds are worked out per pixel in oklch and dithered, so
 * they never band. The sun keeps the app's own icon.
 *
 *   tsx tools/scripts/render-app-icons.ts [out-dir]
 */

const EDGE = 1024;
type Variant = 'light' | 'dark' | 'tinted';
type Oklch = readonly [number, number, number];

interface IconDesign {
  readonly at: Placement;
  /** The light ground, top to bottom. */
  readonly sky: readonly Oklch[];
  /** A soft glow behind the body, and the hue of the dark ground. */
  readonly glow: Oklch;
}

const ICONS: Readonly<Record<Exclude<CompanionForm, 'sun'>, IconDesign>> = {
  max: {
    at: { size: 1060, centreY: 560 },
    sky: [
      [0.2, 0.07, 280],
      [0.33, 0.13, 300],
      [0.48, 0.16, 335],
    ],
    glow: [0.62, 0.15, 330],
  },
  nhang: {
    at: { size: 1160, centreY: 640 },
    sky: [
      [0.24, 0.05, 25],
      [0.36, 0.09, 35],
      [0.55, 0.13, 55],
    ],
    glow: [0.72, 0.13, 65],
  },
  banhbao: {
    at: { size: 1180, centreY: 610 },
    sky: [
      [0.3, 0.06, 185],
      [0.42, 0.08, 170],
      [0.55, 0.09, 150],
    ],
    glow: [0.75, 0.08, 130],
  },
  giot: {
    at: { size: 1240, centreY: 610 },
    sky: [
      [0.24, 0.07, 262],
      [0.36, 0.1, 250],
      [0.52, 0.11, 225],
    ],
    glow: [0.72, 0.1, 220],
  },
  hac: {
    at: { size: 980, centreY: 600 },
    sky: [
      [0.9, 0.07, 92],
      [0.82, 0.11, 78],
      [0.7, 0.14, 62],
    ],
    glow: [0.97, 0.05, 95],
  },
};

function encode(channel: number): number {
  const c = Math.min(1, Math.max(0, channel));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** Interpolates oklch stops along the short hue arc, `t` from 0 to 1. */
function mix(stops: readonly Oklch[], t: number): Oklch {
  const span = (stops.length - 1) * Math.min(1, Math.max(0, t));
  const i = Math.min(stops.length - 2, Math.floor(span));
  const f = span - i;
  // Smoothstep inside each segment: no Mach band where two segments meet.
  const k = f * f * (3 - 2 * f);
  const [l0, c0, h0] = stops[i] ?? [0, 0, 0];
  const [l1, c1, h1] = stops[i + 1] ?? [0, 0, 0];
  let dh = h1 - h0;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return [l0 + (l1 - l0) * k, c0 + (c1 - c0) * k, h0 + dh * k];
}

/** The ground of one icon, as linear-light-free sRGB floats (0–1), per pixel. */
function ground(design: IconDesign, variant: Variant): Float32Array {
  const out = new Float32Array(EDGE * EDGE * 3);
  const [gl, gc, gh] = design.glow;
  const cx = EDGE / 2;
  const cy = design.at.centreY;
  for (let y = 0; y < EDGE; y++) {
    for (let x = 0; x < EDGE; x++) {
      let lch: Oklch;
      const r = Math.hypot(x - cx, y - cy) / (EDGE * 0.62);
      const glow = Math.max(0, 1 - r) ** 2;
      if (variant === 'tinted') lch = [0, 0, 0];
      else if (variant === 'dark') {
        // A near-black ground with a faint warm of the companion's own hue behind it.
        lch = [0.15 + 0.1 * glow, 0.012 + 0.04 * glow, gh];
      } else {
        const sky = mix(design.sky, y / (EDGE - 1));
        const w = glow * 0.35;
        lch = [sky[0] + (gl - sky[0]) * w, sky[1] + (gc - sky[1]) * w, sky[2]];
      }
      const rgb = oklchToLinearSrgb(lch[0], lch[1], lch[2]);
      const at = (y * EDGE + x) * 3;
      out[at] = encode(rgb[0]);
      out[at + 1] = encode(rgb[1]);
      out[at + 2] = encode(rgb[2]);
    }
  }
  return out;
}

/** Lays the companion over the ground, greys it for the tinted icon, dithers and quantises. */
function compose(base: Float32Array, art: Uint8Array, variant: Variant): Uint8Array {
  const out = new Uint8Array(EDGE * EDGE * 3);
  for (let p = 0; p < EDGE * EDGE; p++) {
    const a = (art[p * 4 + 3] ?? 0) / 255;
    let rgb = [0, 1, 2].map(
      (c) => (base[p * 3 + c] ?? 0) * (1 - a) + ((art[p * 4 + c] ?? 0) / 255) * a,
    );
    if (variant === 'tinted') {
      const luma = 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
      const grey = Math.min(1, luma * 1.25);
      rgb = [grey, grey, grey];
    }
    const noise = (Math.random() - Math.random()) / 255;
    for (let c = 0; c < 3; c++) {
      out[p * 3 + c] = Math.round(Math.min(1, Math.max(0, (rgb[c] ?? 0) + noise)) * 255);
    }
  }
  return out;
}

/** An opaque 8-bit RGB PNG: no alpha channel at all. */
function png(rgb: Uint8Array): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(EDGE, 0);
  header.writeUInt32BE(EDGE, 4);
  header.writeUInt8(8, 8);
  header.writeUInt8(2, 9);
  const rows = Buffer.alloc(EDGE * (EDGE * 3 + 1));
  for (let y = 0; y < EDGE; y++) {
    rows[y * (EDGE * 3 + 1)] = 0;
    Buffer.from(rgb.buffer, y * EDGE * 3, EDGE * 3).copy(rows, y * (EDGE * 3 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = process.argv[2] ?? path.join(repoRoot, 'apps/mobile/assets/icon');
await loadSkia();
const art = await importWithSkia<typeof IconArt>(
  path.join(path.dirname(new URL(import.meta.url).pathname), 'app-icon-art.ts'),
);
for (const [form, design] of Object.entries(ICONS) as [
  Exclude<CompanionForm, 'sun'>,
  IconDesign,
][]) {
  const pixels = art.companionPixels(form, EDGE, design.at);
  mkdirSync(path.join(outDir, form), { recursive: true });
  for (const variant of ['light', 'dark', 'tinted'] as const) {
    const file = path.join(outDir, form, `${variant}.png`);
    writeFileSync(file, png(compose(ground(design, variant), pixels, variant)));
    console.log(path.relative(repoRoot, file));
  }
}
