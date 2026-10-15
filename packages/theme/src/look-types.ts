/** Every look in the catalogue, in the order the Looks shop shows them. */
export const LOOK_IDS = [
  'basic',
  'golden',
  'lacquer',
  'glaze',
  'riso',
  'monsoon',
  'cafe',
  'neon',
  'expo',
  'paper',
  'lantern',
] as const;

export type LookId = (typeof LOOK_IDS)[number];

/** The default look: "The original. Film grain, lens flare and a sunset that means it." */
export const DEFAULT_LOOK: LookId = 'golden';

/**
 * A look's settings: `v` picks the variant, `k` is the intensity slider (0–100, default 70), and
 * each of the look's two effect switches is keyed by its control key (e.g. `grain`, `flare`).
 */
export interface LookConfig {
  readonly v: number;
  readonly k: number;
  readonly [control: string]: number | boolean;
}

/** One hour stop of a sky: [hour, top, middle, bottom, bloom 1, bloom 2]. */
export type SkyKeyframe = readonly [number, string, string, string, string, string];

export interface LookVariant {
  readonly name: string;
  readonly accent?: string;
  readonly dark?: number;
  readonly K: readonly SkyKeyframe[];
  readonly sw?: readonly string[];
  readonly [extra: string]: unknown;
}

export interface LookControl {
  readonly key: string;
  readonly label: string;
  readonly sub: string;
  readonly def: boolean;
  /** The switch drives the scene from the phone's motion (tilt, stillness). */
  readonly sensor?: boolean;
}

export interface LookDefinition {
  readonly id: LookId;
  readonly name: string;
  readonly tag: string;
  /** Price in đồng; 0 is free. */
  readonly price: number;
  readonly tier?: 'premium';
  /** The hour from which the look turns dark (99 never, 0 always). */
  readonly dark: number;
  /** CSS font stack of the display face. */
  readonly font: string;
  /** CSS font stack of the interface face; unset is the system face (SF Pro). */
  readonly ui?: string;
  /** Name of the intensity slider ("Atmosphere", "Ink", …). */
  readonly kName: string;
  readonly accent?: string;
  readonly feats?: readonly string[];
  readonly ctl: readonly LookControl[];
  readonly variants: readonly LookVariant[];
}

/**
 * Colour tokens for one frame. Colours are CSS colour strings (hex or rgba); `sky`, `skyDeep` and
 * `pageBg` are CSS gradient strings and the shadows are CSS box-shadow strings, all of which React
 * Native renders natively (`backgroundImage`, `boxShadow`).
 */
export interface Palette {
  /** The five interpolated sky colours: top, middle, bottom, bloom 1, bloom 2. */
  readonly st: readonly [string, string, string, string, string];
  readonly dark: boolean;
  readonly b1: string;
  readonly b2: string;
  readonly edgeTop: string;
  readonly sky: string;
  readonly skyDeep: string;
  readonly pageBg: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly glass: string;
  readonly glassBorder: string;
  readonly glassShadow: string;
  readonly sheet: string;
  readonly sheetSolid: string;
  readonly cell: string;
  readonly cardShadow: string;
  readonly hair: string;
  readonly chipBg: string;
  readonly tabActive: string;
  readonly btnBg: string;
  readonly btnFg: string;
  readonly bubbleBg: string;
  readonly bubbleFg: string;
  readonly accent: string;
  readonly dispFont: string;
  /** CSS font stack of the interface face. */
  readonly uiFont: string;
  readonly textGlow: string;
  /** Ink on an accent fill (the FAB, the lit close button, the inbox badge). */
  readonly accentFg: string;
  /** The coloured shadow under an accent fill. */
  readonly accentGlow: string;
  /** The hero number's text shadow, size (CSS px) and font variation settings. */
  readonly heroGlow: string;
  readonly heroSize: string;
  readonly heroVar: string;
  /** Scale for the display-face amounts, so a wide face fits where a narrow one was drawn. */
  readonly numK: number;
  readonly [override: string]: unknown;
}

/** State the prototype's look methods read through `this`. */
export interface PrototypeLookState {
  state: {
    theme?: LookId;
    tryOn?: LookId | null;
    tcfg?: Partial<Record<LookId, Partial<LookConfig>>>;
    /** The tab on show: some scenes (Cà Phê's cup) draw on Today only. */
    tab?: string;
    /** Whether today is closed: Neon Alley's sign reads đóng cửa once it is. */
    closed?: boolean;
  };
  props: { theme?: string; bare?: boolean };
}

/** The prototype's methods, as extracted. `this` is a `PrototypeLookState` plus these methods. */
export interface PrototypeLookMethods {
  hex(h: string): [number, number, number];
  mix(a: string, b: string, t: number): string;
  palette(hour: number, serious: boolean, tid?: LookId): Palette;
  themes(): Record<LookId, LookDefinition>;
  cfgOf(id: LookId): LookConfig;
  themeOf(tid?: LookId): { T: LookDefinition; V: LookVariant; cfg: LookConfig };
  swOf(variant: LookVariant): readonly string[];
  atm(
    palette: Palette,
    hour: number,
    serious: boolean,
    sunOpacity: number,
  ): Record<string, unknown>;
  sunFx(sun: Record<string, unknown>, palette: Palette, hour: number, serious: boolean): void;
  sig(look: LookDefinition, variant: LookVariant, st: Palette['st'], hour: number): unknown[];
  iconPacks(): unknown;
  [method: string]: unknown;
}
