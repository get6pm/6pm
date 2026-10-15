/**
 * EN / VI: the pick is remembered, so the next visit opens in it (the page head reads it), and the
 * visitor keeps their place on the page.
 */
export function startLangPicks(root: HTMLElement): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('[data-lang-pick]')) {
    link.addEventListener('click', () => {
      try {
        localStorage.setItem('6pm-site-lang', link.dataset.langPick ?? 'en');
      } catch {
        // Storage can be off; the link still works.
      }
      link.hash = location.hash;
    });
  }
}
