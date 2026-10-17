import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import type { LookControl, LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import type { LookCopy } from './look-copy';

/** The try-on's top row: "‹ Looks", the look's place in the shop, previous and next (`App:972-978`). */
export function DetailHeader({
  position,
  onBack,
  onStep,
}: {
  readonly position: { readonly index: number; readonly total: number };
  readonly onBack: () => void;
  readonly onStep: (step: 1 | -1) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={{
        paddingTop: 14,
        paddingRight: 14,
        paddingLeft: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <PressScale
        accessibilityRole="button"
        onPress={onBack}
        hitSlop={8}
        style={{
          height: 34,
          paddingLeft: 4,
          paddingRight: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Symbol name="chevron_left" size={24} color={palette.ink} />
        <Text style={{ ...body(15, 500), color: palette.ink }}>{t('look.back')}</Text>
      </PressScale>
      <Text
        numberOfLines={1}
        style={{
          ...body(13, 600),
          flex: 1,
          textAlign: 'center',
          color: palette.inkSoft,
          fontVariant: ['tabular-nums'],
        }}
      >
        {t('look.position', position)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {([-1, 1] as const).map((step) => (
          <PressScale
            key={step}
            accessibilityRole="button"
            accessibilityLabel={step === -1 ? t('look.previous') : t('look.next')}
            scaleTo={0.92}
            onPress={() => {
              haptics.tick();
              onStep(step);
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: palette.chipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol
              name={step === -1 ? 'chevron_left' : 'chevron_right'}
              size={20}
              color={palette.ink}
            />
          </PressScale>
        ))}
      </View>
    </View>
  );
}

/** The look's effects as chips that fill when on (`App:1004-1008`). */
export function EffectChips({
  look,
  controls,
  values,
  copy,
  onToggle,
}: {
  readonly look: LookId;
  readonly controls: readonly LookControl[];
  readonly values: Readonly<Record<string, number | boolean>>;
  readonly copy: LookCopy;
  readonly onToggle: (key: string, on: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -18, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}
    >
      {controls.map((x) => {
        const on = values[x.key] === true;
        const label = copy.controlLabel(look, x);
        return (
          <PressScale
            key={x.key}
            accessibilityRole="switch"
            accessibilityState={{ checked: on }}
            accessibilityLabel={label}
            accessibilityHint={copy.controlSub(look, x)}
            scaleTo={0.97}
            inScroll
            onPress={() => {
              haptics.tick();
              onToggle(x.key, !on);
            }}
            style={{
              height: 38,
              paddingLeft: 10,
              paddingRight: 13,
              borderRadius: 99,
              backgroundColor: on ? palette.btnBg : palette.chipBg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Symbol
              name={on ? 'check' : 'add'}
              size={17}
              color={on ? palette.btnFg : palette.ink}
            />
            <Text style={{ ...body(13.5, 650), color: on ? palette.btnFg : palette.ink }}>
              {label}
            </Text>
          </PressScale>
        );
      })}
    </ScrollView>
  );
}
