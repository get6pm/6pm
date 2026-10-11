import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { LookControl, LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { Switch } from '../../ui/primitives/switch';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import type { LookCopy } from './look-copy';

/** "Trying on Neon Noir": the pill over the live app, 288 pt down (prototype `App:916`). */
export function TryOnPill({ name }: { readonly name: string }) {
  const { t } = useI18n();
  const { top } = useDesignInsets();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: top(288),
        alignSelf: 'center',
        height: 30,
        paddingLeft: 10,
        paddingRight: 12,
        borderRadius: 99,
        backgroundColor: 'rgba(10,8,16,.55)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Symbol name="visibility" size={16} color="#ffffff" />
      <Text style={{ ...body(12.5, 650), color: '#ffffff' }}>{t('look.trying', { name })}</Text>
    </Animated.View>
  );
}

/** The sheet's top: grabber, "‹ Looks", and the look's place with previous and next (`App:920-935`). */
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
    <View style={{ paddingTop: 8, paddingHorizontal: 14, gap: 2 }}>
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: palette.inkSoft,
          opacity: 0.35,
        }}
      />
      <View
        style={{
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <PressScale
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
        >
          <Symbol name="chevron_left" size={26} color={palette.ink} style={{ marginLeft: -4 }} />
          <Text style={{ ...body(17, 500), color: palette.ink }}>{t('look.back')}</Text>
        </PressScale>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              ...body(13),
              color: palette.inkSoft,
              fontVariant: ['tabular-nums'],
              marginRight: 2,
            }}
          >
            {t('look.position', position)}
          </Text>
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
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: palette.chipBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Symbol
                name={step === -1 ? 'chevron_left' : 'chevron_right'}
                size={22}
                color={palette.ink}
              />
            </PressScale>
          ))}
        </View>
      </View>
    </View>
  );
}

/** The look's two effect switches in one card (`App:957-964`). */
export function EffectsCard({
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
    <View
      style={{
        borderRadius: 20,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        overflow: 'hidden',
      }}
    >
      {controls.map((x, i) => (
        <View key={x.key} style={{ paddingLeft: 16, paddingRight: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              borderTopWidth: i === 0 ? 0 : 0.5,
              borderTopColor: palette.hair,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ ...body(16), color: palette.ink }}>{copy.controlLabel(look, x)}</Text>
              <Text style={{ ...body(12.5), color: palette.inkSoft }}>
                {copy.controlSub(look, x)}
              </Text>
            </View>
            <Switch
              value={values[x.key] === true}
              accessibilityLabel={copy.controlLabel(look, x)}
              onChange={(next) => onToggle(x.key, next)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
