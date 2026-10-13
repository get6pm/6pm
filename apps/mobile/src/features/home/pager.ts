import { project, rubberband } from '../../ui/motion/physics';

/**
 * Where the home pages sit for a finger at `raw` (in pages, 0 = Today): one to one between the
 * first and last page it may reach, and giving like rubber past them.
 */
export function followFinger(raw: number, lo: number, hi: number, width: number): number {
  'worklet';
  if (width <= 0) return Math.min(hi, Math.max(lo, raw));
  if (raw < lo) return lo - rubberband((lo - raw) * width, width) / width;
  if (raw > hi) return hi + rubberband((raw - hi) * width, width) / width;
  return raw;
}

/**
 * The page a released swipe lands on. The pages at `position` (in pages) are carried on by the
 * finger's `velocity` (points per second, positive to the right) as far as a UIScrollView would
 * coast, and land on the nearest page: past half a page, or a flick that would carry them there.
 * They land on one of the two pages they are between. A swipe moves one page at most from `current`, and never past `lo`/`hi`.
 */
export function landingPage({
  position,
  velocity,
  width,
  current,
  lo,
  hi,
}: {
  readonly position: number;
  readonly velocity: number;
  readonly width: number;
  readonly current: number;
  readonly lo: number;
  readonly hi: number;
}): number {
  'worklet';
  const projected = width > 0 ? position - project(velocity) / width : position;
  // Never past the pages either side of where they are now: a flick back from a drag towards the
  // next page lands on the page it started from, not the one beyond it.
  const nearest = Math.min(
    Math.ceil(position),
    Math.max(Math.floor(position), Math.round(projected)),
  );
  return Math.min(Math.min(hi, current + 1), Math.max(Math.max(lo, current - 1), nearest));
}
