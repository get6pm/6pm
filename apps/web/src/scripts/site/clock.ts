import { launchAt, untilLaunch } from '../../data/launch';
import type { LiveLines } from '../../data/site/live-lines';

const six = 18 * 60;
const pad = (n: number): string => String(n).padStart(2, '0');

/** The hero's line: the visitor's own time and how long until their next six o'clock. */
export function closeLine(now: Date, lines: LiveLines): string {
  const minutes = now.getHours() * 60 + now.getMinutes();
  let left = six - minutes;
  // For twenty minutes from six, it is time to close rather than a day to wait.
  if (left <= 0 && left > -20) return lines.closeNow;
  if (left <= 0) left += 24 * 60;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return lines.clock(time, lines.duration(Math.floor(left / 60), left % 60));
}

/** The closing section's line: time to the launch, or that it is out. */
export function countdownLine(now: number, lines: LiveLines): string {
  if (now >= launchAt) return lines.out;
  const [days = 0, hours = 0, minutes = 0] = untilLaunch(now);
  return lines.countdown(days, pad(hours), pad(minutes));
}

/** Writes both lines now and every 15 seconds; neither shows seconds. */
export function startClock(root: HTMLElement, lines: LiveLines): void {
  const clock = root.querySelector('[data-clock-line]');
  const countdown = root.querySelector('[data-countdown]');
  const tick = (): void => {
    const now = Date.now();
    if (clock) clock.textContent = closeLine(new Date(now), lines);
    if (countdown) countdown.textContent = countdownLine(now, lines);
  };
  tick();
  setInterval(tick, 15_000);
}
