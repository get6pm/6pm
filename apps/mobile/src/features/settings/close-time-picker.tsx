import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { useTheme } from '../../ui/theme/theme';
import { display } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { wheelRowHeight } from '../../ui/wheel/wheel-maths';
import {
  CLOSE_HOURS,
  CLOSE_MINUTES,
  closeTimeAtWheels,
  closeWheelIndexes,
} from './close-time-options';

const SIZE = 30;

/** Hour and minute wheels, the same ones onboarding sets the close time with, under their row. */
export function CloseTimePicker({
  closeAt,
  onChange,
}: {
  readonly closeAt: string;
  readonly onChange: (closeAt: string) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { hour, minute } = closeWheelIndexes(closeAt);
  const pick = (h: number, m: number) => {
    const next = closeTimeAtWheels(h, m);
    if (next !== null) onChange(next);
  };
  const rowHeight = wheelRowHeight(SIZE);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          top: '50%',
          height: rowHeight + 8,
          marginTop: -(rowHeight + 8) / 2,
          borderRadius: 14,
          backgroundColor: palette.chipBg,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Wheel
          items={CLOSE_HOURS}
          index={hour}
          onChange={(k) => pick(k, minute)}
          size={SIZE}
          align="flex-end"
          ink={palette.ink}
          width={64}
          label={t('onboarding.close.hour')}
        />
        <Text style={{ ...display(SIZE, 600, -0.04), color: palette.ink, paddingHorizontal: 2 }}>
          :
        </Text>
        <Wheel
          items={CLOSE_MINUTES}
          index={minute}
          onChange={(k) => pick(hour, k)}
          size={SIZE}
          align="flex-start"
          ink={palette.ink}
          width={64}
          label={t('onboarding.close.minute')}
        />
      </View>
    </View>
  );
}
