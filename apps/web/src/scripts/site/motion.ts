/**
 * Scroll reveals and resting loops. What starts below the fold fades up the first time it comes
 * into view, after its `data-reveal` delay in ms. Each section's loops pause while it is off
 * screen, so a long page costs nothing where nobody is looking.
 */
export function startMotion(root: HTMLElement): void {
  if (!('IntersectionObserver' in window)) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!still) {
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.removeAttribute('data-hidden');
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    const fold = innerHeight * 0.94;
    for (const element of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
      if (element.getBoundingClientRect().top < fold) continue;
      element.style.setProperty('--reveal-delay', `${Number(element.dataset.reveal) || 0}ms`);
      element.setAttribute('data-hidden', '');
      reveal.observe(element);
    }
  }

  const idle = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.toggleAttribute('data-idle', !entry.isIntersecting);
  });
  for (const section of root.querySelectorAll('main > section')) idle.observe(section);
}
