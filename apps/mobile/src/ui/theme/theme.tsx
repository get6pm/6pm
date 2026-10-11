import { createContext, use, useMemo, useRef, type ReactNode } from 'react';

import { DEFAULT_LOOK, paletteFor, type LookConfig, type LookId, type Palette } from '@6pm/theme';

import { setDisplayFont } from '../type/fonts';
import { useClock } from './clock';
import { samePalette } from './same-palette';

export interface Theme {
  readonly look: LookId;
  readonly serious: boolean;
  readonly palette: Palette;
}

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  readonly look?: LookId;
  readonly config?: Partial<LookConfig>;
  readonly serious?: boolean;
  readonly children: ReactNode;
}

/**
 * The colours of this minute: the chosen look's sky at the phone's hour, or the slate palette in
 * serious mode. Every colour on screen comes from here.
 *
 * Every screen reads this context, so a new object is handed out only when a colour really
 * changed. The minute tick, and a store write that re-renders the provider's parents, leave the
 * theme object alone whenever the palette comes out the same, and nothing below re-renders.
 */
export function ThemeProvider({
  look = DEFAULT_LOOK,
  config,
  serious = false,
  children,
}: ThemeProviderProps) {
  const { hour } = useClock();
  const kept = useRef<Theme | null>(null);
  const theme = useMemo<Theme>(() => {
    const palette = paletteFor({ look, hour, serious, ...(config ? { config } : {}) });
    const previous = kept.current;
    if (
      previous &&
      previous.look === look &&
      previous.serious === serious &&
      samePalette(previous.palette, palette)
    ) {
      return previous;
    }
    // Before any child renders, so display text below is drawn in this look's face.
    setDisplayFont(palette.dispFont);
    return { look, serious, palette };
  }, [look, config, serious, hour]);
  kept.current = theme;
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme needs a ThemeProvider above it');
  return theme;
}
