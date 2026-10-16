/** Ask 6pm: picking a question plays it on the phone, the companion thinking before it answers. */
export function startAsk(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-ask]');
  if (!section) return;
  const picks = [...section.querySelectorAll<HTMLButtonElement>('[data-ask-pick]')];
  const answers = [...section.querySelectorAll<HTMLElement>('[data-ask-answer]')];
  picks.forEach((pick, i) =>
    pick.addEventListener('click', () => {
      picks.forEach((p, j) => p.setAttribute('aria-pressed', String(i === j)));
      // Hiding every answer first restarts the shown one's animation.
      answers.forEach((a) => (a.hidden = true));
      const shown = answers[i];
      if (shown) {
        void shown.offsetWidth;
        shown.hidden = false;
      }
    }),
  );
}
