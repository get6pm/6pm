import { BUDDY_INK as INK, TAU, drawExtras, drawFace, type BuddyFrame } from './dusk-buddy-face';

export type { BuddyFrame, BuddyMood } from './dusk-buddy-face';

/**
 * A little sun dipping into the evening sea, drawn as the design's `<dusk-buddy>` draws it: a
 * hand-drawn outline that boils six times a second, breathing, and a face per mood.
 */
export function drawBuddy(ctx: CanvasRenderingContext2D, frame: BuddyFrame): void {
  const { size: s, mood, seed, elapsed: el, sinceMood: since } = frame;
  const boil = Math.floor(el * 6);
  const rnd = (i: number): number => {
    const x = Math.sin(i * 127.1 + boil * 311.7 + seed) * 43758.5453;
    return x - Math.floor(x);
  };
  const j = (i: number, a: number): number => (rnd(i) - 0.5) * 2 * a * s;
  const lw = Math.max(1.3, s * 0.034);
  ctx.clearRect(0, 0, s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const breathe = mood === 'sleepy' ? Math.sin(el * 1.4) * 0.035 : Math.sin(el * 2.2) * 0.02;
  let hop = 0;
  let tilt = 0;
  if (mood === 'happy') hop = -Math.abs(Math.sin(el * 5.2)) * s * (since < 1.2 ? 0.08 : 0.025);
  if (mood === 'nod') tilt = Math.sin(el * 2.6) * 0.08;
  if (mood === 'wave') tilt = Math.sin(el * 2) * 0.03;

  const cx = s / 2;
  const rx = s * 0.3;
  const ry = s * 0.28 * (1 + breathe);
  const cy = s * 0.57 + hop - breathe * s * 0.1;
  const hz = cy + ry * 0.3;

  // Ground shadow.
  ctx.fillStyle = 'rgba(30,10,30,.16)';
  ctx.beginPath();
  ctx.ellipse(cx, s * 0.92, rx * (0.85 + hop / s), s * 0.03, 0, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy + ry);
  ctx.rotate(tilt);
  ctx.translate(-cx, -(cy + ry));

  const outline = (width: number): void => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  // Feet.
  [-1, 1].forEach((k, n) => {
    ctx.beginPath();
    ctx.ellipse(
      cx + k * s * 0.11 + j(90 + n, 0.003),
      cy + ry * 0.98,
      s * 0.062,
      s * 0.034,
      0,
      0,
      TAU,
    );
    ctx.fillStyle = '#9b3f5f';
    ctx.fill();
    outline(lw * 0.85);
  });

  // Rays.
  const pulse = mood === 'happy' ? 1.25 + Math.sin(el * 8) * 0.12 : mood === 'sleepy' ? 0.7 : 1;
  [-0.62, 0, 0.62].forEach((da, n) => {
    const a = -Math.PI / 2 + da + Math.sin(el * 1.8 + n) * 0.05;
    const r0 = 1.12;
    const r1 = 1.12 + (n === 1 ? 0.38 : 0.28) * pulse;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * rx * r0 + j(70 + n, 0.004), cy + Math.sin(a) * ry * r0);
    ctx.lineTo(
      cx + Math.cos(a) * rx * r1 + j(75 + n, 0.006),
      cy + Math.sin(a) * ry * r1 + j(78 + n, 0.006),
    );
    outline(lw * 1.05);
  });

  // Body.
  const N = 22;
  const pts: (readonly [number, number])[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const sn = Math.sin(a);
    pts.push([
      cx + Math.cos(a) * rx * (1 + 0.07 * Math.max(0, sn)) + j(i, 0.0045),
      cy + sn * ry * (sn > 0 ? 0.96 : 1.04) + j(i + 40, 0.0045),
    ]);
  }
  const point = (i: number): readonly [number, number] => pts[i % N] ?? [cx, cy];
  const body = (): void => {
    ctx.beginPath();
    const mid = (p: readonly number[], q: readonly number[]): [number, number] => [
      ((p[0] ?? 0) + (q[0] ?? 0)) / 2,
      ((p[1] ?? 0) + (q[1] ?? 0)) / 2,
    ];
    const start = mid(point(N - 1), point(0));
    ctx.moveTo(start[0], start[1]);
    for (let i = 0; i < N; i++) {
      const p = point(i);
      const m = mid(p, point(i + 1));
      ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    ctx.closePath();
  };

  const arm = (side: number, up: boolean, waving = false): void => {
    const ax = cx + side * rx * (up ? 0.92 : 1.02);
    const ay = up ? cy - ry * 0.32 : cy + ry * 0.18;
    const rot = waving ? side * (-1.1 + Math.sin(el * 9) * 0.45) : side * (up ? -0.9 : 0.35);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, up ? -s * 0.03 : 0, s * 0.045, s * 0.07, 0, 0, TAU);
    ctx.fillStyle = '#ffb27c';
    ctx.fill();
    outline(lw * 0.85);
    ctx.restore();
  };
  const armsUp = mood === 'happy';
  const waving = mood === 'wave';
  if (!armsUp && !waving) {
    arm(-1, false);
    arm(1, false);
  }

  // Fill: sun on top, sea below with a gentle wave.
  body();
  ctx.save();
  ctx.clip();
  const sun = ctx.createLinearGradient(0, cy - ry, 0, hz);
  sun.addColorStop(0, '#ffe2a6');
  sun.addColorStop(0.55, '#ffb070');
  sun.addColorStop(1, '#ff8a5c');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, s, s);
  const waveY = (x: number): number => hz + Math.sin((x / s) * 14 + el * 2.4) * s * 0.008;
  ctx.beginPath();
  ctx.moveTo(0, hz);
  for (let x = 0; x <= s; x += s / 24) ctx.lineTo(x, waveY(x));
  ctx.lineTo(s, s);
  ctx.lineTo(0, s);
  ctx.closePath();
  const sea = ctx.createLinearGradient(0, hz, 0, cy + ry);
  sea.addColorStop(0, '#e8607a');
  sea.addColorStop(1, '#a8406c');
  ctx.fillStyle = sea;
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,20,50,.45)';
  ctx.lineWidth = lw * 0.6;
  ctx.beginPath();
  for (let x = 0; x <= s; x += s / 24) {
    if (x === 0) ctx.moveTo(x, waveY(x));
    else ctx.lineTo(x, waveY(x));
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,200,.75)';
  ctx.lineWidth = lw * 0.55;
  [
    [0.12, 0.55, 0.07],
    [-0.14, 0.72, 0.05],
    [0.05, 0.86, 0.04],
  ].forEach(([ox = 0, oy = 0, w = 0], n) => {
    const gx = cx + ox * s + Math.sin(el * 1.6 + n) * s * 0.01;
    const gy = hz + (cy + ry - hz) * oy - s * 0.02;
    ctx.beginPath();
    ctx.moveTo(gx - (w * s) / 2, gy);
    ctx.lineTo(gx + (w * s) / 2, gy);
    ctx.stroke();
  });
  // Specular.
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.48, cy - ry * 0.58, s * 0.05, s * 0.025, -0.6, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - rx * 0.22, cy - ry * 0.78, s * 0.011, 0, TAU);
  ctx.fill();
  ctx.restore();
  body();
  outline(lw);

  if (armsUp) {
    arm(-1, true);
    arm(1, true);
  }
  if (waving) {
    arm(-1, false);
    arm(1, true, true);
  }

  drawFace(ctx, frame, { cx, cy, ry, lw, j });
  ctx.restore();
  drawExtras(ctx, frame, lw);
}
