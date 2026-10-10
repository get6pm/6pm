import { leakPerMonth } from '../data/habits';
import { pageState, updatePage, watchPage, type PageState } from './page-state';
import { joinWaitlist } from './waitlist-request';

/** How long the stamp is held down before the ticket is sent. */
const holdMs = 900;

const lines = {
  calm: 'One email, at six, on launch day. That’s it.',
  notAnEmail: 'That doesn’t look like an email yet.',
  writeItFirst: 'Write your email on the receipt first.',
  busy: 'Too many tries from here. Give it a minute, then try again.',
  unreachable: 'Couldn’t reach the list. Check your connection and try again.',
} as const;

/** The design's check: something, an @, something, a dot, something. The list checks properly. */
const looksLikeEmail = (email: string): boolean => /^\S+@\S+\.\S+$/.test(email.trim());

const ticketNumber = (ticket: number | null): string =>
  ticket === null ? '----' : String(ticket).padStart(4, '0');

/**
 * The two ways onto the list: the quick form under the leak calculator and the ticket at the end,
 * whose stamp is held for 900 ms. Both share one email and one result. A keyboard, a switch or a
 * screen reader stamps with one press; Enter in either email field sends it as a plain form.
 */
export function startWaitlistForms(root: HTMLElement): void {
  const quick = root.querySelector<HTMLFormElement>('[data-quick-form]');
  const ticket = root.querySelector<HTMLFormElement>('[data-ticket-form]');
  const hold = root.querySelector<HTMLButtonElement>('[data-hold]');
  if (!quick || !ticket || !hold) return;
  const inputs = [...root.querySelectorAll<HTMLInputElement>('[data-email]')];
  const all = (selector: string): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>(selector),
  ];
  const ticketInput = ticket.querySelector<HTMLInputElement>('[data-email]');
  let holdTimer = 0;

  const send = async (): Promise<void> => {
    const { email, sending, ticket: listed, touched, counts } = pageState();
    if (sending || listed !== null) return;
    updatePage({ sending: true, problem: '', canRetry: false });
    const outcome = await joinWaitlist({
      email: email.trim(),
      language: navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en',
      ...(touched ? { leak: Math.round(leakPerMonth(counts)) } : {}),
    });
    switch (outcome.kind) {
      case 'listed':
        updatePage({ sending: false, ticket: outcome.ticket });
        break;
      case 'invalid':
        updatePage({ sending: false, problem: lines.notAnEmail });
        break;
      case 'busy':
        updatePage({ sending: false, problem: lines.busy, canRetry: true });
        break;
      case 'unreachable':
        updatePage({ sending: false, problem: lines.unreachable, canRetry: true });
        break;
    }
  };

  /** Checks the email, then sends it; `problem` is the line shown when it is not an email. */
  const trySend = (problem: string): void => {
    if (pageState().ticket !== null) return;
    if (!looksLikeEmail(pageState().email)) {
      updatePage({ problem, canRetry: false });
      return;
    }
    void send();
  };

  for (const input of inputs) {
    input.addEventListener('input', () => updatePage({ email: input.value, problem: '' }));
  }
  for (const form of [quick, ticket]) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      trySend(lines.notAnEmail);
    });
  }

  const letGo = (): void => {
    if (!hold.hasAttribute('data-holding')) return;
    clearTimeout(holdTimer);
    hold.removeAttribute('data-holding');
  };
  hold.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || pageState().sending || pageState().ticket !== null) return;
    if (!looksLikeEmail(pageState().email)) {
      updatePage({ problem: lines.writeItFirst, canRetry: false });
      return;
    }
    hold.toggleAttribute('data-holding', true);
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      hold.removeAttribute('data-holding');
      void send();
    }, holdMs);
  });
  for (const end of ['pointerup', 'pointerleave', 'pointercancel']) {
    hold.addEventListener(end, letGo);
  }
  hold.addEventListener('contextmenu', (event) => event.preventDefault());
  // A click with no pointer behind it comes from a keyboard, a switch or a screen reader.
  hold.addEventListener('click', (event) => {
    if (event.detail === 0) trySend(lines.writeItFirst);
  });

  for (const retry of all('[data-retry]')) retry.addEventListener('click', () => void send());
  for (const again of all('[data-again]')) {
    again.addEventListener('click', () => {
      updatePage({ ticket: null, email: '', problem: '', canRetry: false });
      ticketInput?.focus();
    });
  }

  watchPage((state) => render(root, inputs, hold, state));
}

function render(
  root: HTMLElement,
  inputs: readonly HTMLInputElement[],
  hold: HTMLButtonElement,
  state: PageState,
): void {
  const listed = state.ticket !== null;
  for (const input of inputs) {
    if (input.value !== state.email) input.value = state.email;
    input.readOnly = listed;
    input.setAttribute('aria-invalid', String(state.problem !== '' && !state.canRetry));
  }
  hold.toggleAttribute('data-sending', state.sending);
  hold.setAttribute('aria-busy', String(state.sending));
  for (const element of root.querySelectorAll<HTMLElement>('[data-when="open"]')) {
    element.hidden = listed;
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-when="listed"]')) {
    element.hidden = !listed;
  }
  for (const element of root.querySelectorAll('[data-ticket]')) {
    element.textContent = ticketNumber(state.ticket);
  }
  root.querySelector('[data-ticket-paper]')?.toggleAttribute('data-stamped', listed);
  const quickLine = root.querySelector<HTMLElement>('[data-quick-message]');
  if (quickLine) {
    quickLine.textContent = state.problem || lines.calm;
    quickLine.toggleAttribute('data-error', state.problem !== '');
  }
  const ticketLine = root.querySelector('[data-ticket-message]');
  if (ticketLine) ticketLine.textContent = state.problem;
  const status = root.querySelector('[data-ticket-status]');
  const said = listed
    ? `You’re on the list. Your ticket is number ${ticketNumber(state.ticket)}.`
    : '';
  if (status && status.textContent !== said) status.textContent = said;
  for (const retry of root.querySelectorAll<HTMLElement>('[data-retry]')) {
    retry.hidden = !state.canRetry || listed;
  }
  for (const again of root.querySelectorAll<HTMLElement>('[data-again]')) again.hidden = !listed;
}
