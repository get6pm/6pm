import { memo } from 'react';
import { Text, View } from 'react-native';

import { lineAhead, type CalendarCell, type LocalDate, type Money } from '@6pm/domain';
import { duoInk } from '@6pm/theme';

import { useMoneyFormat } from '../../money/use-money-format';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';

const CELL = 46;
const GAP = 5;

/**
 * The month's daily numbers, Monday first: each day gone with what was spent (green under its
 * line, red over), a day never closed as a dash, today dark with what is still safe, and each day
 * still ahead faint with the number it would have if today ended now.
 */
export const MonthDays = memo(function MonthDays({
  cells,
  letters,
  today,
  payday,
  safe,
  tomorrow,
}: {
  readonly cells: readonly CalendarCell[];
  readonly letters: readonly string[];
  readonly today: LocalDate;
  readonly payday: LocalDate;
  readonly safe: Money;
  readonly tomorrow: Money;
}) {
  const { palette } = useTheme();
  const money = useMoneyFormat();
  const ink = palette.dark ? 'dark' : 'light';
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const tile = (cell: CalendarCell, k: number) => {
    if (cell.kind === 'blank') return <View key={k} style={{ flex: 1, height: CELL }} />;
    let bg: string = palette.cell;
    let fg: string = palette.ink;
    let amount: string;
    let opacity = 1;
    if (cell.kind === 'closed') {
      const tone = duoInk[cell.dot][ink];
      bg = tone.bg;
      fg = tone.fg;
      amount = money.short(cell.spent);
    } else if (cell.kind === 'today') {
      bg = palette.ink;
      fg = palette.sheetSolid;
      amount = money.short(Math.max(0, safe));
    } else if (cell.kind === 'missed') {
      bg = palette.hair;
      amount = '—';
      opacity = 0.7;
    } else {
      const ahead = lineAhead(cell.day, today, payday, tomorrow);
      amount = ahead === null ? '' : money.short(ahead);
      opacity = 0.5;
    }
    return (
      <View
        key={cell.day}
        style={{
          flex: 1,
          height: CELL,
          borderRadius: 12,
          backgroundColor: bg,
          opacity,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Text style={{ ...body(12.5, 650), color: fg }}>{Number(cell.day.slice(8))}</Text>
        <Text
          numberOfLines={1}
          style={{ ...body(9.5, 600), ...tabular, color: fg, opacity: 0.8, minHeight: 12 }}
        >
          {amount}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ gap: GAP }}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {letters.map((letter, k) => (
          <Text
            key={k}
            style={{ flex: 1, textAlign: 'center', ...body(10.5, 650), color: palette.inkSoft }}
          >
            {letter}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: GAP }}>
          {row.map(tile)}
        </View>
      ))}
    </View>
  );
});
