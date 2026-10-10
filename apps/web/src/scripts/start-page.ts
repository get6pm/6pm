import { startCloseDemo } from './close-demo';
import { startCompanionPicker } from './companion-picker';
import { startCountdown } from './countdown';
import { defineDuskBuddy } from './dusk-buddy';
import { startLeakCalculator } from './leak-calculator';
import { startScrollScenes, type SkyMode } from './scroll-scenes';
import { startWaitlistForms } from './waitlist-forms';

/**
 * Brings the page to life. Reduce Motion keeps every scene and the sky (they follow the scroll),
 * and drops what moves by itself: the flash and shake, the buddy's animation and the ripple.
 * `?sky=six` holds the sky at six o'clock instead of letting it set as the page scrolls.
 */
export function startPage(): void {
  const root = document.querySelector<HTMLElement>('[data-page]');
  if (!root) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sky: SkyMode = new URLSearchParams(location.search).get('sky') === 'six' ? 'six' : 'sets';

  if (still) {
    const ripple = root.querySelector<SVGSVGElement>('svg[data-ripple]');
    ripple?.pauseAnimations();
  }
  defineDuskBuddy(still);
  startScrollScenes(root, still, sky);
  startLeakCalculator(root);
  startCloseDemo(root);
  startCompanionPicker(root);
  startCountdown(root);
  startWaitlistForms(root);
}
