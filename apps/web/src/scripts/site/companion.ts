import { drawFigure, drawShadow, makeFrame, type Mood } from './companion-draw';
import { drawExtras, drawFace } from './companion-face';

const moods: readonly Mood[] = ['calm', 'happy', 'wave', 'think', 'sleepy'];

/**
 * `<dusk-buddy size="48" mood="wave">`: the sun companion. It moves only while on screen, and
 * holds still when the visitor asks for less motion.
 */
class DuskBuddy extends HTMLElement {
  static observedAttributes = ['mood', 'size'];

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private size = 48;
  private ratio = 1;
  private seed = Math.random() * 1000;
  private born = performance.now();
  private moodAt = this.born;
  private frame = 0;
  private seen: IntersectionObserver | null = null;

  connectedCallback(): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.append(this.canvas);
    }
    this.setup();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.draw(this.born + 500);
      return;
    }
    this.seen = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) this.play();
      else this.pause();
    });
    this.seen.observe(this);
  }

  disconnectedCallback(): void {
    this.pause();
    this.seen?.disconnect();
  }

  attributeChangedCallback(name: string, before: string | null, after: string | null): void {
    if (name === 'mood' && before !== after) this.moodAt = performance.now();
    if (name === 'size') this.setup();
  }

  private play(): void {
    if (this.frame) return;
    const loop = (t: number): void => {
      this.frame = requestAnimationFrame(loop);
      this.draw(t);
    };
    this.frame = requestAnimationFrame(loop);
  }

  private pause(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private setup(): void {
    if (!this.canvas) return;
    this.size = Number(this.getAttribute('size')) || 48;
    this.ratio = Math.min(3, devicePixelRatio || 1);
    this.canvas.width = Math.round(this.size * this.ratio);
    this.canvas.height = Math.round(this.size * this.ratio);
    this.canvas.style.width = `${this.size}px`;
    this.canvas.style.height = `${this.size}px`;
    this.context = this.canvas.getContext('2d');
    this.draw(performance.now());
  }

  private draw(t: number): void {
    const c = this.context;
    if (!c) return;
    const s = this.size;
    c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    c.clearRect(0, 0, s, s);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const asked = this.getAttribute('mood') as Mood | null;
    const mood = asked && moods.includes(asked) ? asked : 'calm';
    const fr = makeFrame(s, (t - this.born) / 1000, (t - this.moodAt) / 1000, mood, this.seed);
    drawShadow(c, fr);
    c.save();
    c.translate(fr.cx, fr.cy + fr.ry);
    c.rotate(fr.tilt);
    c.translate(-fr.cx, -(fr.cy + fr.ry));
    drawFigure(c, fr);
    drawFace(c, fr);
    c.restore();
    drawExtras(c, fr);
  }
}

/** Makes `<dusk-buddy>` draw. Safe to call more than once. */
export function defineCompanion(): void {
  if (!customElements.get('dusk-buddy')) customElements.define('dusk-buddy', DuskBuddy);
}
