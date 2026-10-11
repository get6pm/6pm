import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { formatShort, type CalendarCell } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, mono, tabular } from '../../ui/type/fonts';
import { PageButton } from './calendar-page-button';
import { dots, inkWash, paper } from './diary-colours';

const SELECT_MS = 200;

function Legend({ colour, label }: { readonly colour: string; readonly label: string }) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colour }} />
      <Text style={{ ...body(11, 600), color: palette.inkSoft }}>{label}</Text>
    </View>
  );
}

/** A closed day: a paper tile that lifts and rings in the accent when it is the one shown. */
function ClosedCell({
  cell,
  selected,
  onPress,
}: {
  readonly cell: Extract<CalendarCell, { kind: 'closed' }>;
  readonly selected: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(selected ? -2 : 0, { duration: SELECT_MS }) }],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: withTiming(selected ? 1 : 0, { duration: SELECT_MS }),
  }));
  return (
    <Animated.View style={[{ flex: 1 }, lift]}>
      <PressScale
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={{
          height: 52,
          borderRadius: 12,
          backgroundColor: paper.sheet,
          boxShadow: '0 2px 6px rgba(20,8,30,.16)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              inset: -2.5,
              borderRadius: 14.5,
              borderWidth: 2.5,
              borderColor: palette.accent,
              boxShadow: '0 8px 16px rgba(20,8,30,.3)',
            },
            ring,
          ]}
        />
        <Text style={{ ...body(14, 650), ...tabular, lineHeight: 14, color: paper.ink }}>
          {Number(cell.day.slice(8))}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, opacity: 0.8 }}>
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: cell.dot === 'under' ? dots.under : dots.over,
            }}
          />
          <Text style={{ ...mono(9.5, 500), lineHeight: 9.5, color: paper.ink }}>
            {formatShort(cell.spent)}
          </Text>
        </View>
      </PressScale>
    </Animated.View>
  );
}

/** Today (dashed in the accent, "6pm"), a missed day (dashed hairline) or a day still ahead. */
function OpenCell({
  cell,
  onPress,
}: {
  readonly cell: Extract<CalendarCell, { kind: 'today' | 'missed' | 'idle' }>;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const wash = inkWash(palette.dark);
  const n = Number(cell.day.slice(8));
  const sub =
    cell.kind === 'today'
      ? t('diary.cal.today')
      : cell.kind === 'missed'
        ? t('diary.cal.missed')
        : '';
  const fg = cell.kind === 'missed' ? palette.inkSoft : palette.ink;
  const face = (
    <>
      <Text style={{ ...body(14, 650), ...tabular, lineHeight: 14, color: fg }}>{n}</Text>
      {sub ? (
        <Text style={{ ...mono(9.5, 500), lineHeight: 9.5, color: fg, opacity: 0.8 }}>{sub}</Text>
      ) : null}
    </>
  );
  const frame = {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  } as const;
  if (cell.kind === 'idle') return <View style={[frame, { opacity: 0.32 }]}>{face}</View>;
  return (
    <PressScale
      accessibilityRole="button"
      onPress={onPress}
      style={[
        frame,
        {
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: cell.kind === 'today' ? palette.accent : wash.dashed,
          backgroundColor: cell.kind === 'today' ? wash.todayFill : 'transparent',
        },
      ]}
    >
      {face}
    </PressScale>
  );
}

/**
 * The month as receipts: each closed day a paper tile with its total and a dot for under or over
 * its line, today waiting at six, missed days ready to catch up. Weeks start on Monday.
 */
export function MonthCalendar({
  title,
  summary,
  letters,
  cells,
  selected,
  onSelect,
  onToday,
  onMissed,
  canPrevious,
  canNext,
  onPage,
}: {
  readonly title: string;
  readonly summary: string;
  readonly letters: readonly string[];
  readonly cells: readonly CalendarCell[];
  readonly selected: string | null;
  readonly onSelect: (day: string) => void;
  readonly onToday: () => void;
  readonly onMissed: (day: string) => void;
  /** Whether a month with days in it lies before / after the one shown. */
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly onPage: (by: 1 | -1) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingVertical: 16,
        paddingHorizontal: 14,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 10,
          paddingHorizontal: 4,
        }}
      >
        <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PageButton
            direction="previous"
            enabled={canPrevious}
            label={t('diary.cal.previous')}
            onPress={() => onPage(-1)}
          />
          <View style={{ flexShrink: 1, gap: 2 }}>
            <Text style={{ ...body(17, 700, -0.01), color: palette.ink }}>{title}</Text>
            <Text numberOfLines={2} style={{ ...body(12.5), color: palette.inkSoft }}>
              {summary}
            </Text>
          </View>
          <PageButton
            direction="next"
            enabled={canNext}
            label={t('diary.cal.next')}
            onPress={() => onPage(1)}
          />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Legend colour={dots.under} label={t('diary.cal.under')} />
          <Legend colour={dots.over} label={t('diary.cal.over')} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {letters.map((letter, i) => (
          <Text
            key={i}
            style={{
              flex: 1,
              ...mono(10.5, 400, 0.06),
              color: palette.inkSoft,
              textAlign: 'center',
            }}
          >
            {letter}
          </Text>
        ))}
      </View>
      <View style={{ gap: 5 }}>
        {weeks.map((week, w) => (
          <View key={w} style={{ flexDirection: 'row', gap: 5 }}>
            {week.map((cell, i) =>
              cell.kind === 'blank' ? (
                <View key={i} style={{ flex: 1, height: 52 }} />
              ) : cell.kind === 'closed' ? (
                <ClosedCell
                  key={cell.day}
                  cell={cell}
                  selected={cell.day === selected}
                  onPress={() => onSelect(cell.day)}
                />
              ) : (
                <OpenCell
                  key={cell.day}
                  cell={cell}
                  onPress={() => (cell.kind === 'today' ? onToday() : onMissed(cell.day))}
                />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
