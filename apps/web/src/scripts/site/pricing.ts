/** The Monthly / Yearly switch on 6pm Max's price. Without the script the yearly price shows. */
export function startPricing(root: HTMLElement): void {
  const pricing = root.querySelector<HTMLElement>('[data-pricing]');
  if (!pricing) return;
  const buttons = [...pricing.querySelectorAll<HTMLButtonElement>('[data-period]')];
  const shown = [...pricing.querySelectorAll<HTMLElement>('[data-price], [data-per]')];

  const show = (period: 'month' | 'year'): void => {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.period === period));
    }
    for (const element of shown) element.textContent = element.dataset[period] ?? '';
  };
  for (const button of buttons) {
    button.addEventListener('click', () =>
      show(button.dataset.period === 'month' ? 'month' : 'year'),
    );
  }
}
