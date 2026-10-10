import { memo, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { categoryTile, oklchSrgbHex } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { ICON_PACKS, type IconPack } from './icon-packs';

const COLUMNS = 6;

/** One icon in the grid; the chosen one lifts into the category's own tile, fading over 0.2 s. */
function IconCell({
  icon,
  packHue,
  hue,
  selected,
  locked,
  lockedLabel,
  onPick,
}: {
  readonly icon: SymbolName;
  readonly packHue: number;
  readonly hue: number;
  readonly selected: boolean;
  readonly locked: boolean;
  readonly lockedLabel: string;
  readonly onPick: (icon: SymbolName) => void;
}) {
  const { palette } = useTheme();
  const on = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [on, selected]);
  const lift = useAnimatedStyle(() => ({ opacity: on.value }));
  const spoken = icon.replaceAll('_', ' ');
  const tile = categoryTile(hue);
  const bg = palette.dark ? oklchSrgbHex(0.3, 0.035, packHue) : oklchSrgbHex(0.955, 0.022, packHue);
  const fg = palette.dark ? oklchSrgbHex(0.86, 0.08, packHue) : oklchSrgbHex(0.46, 0.11, packHue);
  const glyph = (color: string) => (
    <Symbol
      name={icon}
      size={23}
      fill={1}
      weight={500}
      color={color}
      style={{ opacity: locked ? 0.38 : 1 }}
    />
  );
  return (
    <PressScale
      scaleTo={0.92}
      disabled={locked}
      onPress={() => {
        haptics.tick();
        onPick(icon);
      }}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${spoken} · ${lockedLabel}` : spoken}
      accessibilityState={{ selected, disabled: locked }}
      style={{
        flex: 1,
        height: 46,
        borderRadius: 14,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph(fg)}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            inset: 0,
            borderRadius: 14,
            experimental_backgroundImage: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
            boxShadow: '0 4px 10px rgba(30,10,40,.18)',
            alignItems: 'center',
            justifyContent: 'center',
          },
          lift,
        ]}
      >
        {glyph(tile.glyph)}
      </Animated.View>
      {locked ? (
        <Symbol
          name="lock"
          size={11}
          fill={1}
          color={fg}
          style={{ position: 'absolute', right: 4, bottom: 4, opacity: 0.6 }}
        />
      ) : null}
    </PressScale>
  );
}

function PackHeader({ pack, locked }: { readonly pack: IconPack; readonly locked: boolean }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: oklchSrgbHex(0.72, 0.13, pack.hue),
        }}
      />
      <Text style={{ flex: 1, ...body(13.5, 650), color: palette.ink }}>{t(pack.name)}</Text>
      <Text style={{ ...body(12), color: palette.inkSoft }}>
        {pack.free ? t('categories.pack.free', { count: pack.icons.length }) : pack.icons.length}
      </Text>
      {locked ? (
        <View
          style={{
            height: 20,
            paddingLeft: 5,
            paddingRight: 7,
            borderRadius: 6,
            backgroundColor: palette.ink,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Symbol name="lock" size={12} fill={1} color={palette.sheetSolid} />
          <Text style={{ ...body(10, 800, 0.1), color: palette.sheetSolid }}>
            {t('categories.pack.max')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The editor's icon grid: every pack, six to a row, in a well that scrolls on its own. Packs that
 * come with 6pm Max show locked until it is owned.
 */
export const IconPicker = memo(function IconPicker({
  icon,
  hue,
  onPick,
}: {
  readonly icon: string;
  readonly hue: number;
  readonly onPick: (icon: SymbolName) => void;
}) {
  const { t } = useI18n();
  const lockedLabel = t('categories.edit.locked');
  return (
    <ScrollView
      style={{ maxHeight: 292 }}
      contentContainerStyle={{ gap: 16, padding: 2 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {ICON_PACKS.map((pack) => {
        const locked = !pack.free;
        const rows: SymbolName[][] = [];
        for (let i = 0; i < pack.icons.length; i += COLUMNS) {
          rows.push(pack.icons.slice(i, i + COLUMNS));
        }
        return (
          <View key={pack.name} style={{ gap: 8 }}>
            <PackHeader pack={pack} locked={locked} />
            {rows.map((row) => (
              <View key={row[0]} style={{ flexDirection: 'row', gap: 6 }}>
                {row.map((name) => (
                  <IconCell
                    key={name}
                    icon={name}
                    packHue={pack.hue}
                    hue={hue}
                    selected={name === icon}
                    locked={locked}
                    lockedLabel={lockedLabel}
                    onPick={onPick}
                  />
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
});
