export interface ConfettiPiece {
  /** Left edge, percent of the screen. */
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly seconds: number;
  readonly delaySeconds: number;
}

const COLOURS = ['#ffd27a', '#ff8552', '#7af0ff', '#ff9fc0', '#b6ff9a', '#f6efe6'] as const;

/** The design's seeded generator, so the confetti falls the same way every time. */
function rng(seed: number): () => number {
  let x = seed;
  return () => (x = (x * 9301 + 49297) % 233280) / 233280;
}

/** The welcome's 42 pieces (prototype `App:2428`): where each starts, its size, colour and timing. */
export function confettiPieces(count = 42): ConfettiPiece[] {
  const next = rng(5);
  return Array.from({ length: count }, () => {
    const left = Number((next() * 100).toFixed(1));
    const width = Math.round(5 + next() * 5);
    const height = Math.round(9 + next() * 8);
    const color = COLOURS[Math.floor(next() * 6)] ?? COLOURS[0];
    const seconds = Number((2.4 + next() * 1.8).toFixed(2));
    const delaySeconds = Number((next() * 0.9).toFixed(2));
    return { left, width, height, color, seconds, delaySeconds };
  });
}
