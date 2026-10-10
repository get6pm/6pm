import { Text, View } from 'react-native';

import { Companion } from '../../ui/companion/companion';
import { haptics } from '../../ui/haptics';
import { Switch } from '../../ui/primitives/switch';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display } from '../../ui/type/fonts';
import { useI18n } from '../../i18n/i18n';
import type { PlanSettings } from '../../data/plan-settings';

const PERSONAS = ['soft', 'cheeky', 'roast'] as const;

/**
 * The companion in Settings: it waves and says its idle line in the chosen voice, so picking Soft,
 * Cheeky or Roast is heard before it is kept. Serious mode turns it plain, and the sky with it.
 */
export function CompanionCard({
  persona,
  serious,
  onPersona,
  onSerious,
}: {
  readonly persona: PlanSettings['persona'];
  readonly serious: boolean;
  readonly onPersona: (persona: PlanSettings['persona']) => void;
  readonly onSerious: (serious: boolean) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const preview = t(`companion.idle.${serious ? 'plain' : persona}`);
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Companion size={66} mood={serious ? 'plain' : 'wave'} serious={serious} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text
            style={{ ...body(12, 600, 0.05), textTransform: 'uppercase', color: palette.inkSoft }}
          >
            {t('settings.companion')}
          </Text>
          <BalancedText style={{ ...display(20, 500, -0.01), lineHeight: 24, color: palette.ink }}>
            {`“${preview}”`}
          </BalancedText>
        </View>
      </View>
      <View
        accessibilityRole="radiogroup"
        style={{
          flexDirection: 'row',
          padding: 3,
          borderRadius: 13,
          backgroundColor: palette.chipBg,
        }}
      >
        {PERSONAS.map((p) => {
          const on = p === persona;
          return (
            <PressScale
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                if (on) return;
                haptics.tick();
                onPersona(p);
              }}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on
                  ? palette.dark
                    ? 'rgba(255,255,255,.2)'
                    : '#fff'
                  : 'transparent',
                boxShadow: on ? '0 1px 4px rgba(0,0,0,.12)' : undefined,
              }}
            >
              <Text style={{ ...body(14, 600), color: palette.ink }}>
                {t(`settings.persona.${p}`)}
              </Text>
            </PressScale>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingTop: 14,
          borderTopWidth: 0.5,
          borderTopColor: palette.hair,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(16), color: palette.ink }}>{t('settings.serious')}</Text>
          <Text style={{ ...body(12.5), color: palette.inkSoft }}>{t('settings.seriousSub')}</Text>
        </View>
        <Switch value={serious} onChange={onSerious} accessibilityLabel={t('settings.serious')} />
      </View>
    </View>
  );
}
