import { untilLaunch } from '../data/launch';

const unitNames = ['days', 'hours', 'minutes', 'seconds'];

/** The launch countdown: each digit is a reel that rolls to its number every second. */
export function startCountdown(root: HTMLElement): void {
  const countdown = root.querySelector<HTMLElement>('[data-countdown]');
  if (!countdown) return;
  const launchAt = Number(countdown.dataset['countdown']);
  const reels = [...countdown.querySelectorAll<HTMLElement>('[data-countdown-digit]')];
  const spoken = countdown.querySelector('[data-countdown-text]');
  let lastMinute = '';

  const tick = (): void => {
    const parts = untilLaunch(Date.now(), launchAt);
    const digits = parts.map((n) => String(Math.min(99, n)).padStart(2, '0')).join('');
    reels.forEach((reel, i) => {
      reel.style.transform = `translateY(${-Number(digits[i]) * 1.04}em)`;
    });
    // Screen readers get the time to the minute, not a reel of ten digits.
    const words = parts
      .slice(0, 3)
      .map((n, i) => `${n} ${unitNames[i] ?? ''}`)
      .join(', ');
    if (words !== lastMinute && spoken) {
      lastMinute = words;
      spoken.textContent = `${words} until launch`;
    }
  };

  tick();
  // The first numbers appear in place; every change after that rolls.
  requestAnimationFrame(() => requestAnimationFrame(() => countdown.toggleAttribute('data-ready')));
  setTimeout(
    () => {
      tick();
      setInterval(tick, 1000);
    },
    1000 - (Date.now() % 1000),
  );
}
