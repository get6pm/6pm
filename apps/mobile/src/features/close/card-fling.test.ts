import { describe, expect, it } from '@jest/globals';

import { cardFling } from './card-fling';

describe('cardFling', () => {
  it('keeps a card dragged far right, edits one dragged far left', () => {
    expect(cardFling(120, 10, 0, 0)).toBe('kept');
    expect(cardFling(-120, 10, 0, 0)).toBe('edit');
  });

  it('commits a short quick flick and not a slow drag of the same length', () => {
    expect(cardFling(30, 0, 900, 0)).toBe('kept');
    expect(cardFling(30, 0, 40, 0)).toBeNull();
  });

  it('lets a card dragged out and brought back go home', () => {
    expect(cardFling(100, 0, -200, 0)).toBeNull();
  });

  it('reads a mostly-downward drag as not mine even when it drifts right', () => {
    expect(cardFling(95, 200, 0, 0)).toBe('notMine');
    expect(cardFling(60, 40, 200, 1200)).toBe('notMine');
  });

  it('sends an upward fling home', () => {
    expect(cardFling(20, -60, 0, -1500)).toBeNull();
  });
});
