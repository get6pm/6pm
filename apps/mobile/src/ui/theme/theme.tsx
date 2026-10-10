import { createContext, use, useMemo, type ReactNode } from 'react';

import { DEFAULT_LOOK, paletteFor, type LookConfig, type LookId, type Palette } from '@6pm/theme';

import { useClock } from './clock';

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
 */
export function ThemeProvider({
  look = DEFAULT_LOOK,
  config,
  serious = false,
  children,
}: ThemeProviderProps) {
  const { hour } = useClock();
  const theme = useMemo<Theme>(
    () => ({
      look,
      serious,
      palette: paletteFor({ look, hour, serious, ...(config ? { config } : {}) }),
    }),
    [look, config, serious, hour],
  );
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme needs a ThemeProvider above it');
  return theme;
}
