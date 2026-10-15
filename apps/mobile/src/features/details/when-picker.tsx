import { Text, View } from 'react-native';

import {
  MONEY_DAY_HOURS,
  daysIn,
  instantOnMoneyDay,
  moneyDayOf,
  type DayRange,
  type LocalDate,
} from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useTheme } from '../../ui/theme/theme';
import { display } from '../../ui/type/fonts';
import { Wheel } from '../../ui/wheel/wheel';
import { wheelRowHeight } from '../../ui/wheel/wheel-maths';

const SIZE = 22;
const HOURS = MONEY_DAY_HOURS.map((h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, m) => String(m).padStart(2, '0'));

/**
 * When a spend happened, on the wheels the close time is set with: the day (only days it may move
 * to), then the hour and minute on the money day's clock, 04 round to 03. A time still to come
 * today settles back on now.
 */
export function WhenPicker({
  at,
  range,
  today,
  now,
  onChange,
}: {
  readonly at: Date;
  readonly range: DayRange;
  readonly today: LocalDate;
  readonly now: Date;
  readonly onChange: (instant: Date) => void;
}) {
  const { palette } = useTheme();
  const { t, weekdayDate } = useI18n();
  const days = daysIn(range);
  const day = Math.max(0, days.indexOf(moneyDayOf(at)));
  const hour = Math.max(0, MONEY_DAY_HOURS.indexOf(at.getHours()));
  const minute = at.getMinutes();
  const pick = (d: number, h: number, m: number) => {
    const chosen = days[d];
    const clock = MONEY_DAY_HOURS[h];
    if (chosen === undefined || clock === undefined) return;
    onChange(instantOnMoneyDay(chosen, clock, m, now));
  };
  const dayLabels = days.map((d) =>
    d === today ? t('details.when.today') : weekdayDate(new Date(`${d}T12:00:00`)),
  );
  const rowHeight = wheelRowHeight(SIZE);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          top: '50%',
          height: rowHeight + 8,
          marginTop: -(rowHeight + 8) / 2,
          borderRadius: 14,
          backgroundColor: palette.chipBg,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Wheel
          items={dayLabels}
          index={day}
          onChange={(k) => pick(k, hour, minute)}
          size={SIZE}
          align="flex-end"
          ink={palette.ink}
          padX={12}
          width={170}
          label={t('details.when.day')}
        />
        <Wheel
          items={HOURS}
          index={hour}
          onChange={(k) => pick(day, k, minute)}
          size={SIZE}
          align="flex-end"
          ink={palette.ink}
          width={52}
          label={t('details.when.hour')}
        />
        <Text style={{ ...display(SIZE, 600, -0.04), color: palette.ink, paddingHorizontal: 2 }}>
          :
        </Text>
        <Wheel
          items={MINUTES}
          index={minute}
          onChange={(k) => pick(day, hour, k)}
          size={SIZE}
          align="flex-start"
          ink={palette.ink}
          width={52}
          label={t('details.when.minute')}
        />
      </View>
    </View>
  );
}
