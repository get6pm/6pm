import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { ShelfYearBook } from '@6pm/domain';
import { yearBookInk } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display, leading } from '../../ui/type/fonts';
import { useCompanionToast } from '../companion/use-companion-toast';
import { useYearBook } from './use-year-book';

/** The sub line swaps with a short cross-fade, as the prototype's text changes settle. */
const SWAP_MS = 200;

/** One year book on the shelf: dark cloth, the year in gold, the MAX badge while locked. */
function YearBookCard({
  year,
  sub,
  locked,
  busy,
  onPress,
}: {
  readonly year: string;
  readonly sub: string;
  readonly locked: boolean;
  readonly busy: boolean;
  readonly onPress: () => void;
}) {
  const { t } = useI18n();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ busy }}
      scaleTo={0.98}
      onPress={onPress}
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
      <Text style={{ ...leading(display(34, 500, -0.03), 34), color: yearBookInk.gold }}>
        {year}
      </Text>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ ...body(15.5, 650), color: yearBookInk.light }}>
          {t('diary.year.title')}
        </Text>
        <Animated.Text
          key={sub}
          entering={FadeIn.duration(SWAP_MS)}
          exiting={FadeOut.duration(SWAP_MS)}
          style={{ ...body(12.5), lineHeight: 16.9, color: yearBookInk.soft }}
        >
          {sub}
        </Animated.Text>
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

/**
 * The year books under the money diaries. Without Max there is one, locked, and a tap opens the
 * Max sheet. With Max, this year's waits until it binds on 31 December (a tap says so); a bound
 * book, this year's from 31 December or any earlier year's, is shared as a PDF.
 */
export function YearBooks({
  books,
  locked,
}: {
  readonly books: readonly ShelfYearBook[];
  /** The year book is a Max feature: true until the customer holds Max. */
  readonly locked: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const say = useCompanionToast();
  const { bind, binding } = useYearBook();
  const shown = locked ? books.slice(0, 1) : books;
  return (
    <>
      {shown.map((book) => (
        <YearBookCard
          key={book.year}
          year={book.year}
          locked={locked}
          busy={binding === book.year}
          sub={
            locked
              ? t('diary.year.sub')
              : binding === book.year
                ? t('yearBook.binding')
                : book.bound
                  ? t('yearBook.bound')
                  : t('yearBook.binds')
          }
          onPress={() => {
            if (locked) {
              router.push({ pathname: '/max', params: { from: 'diary' } });
            } else if (book.bound) {
              void bind(book.year);
            } else {
              haptics.tap();
              say('yearBook');
            }
          }}
        />
      ))}
    </>
  );
}
