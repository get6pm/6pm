import { memo } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { useFold } from '../../ui/layout/fold';
import { GlassButton } from '../../ui/primitives/glass-button';
import type { HomeTab } from './home-tabs';
import { ScanFab } from './scan-fab';
import { TabRail } from './tab-rail';

/** Space kept between the island (or camera) and the first button under it. */
const BELOW_ISLAND = 12;

/**
 * Home's bars on the iPhone Duo, where the status bar and island run down the right edge: Add and
 * Settings under the island, the tabs and Scan at the bottom, all within the column iOS keeps
 * clear on the right, under the right thumb.
 */
export const SideRail = memo(function SideRail({
  tab,
  onSelect,
  onReselect,
  onQuickAdd,
  onSettings,
  onScan,
}: {
  readonly tab: HomeTab;
  readonly onSelect: (tab: HomeTab) => void;
  readonly onReselect: () => void;
  readonly onQuickAdd: () => void;
  readonly onSettings: () => void;
  readonly onScan: () => void;
}) {
  const { t } = useI18n();
  const { rail, bottom } = useDesignInsets();
  const { snapshot } = useFold();
  const { width } = useWindowDimensions();

  // Below whatever covers the right edge at the top: the island closed, the camera open.
  let clear = 0;
  for (const o of snapshot.occlusions) {
    if (o.x + o.width >= width - 1) clear = Math.max(clear, o.y + o.height);
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: rail,
        alignItems: 'center',
        paddingTop: clear + BELOW_ISLAND,
        paddingBottom: bottom(16),
        gap: 12,
      }}
    >
      <GlassButton icon="add" iconSize={26} label={t('home.quickAdd')} onPress={onQuickAdd} />
      <GlassButton icon="tune" label={t('home.settings')} onPress={onSettings} />
      <View style={{ flex: 1 }} pointerEvents="none" />
      <TabRail active={tab} onSelect={onSelect} onReselect={onReselect} />
      <ScanFab
        label={t('home.scan')}
        hint={t('home.scanHint')}
        onScan={onScan}
        onQuickAdd={onQuickAdd}
      />
    </View>
  );
});
