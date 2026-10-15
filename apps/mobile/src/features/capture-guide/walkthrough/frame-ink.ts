/**
 * The colours of the screens the guide draws. They are the other app's (iOS in light mode, Gmail on
 * the web), not 6pm's look: the drawing has to read as the screen the user will see, whatever look
 * 6pm wears around it.
 */
export const iosInk = {
  /** systemBackground, secondarySystemGroupedBackground. */
  bg: '#FFFFFF',
  /** systemGroupedBackground. */
  grouped: '#F2F2F7',
  label: '#000000',
  secondary: 'rgba(60,60,67,0.6)',
  tertiary: 'rgba(60,60,67,0.3)',
  separator: 'rgba(60,60,67,0.18)',
  fill: 'rgba(120,120,128,0.12)',
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  pink: '#FF2D55',
  purple: '#AF52DE',
  indigo: '#5856D6',
  teal: '#30B0C7',
  switchOff: '#E9E9EA',
  /** The device around the screen. */
  bezel: '#1C1C1E',
  bezelEdge: '#3A3A3C',
  /** A tap mark: a soft grey disc with a white rim, as screen recordings show touches. */
  touch: 'rgba(60,60,67,0.32)',
  touchRim: 'rgba(255,255,255,0.9)',
  /** A variable token's tint in the Shortcuts editor. */
  tokenBg: 'rgba(0,122,255,0.12)',
  /** A dimmed page under a sheet. */
  dim: 'rgba(0,0,0,0.22)',
  shadow: '0 6px 24px rgba(0,0,0,0.14)',
  /** The Shortcuts app's own gradient tile colours. */
  shortcutsA: '#E5397B',
  shortcutsB: '#3D6BF2',
  /** The published 6pm shortcut's tile, behind Shortcuts' default layers glyph. */
  logTile: '#E8676E',
  /** Wallet card faces in the card picker. */
  cardA: '#1F2A44',
  cardB: '#C8A2C8',
} as const;

/** Gmail on the web. */
export const gmailInk = {
  bg: '#F6F8FC',
  surface: '#FFFFFF',
  label: '#1F1F1F',
  secondary: '#444746',
  line: '#E1E3E1',
  blue: '#0B57D0',
  blueSoft: '#D3E3FD',
  search: '#E9EEF6',
  red: '#EA4335',
  yellow: '#FBBC04',
  green: '#34A853',
  chrome: '#DEE1E6',
} as const;

/** The other apps the steps pass through: a bank's receipt and its accent. */
export const bankInk = {
  header: '#1E4FD8',
  success: '#16A34A',
} as const;
