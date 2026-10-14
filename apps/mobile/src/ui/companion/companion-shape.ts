import type { CompanionForm, CompanionMood } from './companion-mood';

/**
 * Each form's body as fractions of the square: half its width and height, where its bottom
 * rests, and how deeply it breathes. The sun keeps the prototype's own numbers in `makeFrame`.
 */
const BODY = {
  sun: { rx: 0.3, ry: 0.28, ground: 0.85, breath: 1 },
  max: { rx: 0.3, ry: 0.28, ground: 0.85, breath: 1 },
  nhang: { rx: 0.31, ry: 0.25, ground: 0.85, breath: 0.8 },
  banhbao: { rx: 0.335, ry: 0.235, ground: 0.865, breath: 1.9 },
  giot: { rx: 0.265, ry: 0.255, ground: 0.885, breath: 1.2 },
  hac: { rx: 0.27, ry: 0.26, ground: 0.875, breath: 0.6 },
} as const satisfies Record<CompanionForm, object>;

export function bodyOf(form: CompanionForm): (typeof BODY)[CompanionForm] {
  'worklet';
  return BODY[form];
}

/** How long the happy drop takes to split, orbit once and merge, and how often it does. */
const SPLIT_CYCLE = 3.6;
const SPLIT_SHARE = 0.45;
/** One slow melt into a puddle and back, while it sleeps. */
const PUDDLE_CYCLE = 7;

/** A settling wobble after a jolt: strong at first, gone after about a second and a half. */
export function jiggle(seconds: number, speed: number): number {
  'worklet';
  if (seconds < 0 || seconds > 1.6) return 0;
  return Math.sin(seconds * speed) * Math.exp(-seconds * 3.4);
}

/** Where the happy drop is in its split: 0 → 1 while apart, −1 the rest of the time. */
export function splitPhase(el: number): number {
  'worklet';
  const t = (el % SPLIT_CYCLE) / SPLIT_CYCLE;
  return t < SPLIT_SHARE ? t / SPLIT_SHARE : -1;
}

/** How flat the sleeping drop has melted, 0 (a drop) to 1 (a puddle). */
export function puddleOf(el: number): number {
  'worklet';
  const wave = 0.5 - 0.5 * Math.cos(((el % PUDDLE_CYCLE) / PUDDLE_CYCLE) * Math.PI * 2);
  return wave * wave * (3 - 2 * wave);
}

/** Height above the ground of a hop, 0 → 1: zero at each landing. */
function hopLift(el: number): number {
  'worklet';
  return Math.abs(Math.sin(el * 5.2));
}

/**
 * How far the body is squashed for this moment: above zero it is wider and lower, below zero
 * taller and narrower. The bun lands soft and jiggles; the drop wobbles like jelly and melts as
 * it sleeps; the urn and the paper crane hold their shape.
 */
export function squashOf(
  form: CompanionForm,
  mood: CompanionMood,
  el: number,
  since: number,
  sinceF: number,
): number {
  'worklet';
  if (mood === 'plain') return 0;
  if (form === 'banhbao') {
    let q = jiggle(since, 17) * 0.1 + jiggle(sinceF, 15) * 0.14;
    if (mood === 'happy') {
      const lift = hopLift(el);
      q += 0.1 * (1 - Math.min(1, lift * 4)) - 0.05 * lift;
    }
    if (mood === 'sleepy') q += 0.05;
    return q;
  }
  if (form === 'giot') {
    let q = Math.sin(el * 6.2) * 0.022 + jiggle(since, 19) * 0.09 + jiggle(sinceF, 16) * 0.12;
    if (mood === 'happy') {
      const lift = hopLift(el);
      q += 0.08 * (1 - Math.min(1, lift * 5)) - 0.04 * lift;
    }
    if (mood === 'sleepy') q += 0.34 * puddleOf(el);
    return q;
  }
  return 0;
}

/** The drop shrinks a little while two small drops are away from it. */
export function shrinkOf(form: CompanionForm, mood: CompanionMood, el: number): number {
  'worklet';
  if (form !== 'giot' || mood !== 'happy') return 1;
  const phase = splitPhase(el);
  return phase < 0 ? 1 : 1 - 0.2 * Math.sin(phase * Math.PI);
}
