import { Text, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { type CloseMoment, type DailyNumber } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, mono } from '../../ui/type/fonts';
import type { WeekDay } from './today-view';

/** The CLOSED stamp lands the way the receipt's does: big and tilted, then down with a thump. */
const stampIn = new Keyframe({
  0: { opacity: 0, transform: [{ rotate: '-14deg' }, { scale: 2.4 }] },
  60: { opacity: 1, transform: [{ rotate: '-7deg' }, { scale: 0.94 }] },
  100: { opacity: 0.92, transform: [{ rotate: '-7deg' }, { scale: 1 }] },
}).duration(500);

/** Where a paused close stands: with cards still to confirm, or only the receipt to go. */
export type PausedClose = 'cards' | 'later';

/**
 * Tonight's card: what the close looks like right now (ahead, due, late, closed), the button to
 * start it, and this week's closed days. At six the tile and the button turn to the accent.
 */
export function TonightCard({
  moment,
  closeAt,
  toConfirm,
  day,
  week,
  closedThisMonth,
  daysThisMonth,
  paused,
  closedStamp,
  monthName,
  onClose,
  onOpenDay,
  onOpenReceipt,
}: {
  readonly moment: CloseMoment;
  readonly closeAt: string;
  readonly toConfirm: number;
  readonly day: DailyNumber;
  readonly week: readonly WeekDay[];
  readonly closedThisMonth: number;
  readonly daysThisMonth: number;
  readonly paused: PausedClose | null;
  /** The time today was closed, for the stamp; null while it is open. */
  readonly closedStamp: string | null;
  readonly monthName: string;
  readonly onClose: () => void;
  readonly onOpenDay: (day: WeekDay) => void;
  readonly onOpenReceipt: () => void;
}) {
  const { palette, serious } = useTheme();
  const { t, language } = useI18n();
  const money = useMoneyFormat();
  const due = moment === 'due' || moment === 'open' || moment === 'late';
  const resuming = paused !== null && moment !== 'closed';
  const lit = (due || resuming) && !serious;
  const stampInk = palette.dark ? '#ffb19a' : '#c0443a';

  const title =
    moment === 'closed'
      ? t('today.tonight.closedTitle')
      : resuming
        ? t('today.tonight.paused')
        : moment === 'late'
          ? t('today.tonight.late')
          : moment === 'open'
            ? t('today.tonight.open')
            : moment === 'due'
              ? closeAt === '18:00'
                ? t('today.tonight.due')
                : t('today.tonight.dueLater', { time: closeAt })
              : t('today.tonight.before', { time: closeAt });
  const sub =
    moment === 'closed'
      ? t('today.tonight.closedSub', { amount: money.short(day.tomorrow), time: closeAt })
      : resuming
        ? paused === 'cards'
          ? t('today.tonight.pausedCards', { count: toConfirm })
          : t('today.tonight.pausedAlmost')
        : due
          ? toConfirm
            ? t('today.tonight.toConfirm', { count: toConfirm })
            : t('today.tonight.sweep')
          : toConfirm
            ? t('today.tonight.caughtSoFar', { count: toConfirm })
            : t('today.tonight.nothingYet');
  const icon = moment === 'closed' ? 'task_alt' : moment === 'late' ? 'bedtime' : 'wb_twilight';
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const letters = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const dayLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 14,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            backgroundColor: lit ? palette.accent : palette.chipBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name={icon} size={26} fill={1} color={lit ? '#2a1424' : palette.ink} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={{ ...display(21, 500, -0.01), lineHeight: 24, color: palette.ink }}>
            {title}
          </Text>
          <Text style={{ ...body(14), lineHeight: 19, color: palette.inkSoft }}>{sub}</Text>
        </View>
      </View>

      {moment !== 'closed' ? (
        <PressScale
          scaleTo={0.97}
          inScroll
          accessibilityRole="button"
          onPress={onClose}
          style={{
            height: 52,
            borderRadius: 99,
            backgroundColor: lit ? palette.accent : palette.btnBg,
            boxShadow: lit
              ? '0 8px 22px rgba(255,120,70,.38), inset 0 1px 0 rgba(255,255,255,.5)'
              : 'none',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Text style={{ ...body(16, 650), color: lit ? '#2a1424' : palette.btnFg }}>
            {resuming ? t('today.cta.resume') : due ? t('today.cta.start') : t('today.cta.early')}
          </Text>
          <Symbol name="arrow_forward" size={20} color={lit ? '#2a1424' : palette.btnFg} />
        </PressScale>
      ) : (
        <PressScale
          scaleTo={0.98}
          inScroll
          accessibilityRole="button"
          onPress={onOpenReceipt}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <Animated.View
            entering={stampIn}
            style={{
              paddingTop: 6,
              paddingHorizontal: 10,
              paddingBottom: 5,
              borderWidth: 2.5,
              borderColor: stampInk,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                ...mono(13, 600, 0.14),
                lineHeight: 15,
                color: stampInk,
                textAlign: 'center',
              }}
            >
              {t('close.receipt.closed')}
              {'\n'}
              {closedStamp ?? closeAt}
            </Text>
          </Animated.View>
          <Text style={{ ...body(14), lineHeight: 19.6, color: palette.inkSoft, flex: 1 }}>
            {t('today.closedFiled', { month: monthName })}
          </Text>
          <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.45 }} />
        </PressScale>
      )}

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
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {week.map((w) => {
            const ring = palette.dark ? 'rgba(255,255,255,.22)' : 'rgba(27,30,46,.18)';
            const date = new Date(`${w.day}T12:00:00`);
            return (
              <PressScale
                key={w.day}
                scaleTo={0.9}
                disabled={w.future}
                accessibilityRole="button"
                accessibilityLabel={dayLabel.format(date)}
                onPress={() => onOpenDay(w)}
                style={{ alignItems: 'center', gap: 5, opacity: w.future ? 0.45 : 1 }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: w.closed ? palette.accent : 'transparent',
                    borderWidth: 1.5,
                    borderColor: w.closed ? 'transparent' : w.isToday ? palette.inkSoft : ring,
                    borderStyle: w.isToday && !w.closed ? 'dashed' : 'solid',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {w.closed ? <Symbol name="check" size={16} weight={600} color="#2a1424" /> : null}
                </View>
                <Text style={{ ...body(10.5, 600), color: palette.inkSoft }}>
                  {letters.format(date)}
                </Text>
              </PressScale>
            );
          })}
        </View>
        <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
          <Text style={{ ...body(13, 650), lineHeight: 17.5, color: palette.ink }}>
            {t('today.week.closed', { closed: closedThisMonth, days: daysThisMonth })}
          </Text>
          <Text style={{ ...body(13), lineHeight: 17.5, color: palette.inkSoft }}>
            {t('today.week.closedSub')}
          </Text>
        </View>
      </View>
    </View>
  );
}
