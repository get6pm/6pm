import { oklchSrgbHex } from '@6pm/theme';

/**
 * Scan's own colours. The camera is the same at noon and at night, so Scan does not follow the
 * look: the prototype draws it in fixed inks over the feed, with a warm paper card on top.
 */
export const scanColours = {
  page: '#0a090d',
  text: '#f6efe6',
  hint: 'rgba(246,239,230,.7)',
  sub: 'rgba(246,239,230,.6)',
  glass: 'rgba(255,255,255,.12)',
  glassBorder: 'rgba(255,255,255,.2)',
  typeButton: 'rgba(255,255,255,.14)',
  frame: '#fff',
  onGlass: '#fff',
  scanGlow: 'rgba(255,133,82,.55)',
  spinnerTrack: 'rgba(255,133,82,.22)',
  handoffVeil: 'rgba(10,9,13,.88)',
  card: 'rgba(250,246,240,.94)',
  cardInk: '#1f1a28',
  cardBody: 'rgba(31,26,40,.62)',
  cardSoft: 'rgba(31,26,40,.6)',
  cardLabel: 'rgba(31,26,40,.55)',
  cardOutline: 'rgba(31,26,40,.16)',
  walletBorder: 'rgba(31,26,40,.12)',
  walletPicked: 'rgba(31,26,40,.05)',
  keyBg: 'rgba(31,26,40,.06)',
  button: '#1f1a28',
  buttonText: '#fbf3ea',
  alertTile: oklchSrgbHex(0.9, 0.06, 60),
  alertGlyph: oklchSrgbHex(0.42, 0.12, 50),
} as const;
