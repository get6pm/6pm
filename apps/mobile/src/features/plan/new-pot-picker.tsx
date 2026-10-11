import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { categoryTile } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { swatch } from './plan-colours';

/** The icons a pot can wear, and the hues of the colour row (the prototype's `PI` and `HU`). */
export const POT_ICONS = [
  'celebration',
  'cake',
  'flight',
  'favorite',
  'smartphone',
  'landscape',
  'school',
  'directions_car',
  'home',
  'pets',
  'laptop_mac',
  'child_care',
] as const satisfies readonly SymbolName[];
export const POT_HUES = [25, 50, 85, 140, 200, 245, 300, 350] as const;

export interface PotDraft {
  readonly name: string;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly goal: number;
  /** Months ahead it is needed by; 0 for no date. */
  readonly ahead: number;
}

/** Starting points: a name, an icon, a hue, a goal and how many months ahead. */
export const POT_TEMPLATES = [
  { key: 'plan.pot.tpl.birthday', icon: 'cake', hue: 330, goal: 1_000_000, ahead: 2 },
  { key: 'plan.pot.tpl.trip', icon: 'flight', hue: 200, goal: 5_000_000, ahead: 5 },
  { key: 'plan.pot.tpl.phone', icon: 'smartphone', hue: 260, goal: 8_000_000, ahead: 8 },
  { key: 'plan.pot.tpl.wedding', icon: 'favorite', hue: 350, goal: 1_000_000, ahead: 1 },
  { key: 'plan.pot.tpl.course', icon: 'school', hue: 140, goal: 3_000_000, ahead: 3 },
] as const satisfies readonly {
  key: string;
  icon: SymbolName;
  hue: number;
  goal: number;
  ahead: number;
}[];

/** The icon grid and colour row that open under the big tile. */
export function PotIconPicker({
  draft,
  onChange,
}: {
  readonly draft: Pick<PotDraft, 'icon' | 'hue'>;
  readonly onChange: (patch: Partial<Pick<PotDraft, 'icon' | 'hue'>>) => void;
}) {
  const { palette } = useTheme();
  const tile = categoryTile(draft.hue);
  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      style={{ gap: 14, padding: 14, borderRadius: 22, backgroundColor: palette.cell }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {POT_ICONS.map((icon) => {
          const on = icon === draft.icon;
          return (
            <PressScale
              key={icon}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                haptics.tick();
                onChange({ icon });
              }}
              style={{
                width: '15.1%',
                flexGrow: 1,
                height: 42,
                borderRadius: 13,
                alignItems: 'center',
                justifyContent: 'center',
                ...(on
                  ? {
                      experimental_backgroundImage: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
                      boxShadow: '0 4px 10px rgba(30,10,40,.18)',
                    }
                  : {}),
              }}
            >
              <Symbol
                name={icon}
                size={22}
                fill={1}
                weight={500}
                color={on ? tile.glyph : palette.ink}
              />
            </PressScale>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        {POT_HUES.map((hue) => (
          <PressScale
            key={hue}
            accessibilityRole="button"
            accessibilityState={{ selected: hue === draft.hue }}
            onPress={() => {
              haptics.tick();
              onChange({ hue });
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: swatch(hue),
              boxShadow:
                hue === draft.hue
                  ? `0 0 0 2.5px ${palette.sheetSolid}, 0 0 0 4.5px ${palette.ink}`
                  : undefined,
            }}
          >
            <View />
          </PressScale>
        ))}
      </View>
    </Animated.View>
  );
}

/** Template chips, shown until the pot has a name. */
export function PotTemplates({ onPick }: { readonly onPick: (draft: PotDraft) => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        marginTop: -6,
      }}
    >
      {POT_TEMPLATES.map((tpl) => (
        <PressScale
          key={tpl.key}
          accessibilityRole="button"
          onPress={() => {
            haptics.tick();
            onPick({
              name: t(tpl.key),
              icon: tpl.icon,
              hue: tpl.hue,
              goal: tpl.goal,
              ahead: tpl.ahead,
            });
          }}
          style={{
            height: 32,
            paddingLeft: 9,
            paddingRight: 12,
            borderRadius: 99,
            backgroundColor: palette.chipBg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Symbol name={tpl.icon} size={16} fill={1} color={palette.ink} />
          <Text style={{ ...body(13, 600), color: palette.ink }}>{t(tpl.key)}</Text>
        </PressScale>
      ))}
    </View>
  );
}

/** A 36 pt round control: − and + on a chip, or a bare chevron. */
export function RoundButton({
  icon,
  label,
  onPress,
  filled,
  dim,
}: {
  readonly icon: SymbolName;
  readonly label: string;
  readonly onPress: () => void;
  readonly filled: boolean;
  readonly dim?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: filled ? palette.chipBg : 'transparent',
        opacity: dim ? 0.3 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={icon} size={filled ? 20 : 22} color={palette.ink} />
    </PressScale>
  );
}
