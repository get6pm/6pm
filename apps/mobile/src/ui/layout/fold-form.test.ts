import { describe, expect, it } from '@jest/globals';

import type { FoldSnapshot } from '../../../modules/fold';
import { foldForm } from './fold-form';

// Readings from the iPhone Duo simulator (iOS 27.1) in each pose.
const outer = { width: 466, height: 678 };
const sideways = { width: 951, height: 669 };
const upright = { width: 669, height: 951 };
const island = { x: 382, y: 0, width: 84, height: 174 };
const camera = { x: 867, y: 0, width: 84, height: 124 };
const uprightCamera = { x: 585, y: 0, width: 84, height: 124 };
const uprightFold = { x: 455.5, y: 0, width: 40, height: 669 };
const acrossFold = { x: 0, y: 455.5, width: 669, height: 40 };

const snap = (s: Partial<FoldSnapshot>): FoldSnapshot => ({
  hinge: 'unknown',
  angle: null,
  divisions: [],
  occlusions: [],
  ...s,
});

describe('foldForm', () => {
  it('lays out as a phone on an iPhone without a hinge', () => {
    expect(foldForm(snap({}), { width: 402, height: 874 })).toEqual({ kind: 'phone' });
  });

  it('puts the bars in a rail beside the island on the outer screen', () => {
    const closed = snap({ hinge: 'closed', angle: 0, occlusions: [island] });
    expect(foldForm(closed, outer)).toEqual({ kind: 'rail', rail: 84 });
  });

  it('splits at the fold when held like a book', () => {
    const book = snap({
      hinge: 'partial',
      angle: 2.23,
      divisions: [uprightFold],
      occlusions: [camera],
    });
    expect(foldForm(book, sideways)).toEqual({
      kind: 'spread',
      left: { x: 0, width: 455.5 },
      right: { x: 495.5, width: 455.5 },
      rail: 84,
      book: true,
    });
  });

  it('keeps two pages when it lies flat and the fold is no longer reported', () => {
    const flat = snap({ hinge: 'open', angle: Math.PI, occlusions: [camera] });
    expect(foldForm(flat, sideways)).toEqual({
      kind: 'spread',
      left: { x: 0, width: 455.5 },
      right: { x: 495.5, width: 455.5 },
      rail: 84,
      book: false,
    });
  });

  it('stands with the top half to read and the bottom half to touch', () => {
    const stand = snap({
      hinge: 'partial',
      angle: 2.23,
      divisions: [acrossFold],
      occlusions: [uprightCamera],
    });
    expect(foldForm(stand, upright)).toEqual({
      kind: 'stand',
      top: { y: 0, height: 455.5 },
      bottom: { y: 495.5, height: 455.5 },
    });
  });

  it('lays out as a phone when opened upright and flat', () => {
    const flat = snap({ hinge: 'open', angle: Math.PI, occlusions: [uprightCamera] });
    expect(foldForm(flat, upright)).toEqual({ kind: 'phone' });
  });

  it('falls back to one column when Split View leaves too little room for two pages', () => {
    const narrow = snap({ hinge: 'open', angle: Math.PI });
    expect(foldForm(narrow, { width: 600, height: 669 })).toEqual({ kind: 'phone' });
  });
});
