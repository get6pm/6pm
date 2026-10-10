import { clamp01 } from '../data/seeded';
import { clockAt, skyVariables } from '../data/sky';
import { pageState, watchPage } from './page-state';
import { drawDiary, drawLeak, drawOdometer } from './scene-frames';

/** "Sets as you scroll": dusk deepens to night down the page. "Always 6pm": it stays at six. */
export type SkyMode = 'sets' | 'six';

/** Where each scene lands its punch (scroll progress) and how sharp it is, for the flash and shake. */
const impacts: Readonly<Record<string, readonly [number, number]>> = {
  leak: [0.79, 0.03],
  dial: [0.855, 0.02],
  odo: [0.66, 0.025],
};

/**
 * Drives the page from the scroll position, once per frame at most: each scene's progress `--k`
 * (0 when its top reaches the top of the screen, 1 when its bottom reaches the bottom), the sky's
 * hour, the impact flash and shake, and the dock.
 */
export function startScrollScenes(root: HTMLElement, still: boolean, sky: SkyMode): void {
  const page = document.scrollingElement ?? document.documentElement;
  const scenes = [...root.querySelectorAll<HTMLElement>('[data-scene]')];
  const shakers = [...root.querySelectorAll<HTMLElement>('[data-shake]')];
  const clocks = [...root.querySelectorAll<HTMLElement>('[data-clock]')];
  const flash = root.querySelector<HTMLElement>('[data-flash]');
  const dock = root.querySelector<HTMLElement>('[data-dock]');
  const list = root.querySelector<HTMLElement>('#list');
  const seconds = root.querySelector<HTMLElement>('[data-seconds]');
  const progress = new Map<HTMLElement, number>();
  let frame = 0;

  const draw = (): void => {
    frame = 0;
    const vh = innerHeight;
    let heroK = 0;
    let heroEnd = 0;
    let impact = 0;
    let struck: HTMLElement | null = null;

    for (const scene of scenes) {
      const box = scene.getBoundingClientRect();
      const k = clamp01(-box.top / Math.max(1, box.height - vh));
      const name = scene.dataset['scene'] ?? '';
      if (name === 'hero') {
        heroK = k;
        heroEnd = page.scrollTop + box.bottom - vh;
      }
      const peak = impacts[name];
      if (peak && k > 0 && k < 1) {
        const strength = Math.exp(-(((k - peak[0]) / peak[1]) ** 2));
        if (strength > impact) {
          impact = strength;
          struck = scene;
        }
      }
      if (progress.get(scene) === k) continue;
      progress.set(scene, k);
      scene.style.setProperty('--k', k.toFixed(4));
      if (name === 'dial' && seconds) {
        seconds.textContent = String(Math.max(1, Math.ceil(60 * (1 - clamp01(k / 0.8)))));
      }
      if (name === 'leak') drawLeak(scene, k);
      if (name === 'odo') drawOdometer(scene, k);
      if (name === 'diary') drawDiary(scene, k);
    }

    if (!still) {
      if (flash) flash.style.opacity = (impact * 0.6).toFixed(3);
      for (const shaker of shakers) {
        const shaking = struck?.contains(shaker) === true && impact > 0.05;
        shaker.style.transform = shaking
          ? `translate(${((Math.random() - 0.5) * 16 * impact).toFixed(1)}px, ${((Math.random() - 0.5) * 12 * impact).toFixed(1)}px)`
          : '';
      }
    }

    if (dock) {
      const listTop = list ? list.getBoundingClientRect().top : Infinity;
      const shown =
        pageState().ticket === null && page.scrollTop > heroEnd + vh * 0.4 && listTop > vh * 0.75;
      if (dock.hasAttribute('data-shown') !== shown) {
        dock.toggleAttribute('data-shown', shown);
        dock.tabIndex = shown ? 0 : -1;
        dock.setAttribute('aria-hidden', String(!shown));
      }
    }

    const end = Math.max(1, page.scrollHeight - vh);
    const afterHero = clamp01((page.scrollTop - heroEnd) / Math.max(1, end - heroEnd));
    const hour = heroK < 1 ? 17 + heroK : sky === 'six' ? 18.05 : 18 + 4 * afterHero;
    for (const [name, value] of skyVariables(hour)) root.style.setProperty(name, value);
    root.style.setProperty('--brand', heroK < 0.97 ? '#140a1f' : '#fbf4ec');
    const clock = clockAt(hour);
    for (const element of clocks) {
      if (element.textContent !== clock) element.textContent = clock;
    }
  };

  const request = (): void => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => {
    progress.clear();
    request();
  });
  document.addEventListener('visibilitychange', request);
  void document.fonts.ready.then(request);
  watchPage(request);
  draw();
}
