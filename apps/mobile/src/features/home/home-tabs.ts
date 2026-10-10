import type { SymbolName } from '../../ui/icons/symbols.generated';

export const HOME_TABS = ['today', 'plan', 'diary'] as const;
export type HomeTab = (typeof HOME_TABS)[number];

export const TAB_META: Record<
  HomeTab,
  { readonly icon: SymbolName; readonly label: 'tabs.today' | 'tabs.plan' | 'tabs.diary' }
> = {
  today: { icon: 'wb_twilight', label: 'tabs.today' },
  plan: { icon: 'donut_large', label: 'tabs.plan' },
  diary: { icon: 'auto_stories', label: 'tabs.diary' },
};

/** Scroll offset after which the compact top bar fades in (Today has its tall hero to clear). */
export const NAV_AFTER: Record<HomeTab, number> = { today: 250, plan: 40, diary: 40 };
