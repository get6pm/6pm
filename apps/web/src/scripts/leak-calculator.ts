import { formatShort, formatVnd } from '@6pm/domain';

import { countLabel, habitMax, habits, leakEquivalent, leakPerMonth } from '../data/habits';
import { pageState, updatePage, watchPage } from './page-state';

const setText = (element: Element | null, text: string): void => {
  if (element && element.textContent !== text) element.textContent = text;
};

/**
 * "How big is your leak?": the steppers change the counts; the card, the ticket's LEAK line and
 * the dock follow.
 */
export function startLeakCalculator(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-calculator]');
  if (!section) return;
  const dockLine = root.querySelector('[data-dock-line]');
  const dockDefault = dockLine?.textContent ?? '';

  for (const row of section.querySelectorAll<HTMLElement>('[data-habit]')) {
    const id = row.dataset['habit'] ?? '';
    for (const button of row.querySelectorAll<HTMLButtonElement>('[data-step]')) {
      const step = Number(button.dataset['step']);
      button.addEventListener('click', () => {
        const { counts } = pageState();
        const next = Math.max(0, Math.min(habitMax, (counts[id] ?? 0) + step));
        updatePage({ counts: { ...counts, [id]: next }, touched: true });
      });
    }
  }

  watchPage(({ counts, touched }) => {
    for (const habit of habits) {
      const count = section.querySelector(`[data-habit="${habit.id}"] [data-count]`);
      setText(count, countLabel(habit, counts[habit.id] ?? 0));
    }
    const month = leakPerMonth(counts);
    setText(section.querySelector('[data-leak-month]'), formatVnd(Math.round(month / 1000) * 1000));
    setText(section.querySelector('[data-leak-year]'), formatShort(month * 12, 'en'));
    setText(section.querySelector('[data-leak-equivalent]'), leakEquivalent(month));
    setText(root.querySelector('[data-leak-ticket]'), `${formatShort(month, 'en')} / mo`);
    setText(dockLine, touched ? `Your leak: ${formatShort(month, 'en')} a month` : dockDefault);
  });
}
