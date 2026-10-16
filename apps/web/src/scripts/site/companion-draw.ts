/**
 * The sun companion, drawn on a 2D canvas with the app's numbers (the app draws it with Skia):
 * a little sunset with a face, feet, arms and three rays. Each frame is a pure function of the
 * time since it appeared, so it can be drawn at any moment.
 */

export type Mood = 'calm' | 'happy' | 'wave' | 'think' | 'sleepy';

export interface Frame {
  readonly s: number;
  readonly el: number;
  readonly since: number;
  readonly mood: Mood;
  readonly seed: number;
  readonly tick: number;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly hz: number;
  readonly hop: number;
  readonly tilt: number;
  readonly lw: number;
}

const INK = '#3a1d2a';
const GOLD = '#ffd36e';
const PI = Math.PI;

export function makeFrame(s: number, el: number, since: number, mood: Mood, seed: number): Frame {
  const breathe = mood === 'sleepy' ? Math.sin(el * 1.4) * 0.035 : Math.sin(el * 2.2) * 0.02;
  const hop =
    mood === 'happy' ? -Math.abs(Math.sin(el * 5.2)) * s * (since < 1.2 ? 0.08 : 0.025) : 0;
  const tilt = mood === 'think' ? -0.07 : mood === 'wave' ? Math.sin(el * 2) * 0.03 : 0;
  const rx = s * 0.3;
  const ry = s * 0.28 * (1 + breathe);
  const cy = s * 0.57 + hop - breathe * s * 0.1;
  const lw = Math.max(1.3, s * 0.034);
  return {
    s,
    el,
    since,
    mood,
    seed,
    tick: Math.floor(el * 6),
    cx: s / 2,
    cy,
    rx,
    ry,
    hz: cy + ry * 0.3,
    hop,
    tilt,
    lw,
  };
}

/** A hand-drawn wobble: the same for a point within a sixth of a second. */
function jitter(fr: Frame, i: number, amount: number): number {
  const x = Math.sin(i * 127.1 + fr.tick * 311.7 + fr.seed) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amount * fr.s;
}

function paint(
  c: CanvasRenderingContext2D,
  path: Path2D,
  color: string | CanvasGradient,
  width = 0,
  alpha = 1,
): void {
  c.globalAlpha = alpha;
  if (width) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke(path);
  } else {
    c.fillStyle = color;
    c.fill(path);
  }
  c.globalAlpha = 1;
}

function oval(x: number, y: number, rx: number, ry: number, rot = 0): Path2D {
  const p = new Path2D();
  p.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, PI * 2);
  return p;
}

function line(x0: number, y0: number, x1: number, y1: number): Path2D {
  const p = new Path2D();
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  return p;
}

function bodyPath(fr: Frame): Path2D {
  const { cx, cy, rx, ry } = fr;
  const n = 22;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const sn = Math.sin(a);
    xs.push(cx + Math.cos(a) * rx * (1 + 0.07 * Math.max(0, sn)) + jitter(fr, i, 0.0045));
    ys.push(cy + sn * ry * (sn > 0 ? 0.96 : 1.04) + jitter(fr, i + 40, 0.0045));
  }
  const x = (i: number): number => xs[(i + n) % n] ?? cx;
  const y = (i: number): number => ys[(i + n) % n] ?? cy;
  const p = new Path2D();
  p.moveTo((x(-1) + x(0)) / 2, (y(-1) + y(0)) / 2);
  for (let i = 0; i < n; i++)
    p.quadraticCurveTo(x(i), y(i), (x(i) + x(i + 1)) / 2, (y(i) + y(i + 1)) / 2);
  p.closePath();
  return p;
}

function drawBody(c: CanvasRenderingContext2D, fr: Frame): void {
  const { s, cx, cy, rx, ry, hz, lw, el } = fr;
  const body = bodyPath(fr);
  c.save();
  c.clip(body);
  const sky = c.createLinearGradient(0, cy - ry, 0, hz);
  sky.addColorStop(0, '#ffe2a6');
  sky.addColorStop(0.55, '#ffb070');
  sky.addColorStop(1, '#ff8a5c');
  c.fillStyle = sky;
  c.fillRect(0, 0, s, hz + 1);
  const wave = new Path2D();
  const water = new Path2D();
  for (let i = 0; i <= 24; i++) {
    const x = (i * s) / 24;
    const y = hz + Math.sin((x / s) * 14 + el * 2.4) * s * 0.008;
    if (i === 0) wave.moveTo(x, y);
    else wave.lineTo(x, y);
    if (i === 0) water.moveTo(x, y);
    else water.lineTo(x, y);
  }
  water.lineTo(s, s);
  water.lineTo(0, s);
  water.closePath();
  const sea = c.createLinearGradient(0, hz, 0, cy + ry);
  sea.addColorStop(0, '#e8607a');
  sea.addColorStop(1, '#a8406c');
  paint(c, water, sea);
  paint(c, wave, 'rgba(90,20,50,0.45)', lw * 0.6);
  const depth = cy + ry - hz;
  const glint = 'rgba(255,225,200,0.75)';
  [
    [0.12, 0.55, 0.07],
    [-0.14, 0.72, 0.05],
    [0.05, 0.86, 0.04],
  ].forEach(([ox = 0, oy = 0, w = 0], n) => {
    const gx = cx + ox * s + Math.sin(el * 1.6 + n) * s * 0.01;
    const gy = hz + depth * oy - s * 0.02;
    paint(c, line(gx - (w * s) / 2, gy, gx + (w * s) / 2, gy), glint, lw * 0.55);
  });
  const shine = 'rgba(255,255,255,0.55)';
  paint(c, oval(cx - rx * 0.48, cy - ry * 0.58, s * 0.05, s * 0.025, -0.6), shine);
  paint(c, oval(cx - rx * 0.22, cy - ry * 0.78, s * 0.011, s * 0.011), shine);
  c.restore();
  paint(c, body, INK, lw);
}

function drawRays(c: CanvasRenderingContext2D, fr: Frame): void {
  const { cx, cy, rx, ry, lw, el, mood } = fr;
  const pulse = mood === 'happy' ? 1.25 + Math.sin(el * 8) * 0.12 : mood === 'sleepy' ? 0.7 : 1;
  [-0.62, 0, 0.62].forEach((ray, n) => {
    const a = -PI / 2 + ray + Math.sin(el * 1.8 + n) * 0.05;
    const r1 = 1.12 + (n === 1 ? 0.38 : 0.28) * pulse;
    const co = Math.cos(a);
    const si = Math.sin(a);
    const from = [cx + co * rx * 1.12 + jitter(fr, 70 + n, 0.004), cy + si * ry * 1.12] as const;
    const to = [
      cx + co * rx * r1 + jitter(fr, 75 + n, 0.006),
      cy + si * ry * r1 + jitter(fr, 78 + n, 0.006),
    ] as const;
    paint(c, line(from[0], from[1], to[0], to[1]), INK, lw * 1.05);
  });
}

function drawArm(
  c: CanvasRenderingContext2D,
  fr: Frame,
  side: number,
  up: boolean,
  wave = false,
): void {
  const { s, cx, cy, rx, ry, lw } = fr;
  const rot = wave ? side * (-1.1 + Math.sin(fr.el * 9) * 0.45) : side * (up ? -0.9 : 0.35);
  c.save();
  c.translate(cx + side * rx * (up ? 0.92 : 1.02), up ? cy - ry * 0.32 : cy + ry * 0.18);
  c.rotate(rot);
  const arm = oval(0, up ? -s * 0.03 : 0, s * 0.045, s * 0.07);
  paint(c, arm, '#ffb27c');
  paint(c, arm, INK, lw * 0.85);
  c.restore();
}

function drawFeet(c: CanvasRenderingContext2D, fr: Frame): void {
  const { s, cx, cy, ry, lw } = fr;
  [-1, 1].forEach((k, n) => {
    const foot = oval(
      cx + k * s * 0.11 + jitter(fr, 90 + n, 0.003),
      cy + ry * 0.98,
      s * 0.062,
      s * 0.034,
    );
    paint(c, foot, '#9b3f5f');
    paint(c, foot, INK, lw * 0.85);
  });
}

export const draw = { jitter, paint, oval, line, INK, GOLD, PI };

/** The shadow on the ground, which stays put while the body tilts. */
export function drawShadow(c: CanvasRenderingContext2D, fr: Frame): void {
  const { s, cx, rx, hop } = fr;
  paint(c, oval(cx, s * 0.92, rx * (0.85 + hop / s), s * 0.03), 'rgba(30,10,30,0.16)');
}

/** Everything below the face: feet, rays, arms and the sunset body. */
export function drawFigure(c: CanvasRenderingContext2D, fr: Frame): void {
  const { mood } = fr;
  drawFeet(c, fr);
  drawRays(c, fr);
  if (mood !== 'happy' && mood !== 'wave') {
    drawArm(c, fr, -1, false);
    drawArm(c, fr, 1, false);
  }
  drawBody(c, fr);
  if (mood === 'happy') {
    drawArm(c, fr, -1, true);
    drawArm(c, fr, 1, true);
  } else if (mood === 'wave') {
    drawArm(c, fr, -1, false);
    drawArm(c, fr, 1, true, true);
  }
}
