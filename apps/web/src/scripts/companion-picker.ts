import { personas, type Persona } from '../data/personas';

const isPersona = (value: string | undefined): value is Persona =>
  value !== undefined && value in personas;

/** "Pick how honest it gets": the buddy's mood, glow and three lines follow the chosen voice. */
export function startCompanionPicker(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-companion]');
  if (!section) return;
  const glow = section.querySelector<HTMLElement>('[data-glow]');
  const bubbles = [...section.querySelectorAll<HTMLElement>('[data-bubbles] > *')];
  const buddy = section.querySelector('[data-buddy="companion"]');
  const buttons = [...section.querySelectorAll<HTMLButtonElement>('[data-persona]')];

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const name = button.dataset['persona'];
      if (!isPersona(name)) return;
      const persona = personas[name];
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
      if (glow) glow.style.background = persona.glow;
      buddy?.setAttribute('mood', persona.mood);
      bubbles.forEach((bubble, i) => {
        const [when = '', line = ''] = persona.lines[i] ?? [];
        const stamp = bubble.firstElementChild;
        if (stamp) stamp.textContent = when;
        if (bubble.lastChild && bubble.lastChild !== stamp) bubble.lastChild.textContent = line;
      });
    });
  }
}
