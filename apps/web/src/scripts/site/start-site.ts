import { liveLines } from '../../data/site/live-lines';
import type { SiteLang } from '../../data/site/copy';
import { startClock } from './clock';
import { startJoinForms } from './join-forms';
import { startLangPicks } from './lang-picks';
import { startMotion } from './motion';
import { startPricing } from './pricing';

/** Brings the home page to life: reveals, resting loops, the clocks, the forms and the toggles. */
export function startSite(): void {
  const root = document.querySelector<HTMLElement>('[data-site]');
  if (!root) return;
  const lang: SiteLang = document.documentElement.lang === 'vi' ? 'vi' : 'en';
  const lines = liveLines[lang];

  startMotion(root);
  startClock(root, lines);
  startJoinForms(root, lang, lines);
  startPricing(root);
  startLangPicks(root);
}
