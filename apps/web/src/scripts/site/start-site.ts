import { liveLines } from '../../data/site/live-lines';
import type { SiteLang } from '../../data/site/copy';
import { startAsk } from './ask';
import { startCapture } from './capture';
import { startClock } from './clock';
import { startClose } from './close';
import { defineCompanion } from './companion';
import { startDuo } from './duo';
import { startDuoScreens } from './duo-screens';
import { startJoinForms } from './join-forms';
import { startLangPicks } from './lang-picks';
import { startMotion } from './motion';
import { startPricing } from './pricing';
import { startSky } from './sky';

/** Brings the home page to life: the sky, reveals, the clocks, the forms and every demo. */
export function startSite(): void {
  const root = document.querySelector<HTMLElement>('[data-site]');
  if (!root) return;
  const lang: SiteLang = document.documentElement.lang === 'vi' ? 'vi' : 'en';
  const lines = liveLines[lang];

  defineCompanion();
  startSky(root);
  startMotion(root);
  startClock(root, lines);
  startJoinForms(root, lang, lines);
  startCapture(root);
  startClose(root);
  startAsk(root);
  startDuo(root);
  startDuoScreens(root);
  startPricing(root);
  startLangPicks(root);
}
