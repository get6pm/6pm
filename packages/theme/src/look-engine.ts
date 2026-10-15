import { prototypeLooks } from './generated/prototype-looks.generated';
import {
  DEFAULT_LOOK,
  LOOK_IDS,
  type LookConfig,
  type LookDefinition,
  type LookId,
  type Palette,
  type PrototypeLookMethods,
  type PrototypeLookState,
} from './look-types';

type Engine = PrototypeLookMethods & PrototypeLookState;

/**
 * Runs the prototype's own look logic with the chosen look injected as its state, so every colour
 * is computed exactly as the design computes it. One engine is shared: the catalogue is built once
 * and cached on it (the prototype's `_T`).
 */
const engine: Engine = Object.assign(Object.create(prototypeLooks) as PrototypeLookMethods, {
  state: {},
  props: {},
});

function select(
  look: LookId,
  config: Partial<LookConfig> | undefined,
  scene: { readonly tab?: string; readonly closed?: boolean } = {},
): Engine {
  engine.state = {
    theme: look,
    tryOn: null,
    tcfg: config ? { [look]: config } : {},
    tab: scene.tab ?? 'today',
    closed: scene.closed ?? false,
  };
  return engine;
}

export interface FrameInput {
  readonly look: LookId;
  /** The user's settings for this look; unset fields take the look's defaults. */
  readonly config?: Partial<LookConfig>;
  /** Decimal hour on the phone's clock (18:07 → 18.1166). */
  readonly hour: number;
  /** Serious mode: slate palette, no atmosphere. */
  readonly serious: boolean;
  /** The tab on show (default Today): a scene can draw on Today only. */
  readonly tab?: string;
  /** Whether today is closed (default not): a scene can mark the close. */
  readonly closed?: boolean;
}

/** The colour tokens of one frame. */
export function paletteFor(input: FrameInput): Palette {
  return select(input.look, input.config).palette(input.hour, input.serious, input.look);
}

/** The full catalogue, keyed by look. */
export function looks(): Readonly<Record<LookId, LookDefinition>> {
  return engine.themes();
}

export function lookById(id: LookId): LookDefinition {
  return looks()[id];
}

/** A look's settings with its defaults filled in. */
export function configFor(look: LookId, config?: Partial<LookConfig>): LookConfig {
  return select(look, config).cfgOf(look);
}

/** The three swatch colours a look card and variant picker show. */
export function swatchesFor(look: LookId, variantIndex: number): readonly string[] {
  const variant = lookById(look).variants[variantIndex] ?? lookById(look).variants[0];
  if (!variant) return [];
  return engine.swOf(variant);
}

/**
 * The atmosphere layers of a frame (blooms, flare, grain, rain, …) as the prototype describes them.
 * `sunOpacity` is the sun's visibility at this hour (see the sky layer).
 */
export function atmosphereFor(input: FrameInput, palette: Palette, sunOpacity: number) {
  return select(input.look, input.config, input).atm(
    palette,
    input.hour,
    input.serious,
    sunOpacity,
  );
}

/**
 * The sun as a look draws it: the look restyles the base sun (colour, glow, mask, opacity) and may
 * add a ghost sun or a thread, as the prototype's `sunFx`. The input sun is not modified.
 */
export function sunFor<S extends object>(
  input: FrameInput,
  palette: Palette,
  sun: S,
): S & Record<string, unknown> {
  const styled = { ...sun } as S & Record<string, unknown>;
  select(input.look, input.config, input).sunFx(styled, palette, input.hour, input.serious);
  return styled;
}

export function isLookId(value: unknown): value is LookId {
  return typeof value === 'string' && (LOOK_IDS as readonly string[]).includes(value);
}

/** Linear RGB-hex mix, as the prototype mixes every colour (`t` = 0 → a, 1 → b). */
export function mixHex(a: string, b: string, t: number): string {
  return engine.mix(a, b, t);
}

export { DEFAULT_LOOK };
