import { drawBuddy, type BuddyMood } from './dusk-buddy-draw';

const moods: readonly string[] = ['calm', 'happy', 'wave', 'nod', 'sleepy'];

/** With Reduce Motion the buddy holds one pose, chosen so its eyes are open. */
const stillPoseSeconds = 0.5;

/**
 * `<dusk-buddy size="72" mood="calm">`: the companion, drawn on a canvas every frame while it is on
 * screen. Off screen it stops drawing.
 */
class DuskBuddy extends HTMLElement {
  static readonly observedAttributes = ['size', 'mood'];
  static still = false;

  #canvas: HTMLCanvasElement | null = null;
  #ctx: CanvasRenderingContext2D | null = null;
  #size = 48;
  readonly #seed = Math.random() * 1000;
  readonly #born = performance.now();
  #moodAt = this.#born;
  #frame = 0;
  #onScreen = false;
  #observer: IntersectionObserver | null = null;

  connectedCallback(): void {
    if (!this.#canvas) {
      this.#canvas = document.createElement('canvas');
      this.append(this.#canvas);
    }
    this.#setup();
    this.#observer = new IntersectionObserver(([entry]) => {
      this.#onScreen = entry?.isIntersecting === true;
      this.#run();
    });
    this.#observer.observe(this);
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.#frame);
    this.#observer?.disconnect();
  }

  attributeChangedCallback(name: string, before: string | null, after: string | null): void {
    if (name === 'size') this.#setup();
    if (name === 'mood' && before !== after) {
      this.#moodAt = performance.now();
      if (DuskBuddy.still) this.#draw(this.#born + stillPoseSeconds * 1000);
    }
  }

  #setup(): void {
    if (!this.#canvas) return;
    const size = Number(this.getAttribute('size')) || 48;
    const density = Math.min(3, devicePixelRatio || 1);
    this.#size = size;
    this.#canvas.width = Math.round(size * density);
    this.#canvas.height = Math.round(size * density);
    this.#canvas.style.width = `${size}px`;
    this.#canvas.style.height = `${size}px`;
    this.#ctx = this.#canvas.getContext('2d');
    this.#ctx?.setTransform(density, 0, 0, density, 0, 0);
    this.#draw(this.#born + stillPoseSeconds * 1000);
  }

  #run(): void {
    cancelAnimationFrame(this.#frame);
    if (!this.#onScreen || DuskBuddy.still) return;
    const loop = (time: number): void => {
      this.#frame = requestAnimationFrame(loop);
      this.#draw(time);
    };
    this.#frame = requestAnimationFrame(loop);
  }

  #draw(time: number): void {
    if (!this.#ctx) return;
    const mood = this.getAttribute('mood') ?? 'calm';
    drawBuddy(this.#ctx, {
      size: this.#size,
      mood: (moods.includes(mood) ? mood : 'calm') as BuddyMood,
      seed: this.#seed,
      elapsed: (time - this.#born) / 1000,
      sinceMood: (time - this.#moodAt) / 1000,
    });
  }
}

export function defineDuskBuddy(still: boolean): void {
  DuskBuddy.still = still;
  if (!customElements.get('dusk-buddy')) customElements.define('dusk-buddy', DuskBuddy);
}
