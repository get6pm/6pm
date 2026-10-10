import { BlurView } from 'expo-blur';
import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { body, display } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { closeReminderText } from './close-reminder';
import { CLOSE_HOURS, CLOSE_MINUTES } from './onboarding-maths';
import { DEMO, type OnboardingPalette } from './onboarding-palette';
import { StepHeading } from './step-parts';

/** When should your day close: hour and minute wheels, and the reminder it will send. */
export function StepCloseTime({
  pal,
  closeAt,
  onCloseAt,
}: {
  readonly pal: OnboardingPalette;
  /** 'HH:MM'. */
  readonly closeAt: string;
  readonly onCloseAt: (closeAt: string) => void;
}) {
  const { t, language } = useI18n();
  const hour = closeAt.slice(0, 2);
  const minute = closeAt.slice(3);
  const hourIndex = Math.max(0, CLOSE_HOURS.indexOf(hour));
  const minuteIndex = Math.max(0, CLOSE_MINUTES.indexOf(minute));
  const at = (h: number, m: number) =>
    onCloseAt(`${CLOSE_HOURS[h] ?? hour}:${CLOSE_MINUTES[m] ?? minute}`);
  return (
    <View style={{ flex: 1, gap: 14 }}>
      <StepHeading title={t('onboarding.close.title')} sub={t('onboarding.close.sub')} pal={pal} />
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            top: '50%',
            height: 72,
            marginTop: -36,
            borderRadius: 22,
            backgroundColor: pal.cell,
            boxShadow: pal.cardShadow,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Wheel
            items={CLOSE_HOURS}
            index={hourIndex}
            onChange={(k) => at(k, minuteIndex)}
            size={52}
            align="flex-end"
            ink={pal.ink}
            width={80}
            label={t('onboarding.close.hour')}
          />
          <Text
            style={{
              ...display(52, 600, -0.04),
              color: pal.ink,
              paddingHorizontal: 2,
              paddingBottom: 6,
            }}
          >
            :
          </Text>
          <Wheel
            items={CLOSE_MINUTES}
            index={minuteIndex}
            onChange={(k) => at(hourIndex, k)}
            size={52}
            align="flex-start"
            ink={pal.ink}
            width={80}
            label={t('onboarding.close.minute')}
          />
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <Text
        style={{
          ...body(12, 600, 0.05),
          textTransform: 'uppercase',
          paddingHorizontal: 6,
          color: pal.inkSoft,
        }}
      >
        {t('onboarding.close.youGet', { time: closeAt })}
      </Text>
      <View style={{ borderRadius: 24, overflow: 'hidden' }}>
        <BlurView intensity={30} style={{ position: 'absolute', inset: 0 }} />
        <View
          style={{
            backgroundColor: pal.notifBg,
            paddingVertical: 12,
            paddingHorizontal: 14,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              experimental_backgroundImage: DEMO.appIcon,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <View style={{ marginBottom: -3 }}>
              <Companion size={33} mood="calm" />
            </View>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...body(14, 650), color: pal.ink }}>6pm</Text>
              <Text style={{ ...body(14), opacity: 0.6, color: pal.ink }}>
                {t('onboarding.close.now')}
              </Text>
            </View>
            <Text style={{ ...body(15), lineHeight: 19.5, color: pal.ink }}>
              {closeReminderText(language, closeAt)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
