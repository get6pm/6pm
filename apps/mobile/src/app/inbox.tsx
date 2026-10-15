import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated';

import type { LocalDate } from '@6pm/domain';

import { useMoney, useMoneyActions } from '../data/money-provider';
import { waitingOf } from '../data/money-store';
import { useRunAction } from '../features/companion/use-run-action';
import { InboxRow } from '../features/inbox/inbox-row';
import { dayNaming, inboxSections, type InboxSection } from '../features/inbox/inbox-sections';
import { toRowViews } from '../features/today/today-view';
import { useSpendLabels } from '../features/today/use-spend-rows';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { PressScale } from '../ui/primitives/press-scale';
import { useClock } from '../ui/theme/clock';
import { useTheme } from '../ui/theme/theme';
import { body, display } from '../ui/type/fonts';
import { Companion } from '../ui/companion/companion';
import { UndoHost, useOfferUndo } from '../ui/undo/undo-host';

/** The card closing up as a row leaves it. */
const reflow = LinearTransition.springify().damping(22).stiffness(240);
const sectionIn = FadeIn.duration(220);
const sectionOut = FadeOut.duration(180);

/** Inside a sheet the app's own undo bar is covered, so the Inbox brings one of its own. */
export default function Inbox() {
  return (
    <UndoHost lift={UNDO_LIFT}>
      <InboxSheet />
    </UndoHost>
  );
}

/** Just above the home indicator: a sheet has no tab bar to clear. */
const UNDO_LIFT = 50;

function InboxSheet() {
  const { palette, serious } = useTheme();
  const router = useRouter();
  const offerUndo = useOfferUndo();
  const { t, weekday, weekdayDate } = useI18n();
  const { dayDate } = useClock();
  const snap = useMoney();
  const actions = useMoneyActions();
  const run = useRunAction();
  const labels = useSpendLabels();
  // Oldest first: the order they were caught in. Every waiting item shows, whatever day or pay cycle it is from.
  const waiting = waitingOf(snap).reverse();
  const missing = new Set(waiting.filter((s) => s.amount <= 0).map((s) => s.id));
  const sections = inboxSections(waiting, snap.today, new Set(snap.closedDays.map((d) => d.day)));
  // This week's days by name; older ones by date, so two Wednesdays never read the same.
  const dayName = (day: LocalDate) => {
    const date = new Date(`${day}T12:00:00`);
    return dayNaming(day, snap.today) === 'weekday' ? weekday(date) : weekdayDate(date);
  };
  const titleOf = (section: InboxSection) =>
    section.kind === 'look'
      ? t('inbox.needsALook')
      : section.kind === 'today'
        ? t('inbox.today', { weekday: weekday(dayDate) })
        : section.closed
          ? t('inbox.afterClose', { weekday: dayName(section.day) })
          : t('inbox.earlier', { weekday: dayName(section.day) });
  // What needs a look comes from any day, so its rows say which.
  const rowsOf = (section: InboxSection) => {
    const rows = toRowViews(section.spends, snap.categories, labels, false);
    if (section.kind !== 'look') return rows;
    return rows.map((row, i) => {
      const day = section.spends[i]?.day ?? snap.today;
      return day === snap.today ? row : { ...row, meta: `${dayName(day)} · ${row.meta}` };
    });
  };
  const confirm = (id: string) => void run(() => actions.setStatus(id, 'kept'));
  const keep = (id: string) => {
    haptics.tap();
    confirm(id);
  };
  const skip = (id: string) => {
    const name = waiting.find((s) => s.id === id)?.merchant ?? '';
    void run(() => actions.setStatus(id, 'deleted')).then((saved) => {
      if (saved) {
        offerUndo(t('undo.skipped', { name }), t('undo.action'), () => {
          void run(() => actions.undo(id));
        });
      }
    });
  };
  const open = (id: string) => router.push(`/spend/${id}`);
  const rowLabels = {
    keep: t('inbox.keep'),
    confirm: t('today.row.confirm'),
    edit: t('details.edit'),
    skip: t('inbox.skip'),
  };
  const keepAll = () => {
    haptics.success();
    void run(async () => {
      for (const s of waiting) await actions.setStatus(s.id, 'kept');
    });
  };
  const card = (section: InboxSection) => (
    <Animated.View
      key={section.key}
      layout={reflow}
      entering={sectionIn}
      exiting={sectionOut}
      style={{ gap: 8 }}
    >
      <Text
        style={{
          ...body(13, 600, 0.04),
          textTransform: 'uppercase',
          color: palette.inkSoft,
          paddingHorizontal: 6,
        }}
      >
        {titleOf(section)}
      </Text>
      <Animated.View
        layout={reflow}
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          overflow: 'hidden',
        }}
      >
        {rowsOf(section).map((row) => (
          <InboxRow
            key={row.id}
            row={row}
            labels={rowLabels}
            amountMissing={row.foreign === null && missing.has(row.id)}
            onKeep={keep}
            onConfirm={confirm}
            onSkip={skip}
            onOpen={open}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );

  return (
    <SheetScreen title={t('inbox.title')}>
      {/* Rows and sections fade in only when they move later, never as the sheet opens. */}
      <LayoutAnimationConfig skipEntering>
        {waiting.length === 0 ? (
          <View
            style={{ alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 20 }}
          >
            {serious ? null : <Companion size={76} mood="happy" />}
            <Text style={{ ...display(34), color: palette.ink }}>{t('inbox.empty.title')}</Text>
            <Text style={{ ...body(15), color: palette.inkSoft, textAlign: 'center' }}>
              {t('inbox.empty.sub')}
            </Text>
          </View>
        ) : (
          <>
            {sections.map(card)}
            <Animated.View layout={reflow} style={{ gap: 12, alignItems: 'center' }}>
              <PressScale
                scaleTo={0.97}
                accessibilityRole="button"
                onPress={keepAll}
                style={{
                  alignSelf: 'stretch',
                  height: 52,
                  borderRadius: 99,
                  backgroundColor: palette.btnBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...body(17, 650), color: palette.btnFg }}>
                  {t('inbox.confirmAll', { count: waiting.length })}
                </Text>
              </PressScale>
              <Text style={{ ...body(13), color: palette.inkSoft }}>{t('inbox.orAtSix')}</Text>
            </Animated.View>
          </>
        )}
      </LayoutAnimationConfig>
    </SheetScreen>
  );
}
