import type { Ref } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type AnimatedRef } from 'react-native-reanimated';

import { addDays, formatShort, type DailyNumber } from '@6pm/domain';

import { dayOf, type MoneySnapshot } from '../../data/money-store';
import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useHomePageScroll, useHomeScroll } from '../home/home-scroll';
import { BillsCard } from './bills-section';
import { DailyCard } from './daily-card';
import { FutureYouCard } from './future-you-section';
import { MoneyRiverCard, type RiverCopy } from './money-river-card';
import { OccasionsStrip } from './occasions-section';
import { planColours } from './plan-colours';
import { usePlanFormat, type PlanFormat } from './plan-format';
import { SectionHeader } from './plan-parts';
import { billViews, goalViews, occasionViews, riverOf } from './plan-view';
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
}

/** Plan: the month's money river, the daily number, bills, Future you and occasions. */
export function PlanPage({ scrollRef, sectionsRef, onSectionChange }: PlanPageProps) {
  const { palette } = useTheme();
  const { top } = useDesignInsets();
  const snap = useMoney();
  const day = dayOf(snap);
  const { y } = useHomeScroll();
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
  sections,
  ink,
  inkSoft,
}: {
  readonly snap: MoneySnapshot;
  readonly day: DailyNumber;
  readonly sections: ReturnType<typeof usePlanSections>;
  readonly ink: string;
  readonly inkSoft: string;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { y } = useHomeScroll();
  const format = usePlanFormat(snap.today);
  const colours = planColours(palette);
  const topUps = useCycleTopUps(snap);
  // The header drifts down at a third of the scroll and is gone by 70 pt, as in the prototype.
  const header = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, 1 - y.value / 70)),
    transform: [{ translateY: Math.min(y.value, 80) * 0.3 }],
  }));
  const plan = snap.plan;
  if (!plan) return null;
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
        <Text accessibilityRole="header" style={{ ...body(34, 700, -0.03), color: ink }}>
          {t('tabs.plan')}
        </Text>
        <Text style={{ ...body(15), lineHeight: 21.75, paddingTop: 8, color: inkSoft }}>
          {t(plan.futureYou > 0 ? 'plan.lede' : 'plan.ledeNoFuture', {
            free: formatShort(day.free),
            daily: formatShort(day.tomorrow),
          })}
        </Text>
      </Animated.View>

      <View onLayout={sections.sectionLayout(0)}>
        <MoneyRiverCard
          income={plan.income}
          river={river}
          colours={colours}
          copy={riverCopy(snap, topUps?.goal ?? 0, format, t)}
        />
      </View>

      <Reveal {...reveal}>
        <DailyCard
          day={day}
          today={today}
          payday={cycle.payday}
          daysLeft={cycle.daysLeft}
          committed={plan.futureYou}
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
            amount: formatShort(goals.reduce((sum, g) => sum + g.saved, 0)),
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
            amount: formatShort(occasions.reduce((sum, o) => sum + o.saved, 0)),
          })}
        />
        <OccasionsStrip occasions={occasions} colours={colours} format={format} />
      </Reveal>
    </>
  );
}

function riverCopy(
  snap: MoneySnapshot,
  goalTopUps: number,
  format: PlanFormat,
  t: ReturnType<typeof useI18n>['t'],
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
      spent: t('plan.river.spent'),
      free: t('plan.river.free'),
    },
    note: {
      bills: names ? t('plan.river.billsNote', { names }) : t('plan.river.billsNone'),
      futureYou:
        goalTopUps > 0
          ? t('plan.river.futureNoteAdded', {
              save: formatShort(futureYou),
              added: formatShort(goalTopUps),
            })
          : t('plan.river.futureNote'),
      occasions: t('plan.river.occasionsNote'),
      spent: t('plan.river.spentNote', {
        from: format.dayFrom(addDays(snap.cycle.start, 1), snap.today),
        to: format.dayLongMonth(snap.today),
      }),
      free: t('plan.river.freeNote'),
    },
  };
}
