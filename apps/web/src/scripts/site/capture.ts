/**
 * The ways in: every 2.8 seconds the next way catches a spend, which drops into the top of the
 * inbox with the three before it underneath. Picking a way stops the turning and shows its catch.
 */
export function startCapture(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-capture]');
  if (!section) return;
  const ways = [...section.querySelectorAll<HTMLButtonElement>('[data-way]')];
  const rows = [...section.querySelectorAll<HTMLElement>('[data-row]')];
  let current = 0;
  let turning = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  const show = (pick: number): void => {
    current = pick;
    ways.forEach((way, i) => way.setAttribute('aria-pressed', String(i === pick)));
    const under = rows
      .map((_, i) => i)
      .filter((i) => i !== pick)
      .slice(0, 3);
    rows.forEach((row, i) => {
      const place = i === pick ? 0 : under.indexOf(i) + 1;
      row.hidden = place === 0 && i !== pick;
      row.style.order = String(place);
      row.classList.remove('fresh');
    });
    const fresh = rows[pick];
    if (fresh) {
      void fresh.offsetWidth;
      fresh.classList.add('fresh');
    }
  };

  ways.forEach((way, i) =>
    way.addEventListener('click', () => {
      turning = false;
      show(i);
    }),
  );
  setInterval(() => {
    if (turning && !section.hasAttribute('data-idle')) show((current + 1) % rows.length);
  }, 2800);
}
