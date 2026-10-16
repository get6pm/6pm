/** Four corners as `[x0, y0, …, x3, y3]`: top left, top right, bottom right, bottom left. */
export type Quad = readonly number[];

/** How far a corner may wander, in points, while the receipt still counts as held still. */
export const STEADY_POINTS = 10;
/** How long the receipt is held still before Scan takes the photo by itself. */
export const STEADY_MS = 900;
/** A receipt this small on screen is too far away to read: it is outlined, not taken. */
export const MIN_SHARE = 0.12;

/**
 * Where the camera's corners fall on the screen. The preview fills the view and crops what does not
 * fit (aspect fill), so a frame `aspect` wide for each unit of height is scaled to cover the view
 * and centred; corners are normalised in the frame with the origin top left.
 */
export function quadOnView(corners: Quad, aspect: number, width: number, height: number): Quad {
  const scale = Math.max(width / aspect, height);
  const left = (width - aspect * scale) / 2;
  const top = (height - scale) / 2;
  return corners.map((value, i) =>
    i % 2 === 0 ? left + value * aspect * scale : top + value * scale,
  );
}

/** The quad's area over the view's (shoelace formula). */
export function quadShare(quad: Quad, width: number, height: number): number {
  let sum = 0;
  for (let i = 0; i < 4; i += 1) {
    const j = (i + 1) % 4;
    sum +=
      (quad[i * 2] ?? 0) * (quad[j * 2 + 1] ?? 0) - (quad[j * 2] ?? 0) * (quad[i * 2 + 1] ?? 0);
  }
  return width > 0 && height > 0 ? Math.abs(sum) / 2 / (width * height) : 0;
}

/** The furthest any corner moved between two sightings, in points. */
export function quadMoved(a: Quad, b: Quad): number {
  let most = 0;
  for (let i = 0; i < 4; i += 1) {
    const dx = (a[i * 2] ?? 0) - (b[i * 2] ?? 0);
    const dy = (a[i * 2 + 1] ?? 0) - (b[i * 2 + 1] ?? 0);
    most = Math.max(most, Math.hypot(dx, dy));
  }
  return most;
}

/** Whether the receipt is being held still, and since when. */
export interface Steadiness {
  readonly quad: Quad | null;
  /** When it last settled, in ms; null while there is no receipt. */
  readonly since: number | null;
}

export const unsteady: Steadiness = { quad: null, since: null };

/**
 * The next steadiness for a sighting on screen (null when the receipt is gone). Holding still is
 * measured from where it settled, not from the last sighting, so a slow drift still resets it.
 */
export function nextSteadiness(state: Steadiness, quad: Quad | null, now: number): Steadiness {
  if (quad === null) return unsteady;
  if (state.quad === null || state.since === null || quadMoved(state.quad, quad) > STEADY_POINTS) {
    return { quad, since: now };
  }
  return state;
}

/** Whether a receipt held still this long, this large, should be taken now. */
export function readyToTake(
  state: Steadiness,
  now: number,
  width: number,
  height: number,
): boolean {
  return (
    state.quad !== null &&
    state.since !== null &&
    now - state.since >= STEADY_MS &&
    quadShare(state.quad, width, height) >= MIN_SHARE
  );
}
