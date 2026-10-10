import { configFor, type FrameInput, type Palette } from '@6pm/theme';

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

/** The moon fades in from 19:00 to 20:00, except in serious mode or Basic with "Sun & moon" off. */
export function moonOpacity(input: FrameInput): number {
  if (input.serious) return 0;
  if (input.look === 'basic' && !configFor('basic', input.config).sun) return 0;
  return clamp01(input.hour - 19);
}

/** The moon: a 26 pt disc whose top-left corner sits at 78% across and 124 pt down. */
export const MOON = {
  left: 0.78,
  top: 124,
  size: 26,
  color: '#f4ecda',
  glow: '0 0 50px 14px rgba(244,236,218,.14)',
  shade: 'inset -7px -3px 0 rgba(30,26,60,.35)',
} as const;
