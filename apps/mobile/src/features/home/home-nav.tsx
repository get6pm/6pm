import { createContext, use, type ReactNode } from 'react';
import { type SharedValue } from 'react-native-reanimated';

import type { HomeTab } from './home-tabs';

/** What the pages and bars inside Home can ask of the tab surface. */
export interface HomeNav {
  /**
   * The tab on screen as an index into `HOME_TABS` (0 Today, 1 Plan, 2 Diary), switched on the UI
   * thread the moment a slide starts. Read it in a worklet, or derive from it, to start or stop
   * work for a page without a React render.
   */
  readonly tabIndex: SharedValue<number>;
  /** Slides to a tab, as tapping its button does. Stable, and safe to call from any callback. */
  readonly goToTab: (tab: HomeTab) => void;
}

const HomeNavContext = createContext<HomeNav | null>(null);

export function HomeNavProvider({
  value,
  children,
}: {
  readonly value: HomeNav;
  readonly children: ReactNode;
}) {
  return <HomeNavContext value={value}>{children}</HomeNavContext>;
}

export function useHomeNav(): HomeNav {
  const value = use(HomeNavContext);
  if (!value) throw new Error('useHomeNav needs a HomeShell above it');
  return value;
}
