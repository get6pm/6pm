import type { CompanionForm, CompanionMood } from './companion-mood';
import { bodyOf, shrinkOf, squashOf } from './companion-shape';
import { kitOfRuntime, type Frame } from './draw-kit';

export interface FrameInput {
  readonly s: number;
  readonly el: number;
  readonly since: number;
  readonly sinceF: number;
  readonly mood: CompanionMood;
  readonly form: CompanionForm;
  readonly seed: number;
}

/** The body's size, bob, hop and tilt for this moment, in the form's own proportions. */
export function makeFrame({ s, el, since, sinceF, mood, form, seed }: FrameInput): Frame {
  'worklet';
  const plain = mood === 'plain';
  const shown: CompanionForm = plain ? 'sun' : form;
  const body = bodyOf(shown);
  const breathe =
    (mood === 'sleepy' ? Math.sin(el * 1.4) * 0.035 : Math.sin(el * 2.2) * 0.02) * body.breath;
  let hop = 0;
  let tilt = 0;
  if (mood === 'happy') hop = -Math.abs(Math.sin(el * 5.2)) * s * (since < 1.2 ? 0.08 : 0.025);
  if (mood === 'nod') tilt = Math.sin(el * 2.6) * 0.08;
  if (mood === 'think') tilt = -0.07;
  if (mood === 'wave') tilt = Math.sin(el * 2) * 0.03;
  const squash = squashOf(shown, mood, el, since, sinceF);
  const shrink = shrinkOf(shown, mood, el);
  const rx = s * body.rx * (1 + squash) * shrink;
  const ry = s * body.ry * (1 + breathe) * (1 - squash) * shrink;
  // The sun keeps the prototype's bob; the others rest their bottoms on the ground.
  const sun = shown === 'sun' || shown === 'max';
  const cy = sun ? s * 0.57 + hop - breathe * s * 0.1 : s * body.ground - ry + hop;
  const kit = kitOfRuntime();
  kit.paintAt = 0;
  kit.builderAt = 0;
  return {
    s,
    el,
    since,
    sinceF,
    mood,
    plain,
    form: shown,
    mx: shown === 'max',
    lw: Math.max(1.3, s * 0.034),
    cx: s / 2,
    cy,
    rx,
    ry,
    hz: cy + ry * 0.3,
    hop,
    tilt,
    seed,
    tick: Math.floor(el * 6),
    kit,
  };
}
