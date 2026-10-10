/** How far along the track counts as a close when the thumb is let go. */
const closeAt = 0.82;
/** The thumb's diameter plus its inset on both ends. */
const thumbSpan = 76;

/**
 * "Swipe to close Friday": drag the thumb along the track; let go past 82% and Friday is closed
 * and stamped. A keyboard or a screen reader closes it with one press. Undo opens it again.
 */
export function startCloseDemo(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-close-demo]');
  const part = <T extends HTMLElement>(name: string): T | null =>
    section?.querySelector<T>(`[data-${name}]`) ?? null;
  const track = part('track');
  const thumb = part<HTMLButtonElement>('thumb');
  const label = part('track-label');
  const icon = part('thumb-icon');
  const day = part('day');
  const stamp = part('closed-stamp');
  const note = part('close-note');
  const undo = part<HTMLButtonElement>('undo');
  const buddy = section?.querySelector('[data-buddy="close"]');
  if (!track || !thumb || !label || !icon || !day || !stamp || !note || !undo) return;

  let drag = 0;
  let dragging = false;
  let closed = false;
  let startX = 0;
  const room = (): number => Math.max(1, track.clientWidth - thumbSpan);

  const render = (): void => {
    track.style.setProperty('--drag', `${Math.round(drag * room())}px`);
    track.toggleAttribute('data-dragging', dragging);
    track.toggleAttribute('data-moved', drag > 0);
    track.toggleAttribute('data-closed', closed);
    label.textContent = closed ? 'Friday is closed' : 'Swipe to close Friday';
    label.style.opacity = String(closed ? 1 : Math.max(0, 1 - drag * 1.6));
    icon.textContent = closed ? 'check' : 'arrow_forward';
    thumb.setAttribute('aria-label', closed ? 'Friday is closed' : 'Swipe to close Friday');
    thumb.setAttribute('aria-disabled', String(closed));
    day.toggleAttribute('data-closed', closed);
    stamp.hidden = !closed;
    note.textContent = closed ? 'That was the whole close. See you tomorrow.' : '';
    undo.hidden = !closed;
    buddy?.setAttribute('mood', closed ? 'happy' : 'calm');
  };

  thumb.addEventListener('pointerdown', (event) => {
    if (closed) return;
    thumb.setPointerCapture(event.pointerId);
    startX = event.clientX - drag * room();
    dragging = true;
    render();
  });
  thumb.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    drag = Math.max(0, Math.min(1, (event.clientX - startX) / room()));
    render();
  });
  const letGo = (): void => {
    if (!dragging) return;
    dragging = false;
    closed = drag > closeAt;
    drag = closed ? 1 : 0;
    render();
  };
  thumb.addEventListener('pointerup', letGo);
  thumb.addEventListener('pointercancel', letGo);
  // A click with no pointer behind it comes from a keyboard, a switch or a screen reader.
  thumb.addEventListener('click', (event) => {
    if (event.detail !== 0 || closed) return;
    closed = true;
    drag = 1;
    render();
  });
  undo.addEventListener('click', () => {
    closed = false;
    drag = 0;
    render();
    thumb.focus();
  });
  addEventListener('resize', render);
  render();
}
