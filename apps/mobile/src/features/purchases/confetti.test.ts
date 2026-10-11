import { describe, expect, it } from '@jest/globals';

import { confettiPieces } from './confetti';

describe('confettiPieces', () => {
  it('makes the same 42 pieces every time, inside the design’s ranges', () => {
    const pieces = confettiPieces();
    expect(pieces).toHaveLength(42);
    expect(confettiPieces()).toEqual(pieces);
    for (const piece of pieces) {
      expect(piece.left).toBeGreaterThanOrEqual(0);
      expect(piece.left).toBeLessThanOrEqual(100);
      expect(piece.width).toBeGreaterThanOrEqual(5);
      expect(piece.width).toBeLessThanOrEqual(10);
      expect(piece.height).toBeGreaterThanOrEqual(9);
      expect(piece.height).toBeLessThanOrEqual(17);
      expect(piece.seconds).toBeGreaterThanOrEqual(2.4);
      expect(piece.seconds).toBeLessThanOrEqual(4.2);
      expect(piece.delaySeconds).toBeLessThanOrEqual(0.9);
    }
  });
});
