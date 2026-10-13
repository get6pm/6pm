import { useRouter } from 'expo-router';
import type { Ref } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useScrollOffset,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';

import { formatShort, type DailyNumber } from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import { dailyInputOf, dayOf, type MoneySnapshot } from '../../data/money-store';
import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useHomePageScroll } from '../home/home-scroll';
import { useEntitlement } from '../purchases/purchases-provider';
import { BillsCard } from './bills-section';
import { DailyCard } from './daily-card';
import { FutureYouCard } from './future-you-section';
import { MoneyRiverCard, type RiverCopy } from './money-river-card';
import { OccasionsStrip } from './occasions-section';
import { planColours } from './plan-colours';
import { usePlanFormat, type PlanFormat } from './plan-format';
import { SectionHeader } from './plan-parts';
import { planRoutes } from './plan-routes';
import { billViews, goalViews, newPotLocked, occasionViews, riverOf } from './plan-view';
import { Reveal } from './reveal';
import { useCycleTopUps } from './use-cycle-top-ups';
import { usePlanSections, type PlanSectionsHandle } from './use-plan-sections';

export type { PlanSectionsHandle } from './use-plan-sections';
export { PLAN_SECTIONS } from './use-plan-sections';

export interface PlanPageProps {
  readonly scrollRef: AnimatedRef<Animated.ScrollView>;
  /** `scrollToSection(k)` for the compact bar's chips (Overview, Bills, Future you, Occasions). */
  readonly sectionsRef?: Ref<PlanSectionsHandle>;
  /** The section under the compact bar, reported when it changes. */
  readonly onSectionChange?: (index: number) => void;
  /** Whether the Plan tab is the one on show; true when the shell does not say. */
  readonly active?: boolean;
}

/** Plan: the month's money river, the daily number, bills, Future you and occasions. */
export function PlanPage({
  scrollRef,
  sectionsRef,
  onSectionChange,
  active = true,
}: PlanPageProps) {
  const { palette } = useTheme();
  const { top } = useDesignInsets();
  const snap = useMoney();
  const day = dayOf(snap);
  // The page's own scroll offset, not the shared one the other tabs write: scrolling Today or the
  // Diary behind a hidden Plan must not run its section tracking or re-render the shell.
  const y = useScrollOffset(scrollRef);
  const onScroll = useHomePageScroll('plan');
  const sections = usePlanSections({
    y,
    scrollRef,
    handleRef: sectionsRef,
    onSectionChange,
    activeAt: top(170),
    jumpTo: top(150),
  });
  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={onScroll}
      scrollEventThrottle={16}
      scrollsToTop={active}
      onLayout={sections.onViewportLayout}
      onContentSizeChange={sections.onContentSizeChange}
      contentInsetAdjustmentBehavior="never"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: 'transparent' }}
      contentContainerStyle={{
        paddingTop: top(64),
        paddingHorizontal: 16,
        paddingBottom: 124,
        gap: 28,
      }}
    >
      {snap.plan && day ? (
        <PlanContent
          snap={snap}
          day={day}
          y={y}
          active={active}
          sections={sections}
          ink={palette.ink}
          inkSoft={palette.inkSoft}
        />
      ) : null}
    </Animated.ScrollView>
  );
}

function PlanContent({
  snap,
  day,
  y,
  active,
  sections,
  ink,
  inkSoft,
}: {
  readonly snap: MoneySnapshot;
  readonly day: DailyNumber;
  readonly y: SharedValue<number>;
  readonly active: boolean;
  readonly sections: ReturnType<typeof usePlanSections>;
  readonly ink: string;
  readonly inkSoft: string;
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const router = useRouter();
  const { max } = useEntitlement();
  const format = usePlanFormat(snap.today);
  const colours = planColours(palette);
  const topUps = useCycleTopUps(snap);
  // The header drifts down at a third of the scroll and is gone by 70 pt, as in the prototype.
  const header = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, 1 - y.value / 70)),
    transform: [{ translateY: Math.min(y.value, 80) * 0.3 }],
  }));
  const plan = snap.plan;
  const input = dailyInputOf(snap);
  if (!plan || !input) return null;
  const { cycle, today } = snap;
  const river = riverOf(snap, day, topUps);
  const bills = billViews(snap);
  const goals = goalViews(snap);
  const occasions = occasionViews(snap);
  const reveal = { y, viewport: sections.viewport };

  return (
    <>
      <Animated.View style={[{ paddingHorizontal: 6, gap: 2 }, header]}>
        <Text style={{ ...body(13, 600, 0.06), textTransform: 'uppercase', color: inkSoft }}>
          {t('plan.kicker', { month: format.month(today), payday: format.dayMonth(cycle.payday) })}
        </Text>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text accessibilityRole="header" style={{ ...body(34, 700, -0.03), color: ink }}>
            {t('tabs.plan')}
          </Text>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={t('plan.month.edit')}
            hitSlop={6}
            onPress={() => {
              haptics.tap();
              router.push(planRoutes.month);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: palette.chipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="edit" size={19} color={ink} />
          </PressScale>
        </View>
        <Text style={{ ...body(15), lineHeight: 21.75, paddingTop: 8, color: inkSoft }}>
          {t(plan.futureYou > 0 ? 'plan.lede' : 'plan.ledeNoFuture', {
            free: formatShort(day.free, language),
            daily: formatShort(day.tomorrow, language),
          })}
        </Text>
      </Animated.View>

      <View onLayout={sections.sectionLayout(0)}>
        <MoneyRiverCard
          income={plan.income}
          river={river}
          colours={colours}
          copy={riverCopy(snap, topUps?.goal ?? 0, format, t, language)}
        />
      </View>

      <Reveal {...reveal}>
        <DailyCard
          input={input}
          today={today}
          payday={cycle.payday}
          daysLeft={cycle.daysLeft}
          committed={plan.futureYou}
          active={active}
          colours={colours}
          format={format}
        />
      </Reveal>

      <Reveal {...reveal} onLayout={sections.sectionLayout(1)} gap={10}>
        <SectionHeader
          title={t('plan.bills.title')}
          note={t('plan.bills.paidOf', {
            paid: bills.filter((b) => b.paid).length,
            total: bills.length,
          })}
        />
        <BillsCard bills={bills} cycle={cycle} today={today} colours={colours} format={format} />
      </Reveal>

      <Reveal {...reveal} onLayout={sections.sectionLayout(2)} gap={10}>
        <SectionHeader
          title={t('plan.future.title')}
          note={t('plan.future.saved', {
            amount: formatShort(
              goals.reduce((sum, g) => sum + g.saved, 0),
              language,
            ),
          })}
        />
        <FutureYouCard
          goals={goals}
          futureYou={plan.futureYou}
          daysLeft={cycle.daysLeft}
          colours={colours}
          format={format}
        />
      </Reveal>

      <Reveal {...reveal} onLayout={sections.sectionLayout(3)} gap={10}>
        <SectionHeader
          title={t('plan.occasions.title')}
          note={t('plan.occasions.setAside', {
            amount: formatShort(
              occasions.reduce((sum, o) => sum + o.saved, 0),
              language,
            ),
          })}
        />
        <OccasionsStrip
          occasions={occasions}
          locked={newPotLocked(snap.pots, max)}
          colours={colours}
          format={format}
        />
      </Reveal>
    </>
  );
}

function riverCopy(
  snap: MoneySnapshot,
  goalTopUps: number,
  format: PlanFormat,
  t: ReturnType<typeof useI18n>['t'],
  language: Language,
): RiverCopy {
  const futureYou = snap.plan?.futureYou ?? 0;
  const names = snap.bills.map((b) => b.name.split(' ·')[0] ?? b.name).join(', ');
  return {
    total: t('plan.river.total'),
    hint: t('plan.river.hint'),
    label: {
      bills: t('plan.river.bills'),
      futureYou: t('plan.river.futureYou'),
      occasions: t('plan.river.occasions'),
      before: t('plan.river.before'),
      spent: t('plan.river.spent'),
      free: t('plan.river.free'),
    },
    note: {
      bills: names ? t('plan.river.billsNote', { names }) : t('plan.river.billsNone'),
      futureYou:
        goalTopUps > 0
          ? t('plan.river.futureNoteAdded', {
              save: formatShort(futureYou, language),
              added: formatShort(goalTopUps, language),
            })
          : t('plan.river.futureNote'),
      occasions: t('plan.river.occasionsNote'),
      before: t('plan.river.beforeNote'),
      spent: t('plan.river.spentNote', {
        from: format.dayFrom(snap.cycle.start, snap.today),
        to: format.dayLongMonth(snap.today),
      }),
      free: t('plan.river.freeNote'),
    },
  };
}
