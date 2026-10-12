import { oklchSrgbHex } from './oklch';

/**
 * Inks the Plan and Diary draw with outside any look: receipts, stamps and zines are paper, so
 * they keep the same colours in every look and at every hour, as the prototype draws them.
 */
export const paperInk = {
  sheet: '#fbf7ef',
  ink: '#2b2530',
  soft: 'rgba(43,37,48,.5)',
  rule: 'rgba(43,37,48,.35)',
  hand: '#4a3550',
  stamp: '#c0443a',
} as const;

export const zineInk = {
  ink: '#2a1424',
  light: '#fbf4ec',
  stamp: '#b5433a',
  track: 'rgba(42,20,36,.12)',
  grabber: 'rgba(42,20,36,.3)',
  noteBg: oklchSrgbHex(0.94, 0.08, 95),
  noteInk: '#3a2a40',
  switchOn: oklchSrgbHex(0.62, 0.15, 150),
  switchOff: 'rgba(42,20,36,.2)',
  /** The switch knob on a zine's share card. */
  knob: '#ffffff',
} as const;

/** The year book on the Diary shelf: dark cloth, gold lettering. */
export const yearBookInk = {
  cloth: '#1f1b26',
  light: '#f6efe6',
  gold: '#e6c27a',
  soft: 'rgba(246,239,230,.65)',
  badgeInk: '#16131c',
} as const;

/** The Plan tab's fixed inks: the payday marker, the bills colour and the warn tone. */
export const planInk = {
  /** Ink on the accent (the payday marker), as on the scan button. */
  onAccent: '#2a1424',
  bills: { dark: '#b7a5d8', light: '#6d5a8f' },
  /** Overdue and "behind" text, and the recap's highlighted words. */
  warn: { dark: '#ffbe8a', light: '#9a4f1c' },
  recapWord: { dark: '#ffbe8a', light: '#b8622a' },
  /** The browser range track the prototype's what-if slider draws on. */
  trackFill: { dark: '#3b3b3b', light: '#efefef' },
  trackEdge: { dark: '#858585', light: '#767676' },
} as const;

/**
 * The Live Activity and the Lock Screen ring, drawn by iOS over any wallpaper and in the black
 * Dynamic Island: white ink at the prototype's strengths and the banner's dark glass, the same in
 * every look (`SS:44-64`, `SS:141-156`).
 */
export const activityInk = {
  banner: 'rgba(20,12,30,.55)',
  ink: '#ffffff',
  caption: 'rgba(255,255,255,.55)',
  soft: 'rgba(255,255,255,.6)',
  track: 'rgba(255,255,255,.15)',
  ringTrack: 'rgba(255,255,255,.22)',
} as const;

/**
 * The share extension's card (`SS:188-215`): a light sheet over whatever app shared the receipt,
 * the same at every hour and in every look.
 */
export const shareCardInk = {
  sheet: 'rgba(251,248,243,.96)',
  ink: '#1f1a28',
  soft: 'rgba(31,26,40,.6)',
  hair: 'rgba(31,26,40,.08)',
  grabber: 'rgba(31,26,40,.25)',
  editBg: 'rgba(31,26,40,.07)',
  rows: '#ffffff',
  confirmFg: '#fbf3ea',
  /** The "not sure" chip around the payee: dashed edge, warm fill, help glyph. */
  unsureEdge: '#d88a3c',
  unsureFill: oklchSrgbHex(0.95, 0.04, 70),
  unsureGlyph: '#b8622a',
  unsureText: '#9a4f1c',
  /** The sheet's shadow and the dim over the sharing app. */
  shadow: 'rgba(10,5,20,.25)',
  scrim: 'rgba(10,6,18,.28)',
} as const;
