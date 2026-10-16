import { Text, View } from 'react-native';

import type { CategoryRow, KeypadKey } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { Keypad } from '../../ui/keypad';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, tabular } from '../../ui/type/fonts';

/** Market mode's flat half: what is being typed with Add beside it, the categories, the keypad. */
export function MarketKeys({
  typed,
  ready,
  onAdd,
  chips,
  picked,
  onPick,
  onKey,
}: {
  readonly typed: string;
  readonly ready: boolean;
  readonly onAdd: () => void;
  readonly chips: readonly CategoryRow[];
  readonly picked: string;
  readonly onPick: (id: string) => void;
  readonly onKey: (key: KeypadKey) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            flex: 1,
            ...leading(display(54, 500, -0.03), 54, true),
            ...tabular,
            color: palette.ink,
            opacity: ready ? 1 : 0.35,
          }}
        >
          {typed}
        </Text>
        <PressScale
          accessibilityRole="button"
          onPress={onAdd}
          disabled={!ready}
          style={{
            height: 58,
            paddingHorizontal: 26,
            borderRadius: 99,
            backgroundColor: palette.accent,
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,.45)',
            boxShadow: `0 10px 26px ${palette.accentGlow}, inset 0 1px 0 rgba(255,255,255,.5)`,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: ready ? 1 : 0.5,
          }}
        >
          <Symbol name="add" size={22} color={palette.accentFg} />
          <Text style={{ ...body(17, 700), color: palette.accentFg }}>{t('duo.market.add')}</Text>
        </PressScale>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {chips.map((c) => {
          const on = c.id === picked;
          return (
            <PressScale
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                haptics.tick();
                onPick(c.id);
              }}
              style={{
                height: 40,
                paddingLeft: 11,
                paddingRight: 14,
                borderRadius: 99,
                backgroundColor: on ? palette.btnBg : palette.chipBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Symbol
                name={isSymbolName(c.icon) ? c.icon : 'payments'}
                size={18}
                fill={1}
                color={on ? palette.btnFg : palette.ink}
              />
              <Text
                numberOfLines={1}
                style={{ ...body(14, 650), color: on ? palette.btnFg : palette.ink }}
              >
                {c.name}
              </Text>
            </PressScale>
          );
        })}
      </View>
      <View style={{ flex: 1 }}>
        <Keypad onPress={onKey} keyBg={palette.cell} />
      </View>
    </>
  );
}
