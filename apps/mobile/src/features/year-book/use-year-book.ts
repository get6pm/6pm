import { Directory, File, Paths } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';

import { monthsOfYear, type YearKey } from '@6pm/domain';

import { notDailyOf, readMonthDiary } from '../../data/diary-queries';
import { useMoney, useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useTheme } from '../../ui/theme/theme';
import { useToast } from '../../ui/toast/toast-host';
import { useDiaryDates } from '../diary/diary-dates';
import { zineView } from '../diary/zine/zine-view';
import { renderCompanion } from '../surfaces/companion-images';
import { yearBookDoc } from './year-book-doc';
import { displayStack, fontFaces } from './year-book-fonts';
import { PAGE, yearBookHtml } from './year-book-html';

const NO_MARGINS = { top: 0, right: 0, bottom: 0, left: 0 };
const BOOK_FILE = /^6pm-year-book-\d{4}\.pdf$/;

function sweepBooks() {
  try {
    const cache = new Directory(Paths.cache);
    if (!cache.exists) return;
    for (const entry of cache.list()) {
      if (entry instanceof File && BOOK_FILE.test(entry.name)) deleteQuietly(entry);
    }
  } catch {
    // Nothing to sweep, or iOS cleared the cache itself.
  }
}

function deleteQuietly(file: File) {
  try {
    if (file.exists) file.delete();
  } catch {
    // Already gone, or iOS clears the cache itself; nothing to tell the user.
  }
}

/**
 * Binds a year's money diaries into one PDF and hands it to the share sheet: the cover, the year
 * at a glance, then every month with a closed day, drawn from the same words and numbers as each
 * month's money diary, amounts shown (the book is the user's own). One book is bound at a time;
 * the PDF lives in the cache only while the share sheet uses it.
 */
export function useYearBook() {
  const store = useMoneyStore();
  const snap = useMoney();
  const { t, language } = useI18n();
  const dates = useDiaryDates();
  const { palette, serious } = useTheme();
  const toast = useToast();
  const busy = useRef(false);
  const [binding, setBinding] = useState<YearKey | null>(null);

  const bind = useCallback(
    async (year: YearKey) => {
      haptics.tap();
      if (busy.current) return;
      busy.current = true;
      setBinding(year);
      // A book an interrupted share left behind is swept first, so the cache never keeps old years.
      sweepBooks();
      const named = new File(Paths.cache, `6pm-year-book-${year}.pdf`);
      let printed: File | null = null;
      try {
        const payday = snap.plan?.payday ?? { kind: 'lastDay' as const };
        const months = monthsOfYear(year);
        const data = await Promise.all(months.map((m) => readMonthDiary(store, m, payday)));
        const notDaily = notDailyOf(snap);
        const zines = months.flatMap((month, i) => {
          const d = data[i];
          if (!d || d.closed.length === 0) return [];
          return [
            zineView({
              month,
              data: d,
              categories: snap.categories,
              notDaily,
              t,
              language,
              dates,
              showAmounts: true,
            }),
          ];
        });
        const html = yearBookHtml(
          yearBookDoc({
            year,
            zines,
            t,
            language,
            dates,
            display: displayStack(palette.dispFont),
            fonts: await fontFaces(palette.dispFont),
            companion: serious ? null : renderCompanion('happy', 40, 'base'),
          }),
        );
        const { uri } = await printToFileAsync({
          html,
          width: PAGE.width,
          height: PAGE.height,
          margins: NO_MARGINS,
        });
        // The renderer names the file at random; the receiving app shows this name instead.
        printed = new File(uri);
        deleteQuietly(named);
        printed.moveSync(named);
        haptics.success();
        await shareAsync(named.uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: t('yearBook.shareTitle', { year }),
        });
      } catch {
        toast(t('yearBook.failed'));
      } finally {
        if (printed) deleteQuietly(printed);
        deleteQuietly(named);
        busy.current = false;
        setBinding(null);
      }
    },
    [store, snap, t, language, dates, palette.dispFont, serious, toast],
  );

  return { bind, binding };
}
