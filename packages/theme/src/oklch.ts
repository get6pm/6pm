/**
 * oklch() → device colour. The prototype writes category tiles as `oklch(L C h)`; browsers on a
 * Mac or iPhone render those in Display P3 when they fall outside sRGB. To match on device, a colour
 * inside sRGB becomes plain hex and one outside becomes `color(display-p3 r g b)`, the wide-gamut
 * form React Native draws on iOS. Maths: CSS Color 4 (OKLab → linear sRGB / linear P3 → gamma).
 */

type Rgb = readonly [number, number, number];

function oklabToLinearSrgb(l: number, a: number, b: number): Rgb {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

/** Linear sRGB → linear Display P3 (both D65). */
function linearSrgbToLinearP3([r, g, b]: Rgb): Rgb {
  return [
    0.8224621209 * r + 0.177537879 * g + 0 * b,
    0.0331941989 * r + 0.9668058011 * g + 0 * b,
    0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b,
  ];
}

/** The sRGB transfer curve, shared by Display P3. */
function encode(channel: number): number {
  const abs = Math.abs(channel);
  const v = abs <= 0.0031308 ? 12.92 * abs : 1.055 * abs ** (1 / 2.4) - 0.055;
  return Math.sign(channel) * v;
}

const EPSILON = 1e-4;
const inGamut = (rgb: Rgb) => rgb.every((c) => c >= -EPSILON && c <= 1 + EPSILON);
const clamp01 = (c: number) => Math.min(1, Math.max(0, c));

function toHex(rgb: Rgb): string {
  return (
    '#' +
    rgb
      .map((c) =>
        Math.round(clamp01(c) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

export function oklchToLinearSrgb(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  return oklabToLinearSrgb(l, c * Math.cos(h), c * Math.sin(h));
}

/** The device colour for `oklch(l c h)`: sRGB hex when it fits, Display P3 when it does not. */
export function oklch(l: number, c: number, hDeg: number): string {
  const linear = oklchToLinearSrgb(l, c, hDeg);
  const srgb = linear.map(encode) as unknown as Rgb;
  if (inGamut(srgb)) return toHex(srgb);
  const p3 = linearSrgbToLinearP3(linear).map(encode) as unknown as Rgb;
  const [r, g, b] = p3.map((v) => clamp01(v).toFixed(4));
  return `color(display-p3 ${r} ${g} ${b})`;
}

/** The nearest sRGB hex for `oklch(l c h)`, clipped: for places that cannot take wide colour. */
export function oklchSrgbHex(l: number, c: number, hDeg: number): string {
  return toHex(oklchToLinearSrgb(l, c, hDeg).map(encode) as unknown as Rgb);
}

/**
 * Category tile: 155° gradient between two tints of the hue, and the glyph colour on top. sRGB
 * for now: React Native's colour parser does not read `color(display-p3 …)` strings yet, so the
 * tiles match the browser's sRGB rendering of the prototype exactly.
 */
export function categoryTile(hue: number): { from: string; to: string; glyph: string } {
  return {
    from: oklchSrgbHex(0.9, 0.07, hue),
    to: oklchSrgbHex(0.78, 0.12, hue),
    glyph: oklchSrgbHex(0.34, 0.09, hue),
  };
}
