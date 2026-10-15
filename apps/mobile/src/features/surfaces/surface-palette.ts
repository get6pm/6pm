import {
  categoryTile,
  DEFAULT_LOOK,
  paletteFor,
  planInk,
  type LookConfig,
  type LookId,
  type Palette,
} from '@6pm/theme';

import { display } from '../../ui/type/fonts';

/** The look the widgets wear: the user's own with Max, else Golden Hour as it ships. */
export interface WidgetLook {
  readonly look: LookId;
  readonly config?: Partial<LookConfig>;
  readonly serious: boolean;
}

export function widgetLook(input: {
  readonly max: boolean;
  readonly look: LookId;
  readonly config?: Partial<LookConfig>;
  readonly serious: boolean;
}): WidgetLook {
  if (!input.max) return { look: DEFAULT_LOOK, serious: input.serious };
  return input.config
    ? { look: input.look, config: input.config, serious: input.serious }
    : { look: input.look, serious: input.serious };
}

/**
 * The colours one hour of the widgets is drawn with, named for where Swift uses them:
 * - `sky*`: the medium widget's sky (the look's three sky stops) and the ink written on it,
 * - `card*`: the small and large widgets' card, always a light sheet as the prototype draws it
 *   (the cream bubble once the sky is dark, the look's own cell while it is light),
 * - `accent`/`onAccent`: the Scan QR tile and the Paid button,
 * - `pendingInk`: the PENDING tag on a light card, `pendingInkDark` on the night card a dark Home
 *   Screen gets.
 */
export function widgetTokens(palette: Palette): Record<string, string> {
  const [skyTop, skyMid, skyBottom] = palette.st;
  return {
    skyTop,
    skyMid,
    skyBottom,
    skyInk: palette.ink,
    skyInkSoft: palette.inkSoft,
    cardBg: palette.dark ? palette.bubbleBg : palette.cell,
    cardInk: palette.dark ? palette.bubbleFg : palette.ink,
    accent: palette.accent,
    onAccent: planInk.onAccent,
    pendingInk: planInk.recapWord.light,
    pendingInkDark: planInk.recapWord.dark,
  };
}

/** One set of widget colours for each hour of the day, so a timeline can follow the sky. */
export function hourlyPalettes(
  look: WidgetLook,
): { readonly hour: number; readonly tokens: Record<string, string> }[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    tokens: widgetTokens(
      paletteFor({
        look: look.look,
        hour,
        serious: look.serious,
        ...(look.config ? { config: look.config } : {}),
      }),
    ),
  }));
}

/** The look's display face as iOS names it (the widgets bundle the same font files). */
export function displayFamily(look: WidgetLook): string {
  const palette = paletteFor({ look: look.look, hour: 12, serious: look.serious });
  return display(44, 500, 0, palette.dispFont).fontFamily ?? 'BricolageGrotesque';
}

/** A category tile's colours by hue, as `tile.<hue>.from|to|glyph` entries Swift looks up. */
export function tileColours(hues: Iterable<number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const hue of new Set(hues)) {
    const tile = categoryTile(hue);
    out[`tile.${hue}.from`] = tile.from;
    out[`tile.${hue}.to`] = tile.to;
    out[`tile.${hue}.glyph`] = tile.glyph;
  }
  return out;
}
