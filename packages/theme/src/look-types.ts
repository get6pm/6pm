/** Every look in the catalogue, in the order the Looks shop shows them. */
export const LOOK_IDS = [
  'basic',
  'golden',
  'expo',
  'paper',
  'lantern',
  'neon',
  'riso',
  'lacquer',
  'monsoon',
  'holo',
  'arcade',
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
  readonly textGlow: string;
  readonly [override: string]: unknown;
}

/** State the prototype's look methods read through `this`. */
export interface PrototypeLookState {
  state: {
    theme?: LookId;
    tryOn?: LookId | null;
    tcfg?: Partial<Record<LookId, Partial<LookConfig>>>;
  };
  props: { theme?: string };
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
