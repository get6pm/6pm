import { Text, View } from 'react-native';

import { formatShort, type ShelfDiary } from '@6pm/domain';
import { yearBookInk } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, mono } from '../../ui/type/fonts';
import { coverTint, inkWash, zineInk } from './diary-colours';
import { useDiaryDates } from './diary-dates';

/** One diary on the shelf: a bound cover with a spine, or this month's dashed outline. */
function DiaryCover({
  diary,
  onOpen,
}: {
  readonly diary: ShelfDiary;
  readonly onOpen: () => void;
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const dates = useDiaryDates();
  const open = diary.inProgress;
  const fg = open ? palette.ink : zineInk.ink;
  const face = (
    <>
      {!open ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 7,
            experimental_backgroundImage:
              'linear-gradient(90deg, rgba(0,0,0,.16), rgba(0,0,0,.04))',
          }}
        />
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', opacity: 0.7 }}>
        <Text style={{ ...mono(9, 400, 0.14), color: fg }}>
          {t('diary.zines.no', { no: String(diary.no).padStart(2, '0') })}
        </Text>
        <Text style={{ ...mono(9, 400, 0.14), color: fg }}>{diary.month.slice(0, 4)}</Text>
      </View>
      <View style={{ gap: 7 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ ...display(32, 500, -0.03), lineHeight: 30.4, color: fg }}
        >
          {dates.monthShort(diary.month)}
        </Text>
        {open ? (
          <View
            style={{
              height: 4,
              borderRadius: 4,
              backgroundColor: palette.hair,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${Math.round((diary.closed / diary.days) * 100)}%`,
                borderRadius: 4,
                backgroundColor: palette.accent,
              }}
            />
          </View>
        ) : null}
        <View style={{ gap: 1 }}>
          <Text style={{ ...body(12, 650), color: fg }}>
            {t(open ? 'diary.zines.soFar' : 'diary.zines.closed', {
              closed: diary.closed,
              days: diary.days,
            })}
          </Text>
          <Text numberOfLines={1} style={{ ...body(11), color: fg, opacity: 0.65 }}>
            {open
              ? t('diary.zines.binds', { date: dates.dayMonth(diary.binds) })
              : diary.spare >= 0
                ? t('diary.zines.spare', { amount: formatShort(diary.spare, language) })
                : t('diary.zines.over', { amount: formatShort(-diary.spare, language) })}
          </Text>
        </View>
      </View>
    </>
  );
  const frame = {
    flex: 1,
    height: 172,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingTop: 12,
    paddingRight: 10,
    paddingBottom: 12,
    paddingLeft: 17,
    justifyContent: 'space-between',
    overflow: 'hidden',
  } as const;
  // The month still being written opens too, as the diary so far.
  return (
    <PressScale
      accessibilityRole="button"
      onPress={onOpen}
      style={[
        frame,
        open
          ? {
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: inkWash(palette.dark).shelfDashed,
            }
          : {
              backgroundColor: coverTint(diary.month),
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), 0 12px 24px rgba(20,8,30,.28)',
            },
      ]}
    >
      {face}
    </PressScale>
  );
}

/**
 * The year book: every diary bound into one. A Max feature: locked it opens the Max sheet; for a
 * member the lock is gone and the book waits to be bound.
 */
function YearBook({
  year,
  locked,
  onLocked,
}: {
  readonly year: string;
  readonly locked: boolean;
  readonly onLocked: () => void;
}) {
  const { t } = useI18n();
  return (
    <PressScale
      accessibilityRole={locked ? 'button' : 'text'}
      disabled={!locked}
      scaleTo={0.98}
      onPress={onLocked}
      style={{
        height: 86,
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 4,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        backgroundColor: yearBookInk.cloth,
        paddingLeft: 22,
        paddingRight: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        overflow: 'hidden',
        boxShadow: '0 10px 24px rgba(0,0,0,.18)',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          experimental_backgroundImage:
            'linear-gradient(90deg, rgba(0,0,0,.4), rgba(255,255,255,.05))',
        }}
      />
      <Text style={{ ...display(34, 500, -0.03), lineHeight: 34, color: yearBookInk.gold }}>
        {year}
      </Text>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ ...body(15.5, 650), color: yearBookInk.light }}>
          {t('diary.year.title')}
        </Text>
        <Text style={{ ...body(12.5), lineHeight: 16.9, color: yearBookInk.soft }}>
          {t('diary.year.sub')}
        </Text>
      </View>
      {locked ? (
        <View
          style={{
            height: 20,
            paddingLeft: 5,
            paddingRight: 7,
            borderRadius: 6,
            backgroundColor: yearBookInk.light,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Symbol name="lock" size={12} fill={1} color={yearBookInk.badgeInk} />
          <Text style={{ ...body(10, 800, 0.1), color: yearBookInk.badgeInk }}>
            {t('diary.year.max')}
          </Text>
        </View>
      ) : null}
    </PressScale>
  );
}

/** The shelf: a money diary per month, bound on the 1st, and the year book below. */
export function MoneyDiaries({
  shelf,
  year,
  yearLocked,
  onOpen,
  onYearLocked,
}: {
  readonly shelf: readonly ShelfDiary[];
  readonly year: string;
  /** The year book is a Max feature: true until the customer holds Max. */
  readonly yearLocked: boolean;
  readonly onOpen: (month: string) => void;
  readonly onYearLocked: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const rows = Array.from({ length: Math.ceil(shelf.length / 3) }, (_, r) =>
    shelf.slice(r * 3, r * 3 + 3),
  );
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: 6,
        }}
      >
        <Text style={{ ...body(20, 700, -0.02), color: palette.ink }}>
          {t('diary.zines.title')}
        </Text>
        <Text style={{ ...body(14, 500), color: palette.inkSoft }}>{t('diary.zines.bound')}</Text>
      </View>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((diary) => (
            <DiaryCover key={diary.month} diary={diary} onOpen={() => onOpen(diary.month)} />
          ))}
          {Array.from({ length: 3 - row.length }, (_, i) => (
            <View key={`gap-${i}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
      <YearBook year={year} locked={yearLocked} onLocked={onYearLocked} />
    </View>
  );
}
