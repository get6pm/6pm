import { duoMoney } from '../../data/site/duo-data';

/**
 * What works on the Duo's screens: the island opens and closes, a spend on the open screen shows
 * its details, the diary turns to any closed day, and the stand's keypad adds spends. The inner
 * screen is drawn twice (one copy per half of the phone), so every change reaches both copies.
 */
export function startDuoScreens(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-duo]');
  if (!section) return;
  const all = (sel: string): HTMLElement[] => [...section.querySelectorAll<HTMLElement>(sel)];

  for (const island of all('[data-duo-island]')) {
    island.addEventListener('click', () => {
      const open = island.getAttribute('aria-expanded') === 'true';
      island.setAttribute('aria-expanded', String(!open));
    });
  }

  // The open screen: a spend in place of October, and back.
  let picked: number | null = null;
  const showSpend = (row: number | null): void => {
    picked = row;
    for (const r of all('[data-duo-row]')) {
      r.setAttribute('aria-pressed', String(Number(r.dataset.duoRow) === row));
    }
    for (const m of all('[data-duo-month]')) m.hidden = row !== null;
    for (const d of all('[data-duo-detail]')) d.hidden = Number(d.dataset.duoDetail) !== row;
  };
  for (const r of all('[data-duo-row]')) {
    r.addEventListener('click', () => {
      const row = Number(r.dataset.duoRow);
      showSpend(picked === row ? null : row);
    });
  }
  for (const b of all('[data-duo-back]')) b.addEventListener('click', () => showSpend(null));

  // The diary: any day up to today, by tapping it or stepping up and down.
  let day = 8;
  const showDay = (next: number): void => {
    day = Math.max(1, Math.min(9, next));
    for (const c of all('[data-duo-day]')) {
      c.setAttribute('aria-pressed', String(Number(c.dataset.duoDay) === day));
    }
    for (const p of all('[data-duo-page]')) p.hidden = Number(p.dataset.duoPage) !== day;
  };
  for (const c of all('[data-duo-day]')) {
    c.addEventListener('click', () => showDay(Number(c.dataset.duoDay)));
  }
  for (const s of all('[data-duo-step]')) {
    s.addEventListener('click', () => showDay(day + Number(s.dataset.duoStep)));
  }

  startStand(section);
}

function startStand(section: HTMLElement): void {
  const stand = section.querySelector<HTMLElement>('[data-duo-stand]');
  if (!stand) return;
  const vi = stand.dataset.lang === 'vi';
  const lang = vi ? 'vi' : 'en';
  const start = Number(stand.dataset.start);
  let left = Number(stand.dataset.left);
  let typed = '';
  let category = '';
  const amount = stand.querySelector<HTMLElement>('[data-stand-amount]');
  const leftLabel = stand.querySelector<HTMLElement>('[data-stand-left]');
  const fill = stand.querySelector<HTMLElement>('[data-stand-fill]');
  const recent = stand.querySelector<HTMLElement>('[data-stand-recent]');
  const cats = [...stand.querySelectorAll<HTMLElement>('[data-stand-cat]')];
  category = cats[0]?.dataset.standCat ?? '';

  const showTyped = (): void => {
    if (!amount) return;
    amount.textContent = vi ? `${typed || '0'}k` : `$${typed || '0'}`;
    amount.toggleAttribute('data-typed', typed !== '');
  };

  for (const key of stand.querySelectorAll<HTMLElement>('[data-stand-key]')) {
    key.addEventListener('click', () => {
      const k = key.dataset.standKey ?? '';
      typed = k === 'del' ? typed.slice(0, -1) : (typed + k).replace(/^0+/, '').slice(0, 4);
      showTyped();
    });
  }
  for (const cat of cats) {
    cat.addEventListener('click', () => {
      category = cat.dataset.standCat ?? '';
      cats.forEach((c) => c.setAttribute('aria-pressed', String(c === cat)));
    });
  }
  stand.querySelector('[data-stand-add]')?.addEventListener('click', () => {
    const n = parseInt(typed, 10) || 0;
    if (!n) return;
    // On the English page the keypad types dollars; the screen keeps thousands of đồng.
    const thousands = vi ? n : n * 10;
    left -= thousands;
    typed = '';
    showTyped();
    if (leftLabel) leftLabel.textContent = duoMoney(lang, left);
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, (left / start) * 100))}%`;
    if (recent) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = category;
      const sum = document.createElement('span');
      sum.className = 'chip-amt';
      sum.textContent = `−${duoMoney(lang, thousands)}`;
      chip.append(sum);
      recent.prepend(chip);
      while (recent.children.length > 3) recent.lastElementChild?.remove();
    }
  });
}
