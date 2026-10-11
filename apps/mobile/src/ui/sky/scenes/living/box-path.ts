/** One corner's elliptical radii, in points. */
export interface Corner {
  readonly x: number;
  readonly y: number;
}

/** A CSS box's four corners, top-left first and clockwise. */
export interface Corners {
  readonly tl: Corner;
  readonly tr: Corner;
  readonly br: Corner;
  readonly bl: Corner;
}

export const SQUARE: Corners = {
  tl: { x: 0, y: 0 },
  tr: { x: 0, y: 0 },
  br: { x: 0, y: 0 },
  bl: { x: 0, y: 0 },
};

/** Bézier handle length for a quarter ellipse. */
const KAPPA = 0.5522847498307936;

function radiusList(token: string, basis: number): number[] {
  const values = token
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const n = parseFloat(t);
      if (Number.isNaN(n)) return 0;
      return t.endsWith('%') ? (n / 100) * basis : n;
    });
  const [a = 0, b = a, c = a, d = b] = values;
  // CSS shorthand: one value is all four, two are (tl/br, tr/bl), three add br, four are in order.
  return values.length === 3 ? [a, b, c, b] : [a, b, c, d];
}

/**
 * A CSS `border-radius` on a w×h box: up to four horizontal radii, optionally `/` four vertical
 * ones (percentages are of the box's width and height). Radii that would overlap are scaled down
 * together, as CSS does.
 */
export function parseBorderRadius(css: string, w: number, h: number): Corners {
  const [horizontal = '0', vertical = horizontal] = css.split('/');
  const [hx0 = 0, hx1 = 0, hx2 = 0, hx3 = 0] = radiusList(horizontal, w);
  const [vy0 = 0, vy1 = 0, vy2 = 0, vy3 = 0] = radiusList(vertical, h);
  const limit = (side: number, sum: number) => (sum > 0 ? side / sum : Infinity);
  const f = Math.min(
    1,
    limit(w, hx0 + hx1),
    limit(w, hx3 + hx2),
    limit(h, vy0 + vy3),
    limit(h, vy1 + vy2),
  );
  return {
    tl: { x: hx0 * f, y: vy0 * f },
    tr: { x: hx1 * f, y: vy1 * f },
    br: { x: hx2 * f, y: vy2 * f },
    bl: { x: hx3 * f, y: vy3 * f },
  };
}

const n = (v: number) => Number(v.toFixed(3));

/** An SVG path for a rounded box, each corner its own quarter ellipse. */
export function boxPath(l: number, t: number, w: number, h: number, c: Corners = SQUARE): string {
  const r = l + w;
  const b = t + h;
  const k = KAPPA;
  const d: string[] = [`M${n(l + c.tl.x)} ${n(t)}`, `L${n(r - c.tr.x)} ${n(t)}`];
  if (c.tr.x > 0 || c.tr.y > 0) {
    d.push(
      `C${n(r - c.tr.x + k * c.tr.x)} ${n(t)} ${n(r)} ${n(t + c.tr.y - k * c.tr.y)} ${n(r)} ${n(t + c.tr.y)}`,
    );
  }
  d.push(`L${n(r)} ${n(b - c.br.y)}`);
  if (c.br.x > 0 || c.br.y > 0) {
    d.push(
      `C${n(r)} ${n(b - c.br.y + k * c.br.y)} ${n(r - c.br.x + k * c.br.x)} ${n(b)} ${n(r - c.br.x)} ${n(b)}`,
    );
  }
  d.push(`L${n(l + c.bl.x)} ${n(b)}`);
  if (c.bl.x > 0 || c.bl.y > 0) {
    d.push(
      `C${n(l + c.bl.x - k * c.bl.x)} ${n(b)} ${n(l)} ${n(b - c.bl.y + k * c.bl.y)} ${n(l)} ${n(b - c.bl.y)}`,
    );
  }
  d.push(`L${n(l)} ${n(t + c.tl.y)}`);
  if (c.tl.x > 0 || c.tl.y > 0) {
    d.push(
      `C${n(l)} ${n(t + c.tl.y - k * c.tl.y)} ${n(l + c.tl.x - k * c.tl.x)} ${n(t)} ${n(l + c.tl.x)} ${n(t)}`,
    );
  }
  d.push('Z');
  return d.join('');
}
