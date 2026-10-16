/**
 * The iPhone Duo stage: four poses (folded, open, diary, propped up), picked from the tabs or by
 * hand. Dragging sideways folds and unfolds the phone with the finger; swiping up and down moves
 * between today, the diary and the stand. Everything else animates on the compositor.
 */
const ease = 'cubic-bezier(.2,.8,.2,1)';
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
/** Where the hint finger starts on the stage, and how it moves, in each pose. */
const ghosts = [
  ['640px', 'ghostXL'],
  ['720px', 'ghostY'],
  ['160px', 'ghostX'],
  ['0px', ''],
] as const;

interface DuoState {
  pose: number;
  /** 0 folded shut, 1 flat open; in between while a finger holds it. */
  open: number;
  dragging: boolean;
  touched: boolean;
}

export function startDuo(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('[data-duo]');
  if (!section) return;
  const q = <T extends HTMLElement>(sel: string): T | null => section.querySelector<T>(sel);
  const box = q('[data-duo-box]');
  const stage = q('[data-duo-stage]');
  const body = q('[data-duo-body]');
  const hinge = q('[data-duo-hinge]');
  const ring = q('[data-duo-ring]');
  const right = q('[data-duo-right]');
  const front = q('[data-duo-front]');
  const shadeL = q('[data-duo-shade-left]');
  const shadeR = q('[data-duo-shade-right]');
  const shadeB = q('[data-duo-shade-back]');
  const glint = q('[data-duo-glint]');
  const ghost = q('[data-duo-ghost]');
  const standBox = q('[data-duo-stand-box]');
  const standTilt = q('[data-duo-stand-tilt]');
  const pages = [...section.querySelectorAll<HTMLElement>('[data-duo-pages]')];
  const tabs = [...section.querySelectorAll<HTMLButtonElement>('[data-duo-pose]')];
  const hints = [...section.querySelectorAll<HTMLElement>('[data-duo-hints]')];
  const caption = q('[data-duo-caption]');
  const captions = JSON.parse(section.dataset.duoCaptions ?? '[]') as string[];
  if (!box || !stage || !body || !hinge || !right || !front) return;

  const state: DuoState = { pose: 0, open: 0, dragging: false, touched: false };
  let zw = 1;

  const size = (): void => {
    const width = Math.min(innerWidth, 1240);
    zw = Math.min(1, (width - 48) / 969);
    const zs = Math.min(0.72, (width - 40) / 687);
    box.style.setProperty('--duo-zw', zw.toFixed(4));
    box.style.setProperty('--duo-zs', zs.toFixed(4));
    box.style.setProperty('--duo-h', `${Math.round(Math.max(780 * zw, 900 * zs) + 20)}px`);
  };

  const paint = (): void => {
    const fold = 1 - state.open;
    const drag = state.dragging;
    const motion = drag ? 'none' : `transform 1.1s ${ease}`;
    const fade = drag ? 'none' : `opacity 1.1s ${ease}`;
    const propped = state.pose === 3;
    body.style.transform = `translateX(${(-242 * fold).toFixed(1)}px) scale(${(1 + 0.12 * fold).toFixed(3)})`;
    body.style.transition = motion;
    hinge.style.transform = `rotateY(${(180 * fold).toFixed(1)}deg)`;
    hinge.style.transition = motion;
    const corner = Math.round(20 * clamp01(fold * 1.6));
    const round = Math.round(49 + 7 * fold);
    right.style.borderRadius = `${corner}px ${round}px ${round}px ${corner}px`;
    right.style.transition = drag ? 'none' : `border-radius 1.1s ${ease}`;
    const edge = '0 0 0 1px #5d5864, 0 0 0 3px #1a181e';
    right.style.boxShadow = fold < 0.04 ? 'none' : `${edge}, 0 60px 120px rgba(0,0,0,.55)`;
    front.style.boxShadow = fold < 0.04 ? 'none' : `${edge}, 0 60px 120px rgba(0,0,0,.4)`;
    for (const [el, value] of [
      [ring, fold < 0.04 ? 1 : 0],
      [shadeL, clamp01(fold * 0.9)],
      [shadeR, clamp01(fold * 1.6)],
      [shadeB, clamp01((1 - fold) * 1.6)],
    ] as const) {
      if (!el) continue;
      el.style.opacity = value.toFixed(2);
      el.style.transition = fade;
    }
    if (glint) glint.style.opacity = Math.sin(fold * Math.PI).toFixed(2);
    for (const page of pages)
      page.style.transform = state.pose === 2 ? 'translateY(-687px)' : 'none';
    stage.style.opacity = propped ? '0' : '1';
    stage.style.pointerEvents = propped ? 'none' : 'auto';
    stage.style.transform = propped ? 'rotate(-90deg) scale(.72)' : 'none';
    stage.toggleAttribute('data-dragging', drag);
    if (standBox && standTilt) {
      standBox.style.opacity = propped ? '1' : '0';
      standBox.style.pointerEvents = propped ? 'auto' : 'none';
      standTilt.style.transform = propped ? 'none' : 'rotateX(62deg) scale(.82)';
    }
    if (ghost) {
      const [left, name] = ghosts[state.pose] ?? ghosts[0];
      ghost.style.left = left;
      ghost.style.animationName = name || 'none';
      ghost.style.opacity = state.touched || propped ? '0' : '1';
    }
  };

  const pick = (pose: number, touched = true): void => {
    const changed = pose !== state.pose;
    state.pose = pose;
    state.open = pose === 0 ? 0 : 1;
    state.touched = state.touched || touched;
    tabs.forEach((t, i) => t.setAttribute('aria-pressed', String(i === pose)));
    if (changed) {
      hints.forEach((h, i) => (h.hidden = i !== pose));
      if (caption) caption.textContent = captions[pose] ?? '';
    }
    paint();
  };

  tabs.forEach((tab, i) => tab.addEventListener('click', () => pick(i)));

  // A finger on the stage: sideways folds and unfolds, up and down changes the view.
  let grab: { x: number; y: number; open: number; axis: 'x' | 'y' | null; dy: number } | null =
    null;
  const down = (event: PointerEvent): void => {
    grab = { x: event.clientX, y: event.clientY, open: state.open, axis: null, dy: 0 };
  };
  const move = (event: PointerEvent): void => {
    if (!grab) return;
    const dx = event.clientX - grab.x;
    const dy = event.clientY - grab.y;
    if (!grab.axis && Math.hypot(dx, dy) > 8) grab.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (grab.axis === 'x' && state.pose !== 3) {
      state.open = clamp01(grab.open - dx / (484 * zw));
      state.dragging = true;
      state.touched = true;
      paint();
    }
    grab.dy = dy;
  };
  const up = (): void => {
    if (!grab) return;
    const g = grab;
    grab = null;
    if (g.axis === 'x' && state.pose !== 3) {
      const open = state.open > (g.open > 0.5 ? 0.8 : 0.2) ? 1 : 0;
      state.dragging = false;
      pick(open ? (state.pose === 0 ? 1 : state.pose) : 0);
      return;
    }
    if (g.axis === 'y' && Math.abs(g.dy) > 50) {
      const d = state.pose;
      const next = g.dy < 0 ? (d === 1 ? 2 : d === 3 ? 1 : d) : d === 1 ? 3 : d === 2 ? 1 : d;
      if (next !== d) pick(next);
    }
    if (state.dragging) {
      state.dragging = false;
      paint();
    }
  };
  for (const target of [stage, standTilt]) {
    if (!target) continue;
    target.addEventListener('pointerdown', down);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }
  stage.addEventListener('pointerleave', up);

  size();
  addEventListener('resize', size);
  paint();
}
