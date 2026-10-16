/**
 * The six o'clock close, playable: Keep (or drag the top receipt right) sends it off, the last one
 * closes the day and shows tomorrow's number, Undo brings one back, and it can be played again.
 */
const keepAt = 90;

export function startClose(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-close]');
  if (!section) return;
  const cards = [...section.querySelectorAll<HTMLElement>('[data-close-card]')];
  const stamps = cards.map((c) => c.querySelector<HTMLElement>('[data-close-keep-stamp]'));
  const done = section.querySelector<HTMLElement>('[data-close-done]');
  const closed = section.querySelector<HTMLElement>('[data-close-stamp]');
  const open = section.querySelector<HTMLElement>('[data-close-open]');
  const undo = section.querySelector<HTMLButtonElement>('[data-close-undo]');
  const keep = section.querySelector<HTMLButtonElement>('[data-close-keep]');
  const keepLabel = section.querySelector<HTMLElement>('[data-close-keep-label]');
  const step = section.querySelector<HTMLElement>('[data-close-step]');
  const again = section.querySelector<HTMLButtonElement>('[data-close-again]');
  const total = cards.length;
  let kept = 0;
  let dx = 0;
  let startX: number | null = null;

  const paint = (): void => {
    cards.forEach((card, i) => {
      const rel = i - kept;
      const top = rel === 0;
      const x = top ? dx : 0;
      card.style.transform =
        rel < 0
          ? 'translate(120%, -30px) rotate(18deg)'
          : `translate(${x}px, ${rel * 16}px) scale(${1 - rel * 0.05}) rotate(${x / 18}deg)`;
      card.style.opacity = rel < 0 ? '0' : '1';
      card.style.pointerEvents = rel < 0 ? 'none' : '';
      card.toggleAttribute('data-top', top);
      const stamp = stamps[i];
      if (stamp) stamp.style.opacity = String(top ? Math.max(0, Math.min(1, x / keepAt)) : 0);
    });
    const finished = kept >= total;
    if (done) done.hidden = !finished;
    if (closed) closed.hidden = !finished;
    if (open) open.hidden = finished;
    if (again) again.hidden = !finished;
    if (undo) undo.disabled = kept === 0;
    if (keepLabel && keep) {
      keepLabel.textContent =
        (kept === total - 1 ? keep.dataset.keepLast : keep.dataset.keep) ?? '';
    }
    if (step) step.textContent = `${Math.min(kept + 1, total)} / ${total}`;
  };

  const settle = (): void => {
    dx = 0;
    startX = null;
    cards.forEach((c) => c.removeAttribute('data-dragging'));
  };

  keep?.addEventListener('click', () => {
    kept = Math.min(total, kept + 1);
    settle();
    paint();
  });
  undo?.addEventListener('click', () => {
    kept = Math.max(0, kept - 1);
    settle();
    paint();
  });
  again?.addEventListener('click', () => {
    kept = 0;
    settle();
    paint();
    keep?.focus();
  });

  cards.forEach((card, i) => {
    card.addEventListener('pointerdown', (event) => {
      if (i !== kept) return;
      startX = event.clientX;
      card.setPointerCapture(event.pointerId);
      card.setAttribute('data-dragging', '');
    });
    card.addEventListener('pointermove', (event) => {
      if (i !== kept || startX === null) return;
      dx = Math.max(-40, event.clientX - startX);
      paint();
    });
    const release = (): void => {
      if (i !== kept || startX === null) return;
      if (dx > keepAt) kept = Math.min(total, kept + 1);
      settle();
      paint();
    };
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);
  });

  paint();
}
