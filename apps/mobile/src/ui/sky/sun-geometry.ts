import { configFor, sunFor, type FrameInput, type Palette } from '@6pm/theme';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** The sun before a look restyles it, as the prototype's frame computes it (CSS values). */
export interface BaseSun {
  /** Centre x as a fraction of the sky's width. */
  readonly x: number;
  /** Centre y in points from the top of the screen. */
  readonly y: number;
  /** Diameter in points. */
  readonly size: number;
  readonly color: string;
  readonly glow: string;
  readonly opacity: number;
}

/**
 * The sun's arc over the day: it rises at 06:00 on the left, peaks at 12:15 and sets at 18:30 on the
 * right, swelling from 15:00, and is gone by 19:06. It only shows where `visible` (the Today tab)
 * and never in serious mode.
 */
export function baseSun(
  hour: number,
  palette: Palette,
  visible: boolean,
  serious: boolean,
): BaseSun {
  const t = clamp01((hour - 6) / 12.5);
  const evening = hour > 16.5;
  const { b1, b2 } = palette;
  return {
    x: (10 + t * 80) / 100,
    y: 400 - Math.sin(Math.PI * t) * 270,
    size: 60 + Math.max(0, hour - 15) * 12,
    color: evening
      ? `radial-gradient(circle at 50% 38%, #fff4dc 0%, #ffc46b 48%, ${b1} 100%)`
      : 'radial-gradient(circle at 50% 40%, #fffdf4, #fff3c8 70%)',
    glow: evening
      ? `0 0 0 12px ${b1}2e, 0 0 0 30px ${b1}17, 0 0 0 54px ${b2}0d, 0 0 150px 70px ${b2}55`
      : `0 0 0 14px #ffffff26, 0 0 0 34px #ffffff12, 0 0 110px 44px ${b1}55`,
    opacity: serious || !visible ? 0 : clamp01(1 - (hour - 18.5) / 0.6),
  };
}

/** The sun as a look draws it (`sunFx`), in points, with the look's extras as CSS. */
export interface LookSun extends BaseSun {
  readonly mask: string;
  readonly ghost: string;
  readonly ghostOp: number;
  readonly gx: number;
  readonly gy: number;
  readonly thread: string;
  readonly threadOp: number;
  /** The thread's length, from the top of the screen to the sun's top edge. */
  readonly threadH: number;
}

/**
 * The look's sun for a frame: the base sun handed to the look engine in its CSS form (a look may
 * move it to the safe height under the header, or resize it) and read back into points.
 */
export function lookSun(input: FrameInput, palette: Palette, visible: boolean): LookSun {
  const base = baseSun(input.hour, palette, visible, input.serious);
  const sun = sunFor(input, palette, { ...base, top: `${base.y}px` });
  const num = (v: unknown, fallback: number) => {
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : fallback;
  };
  const text = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
  return {
    x: base.x,
    y: num(sun.top, base.y),
    size: num(sun.size, base.size),
    color: text(sun.color, base.color),
    glow: text(sun.glow, base.glow),
    opacity: num(sun.opacity, 0),
    mask: text(sun.mask, 'none'),
    ghost: text(sun.ghost, 'transparent'),
    ghostOp: num(sun.ghostOp, 0),
    gx: num(sun.gx, 0),
    gy: num(sun.gy, 0),
    thread: text(sun.thread, 'transparent'),
    threadOp: num(sun.threadOp, 0),
    threadH: num(sun.threadH, 0),
  };
}

/** The moon fades in from 19:00 to 20:00, except in serious mode or Basic with "Sun & moon" off. */
export function moonOpacity(input: FrameInput): number {
  if (input.serious) return 0;
  if (input.look === 'basic' && !configFor('basic', input.config).sun) return 0;
  return clamp01(input.hour - 19);
}

/** The moon: a 26 pt disc whose top-left corner sits at 78% across and 124 pt down. */
export const MOON = { left: 0.78, top: 124, size: 26 } as const;
