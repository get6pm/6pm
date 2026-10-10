/** The companion's moods on this page. */
export type BuddyMood = 'calm' | 'happy' | 'wave' | 'nod' | 'sleepy';

export interface BuddyFrame {
  readonly size: number;
  readonly mood: BuddyMood;
  readonly seed: number;
  /** Seconds since the buddy appeared. */
  readonly elapsed: number;
  /** Seconds since its mood last changed. */
  readonly sinceMood: number;
}

export const BUDDY_INK = '#3a1d2a';
const INK = BUDDY_INK;
export const TAU = Math.PI * 2;

/** Where the body landed this frame, for the face drawn on it. */
export interface Body {
  readonly cx: number;
  readonly cy: number;
  readonly ry: number;
  readonly lw: number;
  readonly j: (i: number, a: number) => number;
}

/** Cheeks, eyes and mouth, by mood. */
export function drawFace(ctx: CanvasRenderingContext2D, frame: BuddyFrame, body: Body): void {
  const { size: s, mood, elapsed: el } = frame;
  const { cx, cy, ry, lw, j } = body;

  ctx.fillStyle = 'rgba(255,92,120,.42)';
  [-1, 1].forEach((k) => {
    ctx.beginPath();
    ctx.ellipse(cx + k * s * 0.175, cy + ry * 0.12, s * 0.045, s * 0.026, 0, 0, TAU);
    ctx.fill();
  });

  const ey = cy - ry * 0.2;
  const blink = (mood === 'calm' || mood === 'wave') && el % 4.1 > 3.96;
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = lw;
  [-1, 1].forEach((k, n) => {
    const x = cx + k * s * 0.1 + j(95 + n, 0.002);
    ctx.beginPath();
    if (mood === 'happy') {
      ctx.arc(x, ey + s * 0.022, s * 0.038, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    } else if (mood === 'nod' || mood === 'sleepy' || blink) {
      ctx.arc(x, ey - s * 0.012, s * 0.034, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      ctx.ellipse(x, ey, s * 0.037, s * 0.047, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s * 0.011, ey - s * 0.015, s * 0.014, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - s * 0.01, ey + s * 0.016, s * 0.006, 0, TAU);
      ctx.fill();
      ctx.fillStyle = INK;
    }
  });

  const my = cy + ry * 0.1;
  ctx.beginPath();
  ctx.lineWidth = lw;
  if (mood === 'happy') {
    ctx.moveTo(cx - s * 0.05, my - s * 0.005);
    ctx.quadraticCurveTo(cx, my + s * 0.085, cx + s * 0.05, my - s * 0.005);
    ctx.closePath();
    ctx.fillStyle = '#6e2236';
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#ff7f96';
    ctx.beginPath();
    ctx.ellipse(cx, my + s * 0.055, s * 0.03, s * 0.02, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  } else if (mood === 'sleepy') {
    ctx.ellipse(cx, my + s * 0.012, s * 0.014, s * 0.018, 0, 0, TAU);
    ctx.fillStyle = '#6e2236';
    ctx.fill();
  } else {
    ctx.moveTo(cx - s * 0.035, my);
    ctx.quadraticCurveTo(cx, my + s * 0.04, cx + s * 0.035, my);
    ctx.stroke();
  }
}

/** Sparkles when happy, drifting z's when sleepy. */
export function drawExtras(ctx: CanvasRenderingContext2D, frame: BuddyFrame, lw: number): void {
  const { size: s, mood, elapsed: el } = frame;
  if (mood === 'happy') {
    [
      [0.14, 0.2, 0],
      [0.86, 0.28, 1.3],
      [0.8, 0.08, 2.4],
    ].forEach(([px = 0, py = 0, ph = 0]) => {
      const r = s * 0.045 * Math.max(0, Math.sin(el * 3 + ph));
      if (r < 0.5) return;
      ctx.save();
      ctx.translate(px * s, py * s);
      ctx.fillStyle = '#ffd36e';
      ctx.strokeStyle = INK;
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.35, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.35, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(0, r * 0.35);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, -r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }
  if (mood === 'sleepy') {
    const ph = (el * 0.5) % 1;
    ctx.save();
    ctx.globalAlpha = Math.sin(ph * Math.PI);
    ctx.fillStyle = '#c9b8ff';
    ctx.font = `italic ${Math.round(s * 0.2)}px Newsreader, Georgia, serif`;
    ctx.fillText('z', s * (0.74 + ph * 0.08), s * (0.3 - ph * 0.14));
    ctx.font = `italic ${Math.round(s * 0.13)}px Newsreader, Georgia, serif`;
    ctx.fillText('z', s * (0.86 + ph * 0.05), s * (0.16 - ph * 0.1));
    ctx.restore();
  }
}
