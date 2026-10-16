import { draw, type Frame } from './companion-draw';

/** The companion's face, and what floats around it: sparkles, a thought, a sleepy z. */

const { jitter, paint, oval, INK, GOLD, PI } = draw;
const MOUTH = '#6e2236';

const blinking = (fr: Frame): boolean =>
  (fr.mood === 'calm' || fr.mood === 'think' || fr.mood === 'wave') && fr.el % 4.1 > 3.96;

function arc(x: number, y: number, r: number, from: number, to: number): Path2D {
  const p = new Path2D();
  p.arc(x, y, r, from, to);
  return p;
}

export function drawFace(c: CanvasRenderingContext2D, fr: Frame): void {
  const { s, cx, cy, ry, lw, mood } = fr;
  const blush = 'rgba(255,92,120,0.42)';
  paint(c, oval(cx - s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026), blush);
  paint(c, oval(cx + s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026), blush);
  const ey = cy - ry * 0.2;
  const closed = mood === 'sleepy' || blinking(fr);
  const lx = mood === 'think' ? s * 0.012 : 0;
  const ly = mood === 'think' ? -s * 0.014 : 0;
  [-1, 1].forEach((k, n) => {
    const x = cx + k * s * 0.1 + jitter(fr, 95 + n, 0.002);
    if (mood === 'happy') {
      paint(c, arc(x, ey + s * 0.022, s * 0.038, PI * 1.12, PI * 1.88), INK, lw);
    } else if (closed) {
      paint(c, arc(x, ey - s * 0.012, s * 0.034, PI * 0.15, PI * 0.85), INK, lw);
    } else {
      paint(c, oval(x, ey, s * 0.037, s * 0.047), INK);
      paint(c, oval(x + s * 0.011 + lx, ey - s * 0.015 + ly, s * 0.014, s * 0.014), '#ffffff');
      paint(c, oval(x - s * 0.01 + lx, ey + s * 0.016 + ly, s * 0.006, s * 0.006), '#ffffff');
    }
  });
  const my = cy + ry * 0.1;
  if (mood === 'happy') {
    const m = new Path2D();
    m.moveTo(cx - s * 0.05, my - s * 0.005);
    m.quadraticCurveTo(cx, my + s * 0.085, cx + s * 0.05, my - s * 0.005);
    m.closePath();
    paint(c, m, MOUTH);
    paint(c, m, INK, lw);
    c.save();
    c.clip(m);
    paint(c, oval(cx, my + s * 0.055, s * 0.03, s * 0.02), '#ff7f96');
    c.restore();
  } else if (mood === 'sleepy' || mood === 'think') {
    const x = cx + (mood === 'think' ? s * 0.02 : 0);
    paint(c, oval(x, my + s * 0.012, s * 0.014, s * 0.018), MOUTH);
  } else {
    const m = new Path2D();
    m.moveTo(cx - s * 0.035, my);
    m.quadraticCurveTo(cx, my + s * 0.04, cx + s * 0.035, my);
    paint(c, m, INK, lw);
  }
}

function sparkle(c: CanvasRenderingContext2D, fr: Frame, x: number, y: number, r: number): void {
  const k = r * 0.35;
  const tall = new Path2D();
  tall.moveTo(x, y - r);
  tall.lineTo(x + k, y);
  tall.lineTo(x, y + r);
  tall.lineTo(x - k, y);
  tall.closePath();
  const wide = new Path2D();
  wide.moveTo(x - r, y);
  wide.lineTo(x, y + k);
  wide.lineTo(x + r, y);
  wide.lineTo(x, y - k);
  wide.closePath();
  for (const p of [tall, wide]) {
    paint(c, p, GOLD);
    paint(c, p, INK, fr.lw * 0.6);
  }
}

export function drawExtras(c: CanvasRenderingContext2D, fr: Frame): void {
  const { s, lw, el, mood } = fr;
  if (mood === 'happy') {
    for (const [px, py, ph] of [
      [0.14, 0.2, 0],
      [0.86, 0.28, 1.3],
      [0.8, 0.08, 2.4],
    ] as const) {
      const r = s * 0.045 * Math.max(0, Math.sin(el * 3 + ph));
      if (r >= 0.5) sparkle(c, fr, px * s, py * s, r);
    }
  }
  if (mood === 'sleepy') {
    const ph = (el * 0.5) % 1;
    c.globalAlpha = Math.sin(ph * PI);
    c.fillStyle = '#c9b8ff';
    c.font = `italic ${Math.round(s * 0.2)}px Georgia, serif`;
    c.fillText('z', s * (0.74 + ph * 0.08), s * (0.3 - ph * 0.14));
    c.font = `italic ${Math.round(s * 0.13)}px Georgia, serif`;
    c.fillText('z', s * (0.86 + ph * 0.05), s * (0.16 - ph * 0.1));
    c.globalAlpha = 1;
  }
  if (mood === 'think') {
    (
      [
        [0.78, 0.3, 0.025],
        [0.86, 0.18, 0.04],
      ] as const
    ).forEach(([px, py, r], n) => {
      const bubble = oval(px * s, py * s - Math.sin(el * 2 + n) * s * 0.01, r * s, r * s);
      paint(c, bubble, 'rgba(255,255,255,0.85)');
      paint(c, bubble, INK, lw * 0.6);
    });
  }
}
