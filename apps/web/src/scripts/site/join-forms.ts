import type { SiteLang } from '../../data/site/copy';
import type { LiveLines } from '../../data/site/live-lines';
import { joinWaitlist } from '../waitlist-request';

/** The design's check: something, an @, something, a dot, something. The list checks properly. */
const looksLikeEmail = (email: string): boolean => /^\S+@\S+\.\S+$/.test(email.trim());

/**
 * The two launch-list forms, at the top and at the bottom of the page. Either one puts the email on
 * the list; once it is there, both say so.
 */
export function startJoinForms(root: HTMLElement, lang: SiteLang, lines: LiveLines): void {
  const blocks = [...root.querySelectorAll<HTMLElement>('[data-join]')];
  let sending = false;

  const say = (block: HTMLElement, line: string | null): void => {
    const note = block.querySelector<HTMLElement>('[data-join-note]');
    if (!note) return;
    note.textContent = line ?? note.dataset.calm ?? '';
    note.toggleAttribute('data-error', line !== null);
    block.querySelector('[data-join-email]')?.setAttribute('aria-invalid', String(line !== null));
  };

  const listed = (): void => {
    for (const block of blocks) {
      const form = block.querySelector<HTMLElement>('[data-join-form]');
      const sent = block.querySelector<HTMLElement>('[data-join-sent]');
      const line = block.querySelector('[data-join-sent-line]');
      if (form) form.hidden = true;
      if (line) line.textContent = lines.sent;
      if (sent) sent.hidden = false;
      const note = block.querySelector<HTMLElement>('[data-join-note]');
      if (note) note.hidden = true;
    }
  };

  for (const block of blocks) {
    const form = block.querySelector<HTMLFormElement>('[data-join-form]');
    const input = block.querySelector<HTMLInputElement>('[data-join-email]');
    const button = form?.querySelector('button');
    if (!form || !input || !button) continue;
    input.addEventListener('input', () => say(block, null));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (sending) return;
      const email = input.value.trim();
      if (!looksLikeEmail(email)) {
        say(block, lines.notAnEmail);
        input.focus();
        return;
      }
      sending = true;
      button.setAttribute('aria-busy', 'true');
      void joinWaitlist({ email, language: lang }).then((outcome) => {
        sending = false;
        button.removeAttribute('aria-busy');
        if (outcome.kind === 'listed') listed();
        else if (outcome.kind === 'invalid') say(block, lines.notAnEmail);
        else if (outcome.kind === 'busy') say(block, lines.busy);
        else say(block, lines.unreachable);
      });
    });
  }
}
