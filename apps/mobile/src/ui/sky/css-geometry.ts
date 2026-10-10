import type { RadialGradientValue } from './css-values';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * The start and end of a CSS `linear-gradient(<angle>)` over a w×h box: the gradient line runs
 * through the centre at the angle (0° up, clockwise), long enough that its ends touch the corners.
 */
export function linearGradientLine(angleDeg: number, w: number, h: number) {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return {
    start: { x: w / 2 - dx * half, y: h / 2 - dy * half },
    end: { x: w / 2 + dx * half, y: h / 2 + dy * half },
  };
}

export interface Ellipse {
  readonly c: Point;
  readonly rx: number;
  readonly ry: number;
}

/**
 * The ending shape of a CSS radial gradient over a w×h box (its 100% stop). A bare `circle`
 * reaches the farthest corner; explicit sizes are fractions of the box's width and height.
 */
export function radialGradientShape(g: RadialGradientValue, w: number, h: number): Ellipse {
  const c = { x: g.at[0] * w, y: g.at[1] * h };
  if (g.size === 'circle') {
    const r = Math.hypot(Math.max(c.x, w - c.x), Math.max(c.y, h - c.y));
    return { c, rx: r, ry: r };
  }
  return { c, rx: g.size.rx * w, ry: g.size.ry * h };
}
