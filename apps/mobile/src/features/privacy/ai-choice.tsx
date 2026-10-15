import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { RowCheck, type PickerInks } from '../banks/bank-picker-parts';
import type { AiMode } from './ai-mode';

/** The inks these parts draw with, from whichever screen hosts them (onboarding or Settings). */
export type AiInks = PickerInks & { readonly okInk: string };

const ICONS: Readonly<Record<AiMode, SymbolName>> = { server: 'cloud', device: 'smartphone' };

/**
 * One of the two places 6pm's AI can run: its icon, name and what it means for the person, picked
 * with the accent outline and the round check the bank picker uses. The device option is shown
 * but cannot be picked on a phone without the memory for a model.
 */
export function ModeCard({
  mode,
  on,
  disabled = false,
  inks,
  onPress,
}: {
  readonly mode: AiMode;
  readonly on: boolean;
  readonly disabled?: boolean;
  readonly inks: AiInks;
  readonly onPress: () => void;
}) {
  const { t } = useI18n();
  const border = useAnimatedStyle(() => ({
    borderColor: withTiming(on ? inks.accent : inks.accentClear, { duration: 200 }),
  }));
  const text =
    mode === 'device' && disabled
      ? t('privacy.ai.device.unavailable')
      : t(mode === 'server' ? 'privacy.ai.server.text' : 'privacy.ai.device.text');
  return (
    <PressScale
      scaleTo={0.97}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled }}
    >
      <Animated.View
        style={[
          {
            borderRadius: 22,
            borderWidth: 2,
            backgroundColor: inks.cell,
            boxShadow: inks.cardShadow,
            padding: 14,
            flexDirection: 'row',
            gap: 12,
            opacity: disabled ? 0.55 : 1,
          },
          border,
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: inks.chipBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name={ICONS[mode]} size={22} color={inks.ink} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ ...body(17, 650, -0.015), color: inks.ink }}>
              {t(mode === 'server' ? 'privacy.ai.server.title' : 'privacy.ai.device.title')}
            </Text>
            {mode === 'server' ? (
              <Text
                style={{
                  ...body(11.5, 700),
                  color: inks.okInk,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 99,
                  overflow: 'hidden',
                  backgroundColor: inks.chipBg,
                }}
              >
                {t('privacy.ai.server.tag')}
              </Text>
            ) : null}
          </View>
          <Text style={{ ...body(13.5), lineHeight: 18.9, color: inks.inkSoft }}>{text}</Text>
        </View>
        <View style={{ justifyContent: 'center' }}>
          <RowCheck on={on} inks={inks} />
        </View>
      </Animated.View>
    </PressScale>
  );
}
