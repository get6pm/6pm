import { useRef, useState, type ReactNode } from 'react';
import { Keyboard, ScrollView, Text, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { neededByHorizon, potGoalMin, type Vnd } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { GoalAmountEditor } from './goal-amount-editor';
import { NeededByEditor, useSpan } from './needed-by-editor';
import { PotIconPicker, PotTemplates, type PotDraft } from './new-pot-picker';
import { usePlanFormat } from './plan-format';
import { goalPresets } from './pot-presets';
import { DisclosureRow, PotCard, potReflow, SheetHeader } from './pot-rows';
import { PotCostPanel, type PotCost } from './pot-sheet-cost';
import { PotHero, PotSummary, type PotSummaryContent } from './pot-sheet-parts';
import { EditorRow, PotHeroRow, PotSettingsCard } from './pot-sheet-rows';
import { useSheetMoney } from './sheet-money';

/** What a pot's sheet edits: how it looks and what it is saving for. */
export interface PotFields {
  readonly name: string;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly goal: number;
}

type Open = 'icon' | 'goal' | 'opening' | 'date' | null;

export interface PotSheetProps {
  readonly title: string;
  readonly placeholder: string;
  readonly fields: PotFields;
  readonly onChange: (patch: Partial<PotFields>) => void;
  /** Starting points under the name until it is filled in: new pots only. */
  readonly onTemplate?: ((draft: PotDraft) => void) | undefined;
  /** "Needed by": the month, or null for no date. */
  readonly month: string | null;
  readonly onMonth: (month: string | null) => void;
  /** The pay cycle's month: the earliest the pot can be needed by. */
  readonly from: string;
  /** What a saved pot holds already: shown under its name. */
  readonly saved?: Vnd | undefined;
  /**
   * "Already saved": what the pot held before 6pm, typed on the goal's keypad. It counts toward
   * the goal and never comes out of this month. Left out, the row is not shown.
   */
  readonly opening?: { readonly amount: Vnd; readonly onChange: (amount: Vnd) => void } | undefined;
  /** More rows on the card (a goal's share, pause); a card of their own on a saved pot's sheet. */
  readonly rows?: ReactNode;
  /** Under the card, for a pot not saved yet. */
  readonly summary?: PotSummaryContent | undefined;
  /**
   * A saved pot: what it costs sits on its card, the tile shrinks to a row while an editor is
   * open, and the rows and delete step aside until it closes.
   */
  readonly cost?: PotCost | undefined;
  /** Over the keypad: what the typed goal costs a month to make its date. */
  readonly goalHint?: string | undefined;
  /** The first month whose set-aside fits (null: none within ten years), for the timeline. */
  readonly fitsFrom?: string | null | undefined;
  readonly cta: {
    readonly label: string;
    readonly enabled: boolean;
    readonly onPress: () => void;
  };
  /** Under the button: delete. */
  readonly footer?: ReactNode;
  /**
   * The pot's own currency (ISO code) when it is not the home currency, as a shared pot made
   * elsewhere can be: the goal is shown and typed in it. The summary arrives already written.
   */
  readonly currency?: string | undefined;
}

/**
 * The sheet a pot or goal is made and edited on: name it, pick its icon and colour, then a card
 * of rows that open in place: the goal on one keypad whose units are keys (10.000₫ to a hundred
 * billion, or as much in the home currency) and the month it is needed by on a ten-year line.
 * A new pot shows what it will set aside under the card; a saved pot shows it on the card, with a
 * bar of what it takes from the month's free money and whether it fits.
 */
export function PotSheet(props: PotSheetProps) {
  const { fields, onChange, cta, month, cost } = props;
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useSheetMoney(props.currency);
  const format = usePlanFormat(useMoney().today);
  const span = useSpan();
  const scroll = useRef<ScrollViewInstance>(null);
  const cardY = useRef(0);
  const [open, setOpen] = useState<Open>(null);
  const named = fields.name.trim().length > 0;
  const ready = named && fields.goal >= potGoalMin(money.currency) && cta.enabled;
  const button = useAnimatedStyle(() => ({
    opacity: withTiming(ready ? 1 : 0.35, { duration: 200 }),
  }));
  const saved = cost !== undefined;
  const editing = saved && (open === 'goal' || open === 'opening' || open === 'date');

  const toggle = (next: Exclude<Open, null>) => {
    Keyboard.dismiss();
    setOpen((o) => (o === next ? null : next));
    if (open !== next && next !== 'icon') {
      // A saved pot's header shrinks to a row, so its card already sits at the top.
      const y = saved ? 0 : Math.max(0, cardY.current - 12);
      requestAnimationFrame(() => scroll.current?.scrollTo({ y, animated: true }));
    }
  };
  const horizon = month === null ? null : neededByHorizon(props.from, month);
  const total = horizon === null ? 0 : horizon.years * 12 + horizon.months;
  const Row = saved ? EditorRow : DisclosureRow;
  const monthValue = month
    ? saved
      ? format.monthShort(month)
      : format.monthLong(month)
    : t('plan.pot.noDate');
  const monthSub =
    month === null || (saved && open !== null)
      ? undefined
      : total === 0
        ? t('plan.pot.horizonNow')
        : t('plan.pot.horizon', { span: span(total) });

  return (
    <SheetFrame header={<SheetHeader title={props.title} />}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 14,
          paddingHorizontal: 18,
          paddingBottom: 28,
          gap: saved ? (editing ? 14 : 18) : 20,
        }}
      >
        {editing ? (
          <PotHeroRow
            fields={fields}
            savedLine={
              props.saved === undefined
                ? undefined
                : t('plan.pot.saved', { amount: money.short(props.saved) })
            }
            onPress={() => setOpen(null)}
          />
        ) : (
          <Animated.View
            layout={potReflow}
            {...(saved ? { entering: FadeIn.duration(220), exiting: FadeOut.duration(120) } : {})}
          >
            <PotHero
              fields={fields}
              placeholder={props.placeholder}
              picking={open === 'icon'}
              saved={props.saved}
              currency={props.currency}
              glance={saved}
              onTogglePick={() => toggle('icon')}
              onName={(name) => onChange({ name })}
              onFocusName={() => setOpen(null)}
            />
          </Animated.View>
        )}

        {open === 'icon' ? <PotIconPicker draft={fields} onChange={onChange} /> : null}
        {open !== 'icon' && !named && props.onTemplate ? (
          <PotTemplates onPick={props.onTemplate} currency={props.currency} />
        ) : null}

        <Animated.View
          layout={potReflow}
          onLayout={(e) => (cardY.current = e.nativeEvent.layout.y)}
        >
          <PotCard>
            <Row
              first
              label={t('plan.pot.goal')}
              value={money.short(fields.goal)}
              open={open === 'goal'}
              hint={t('plan.pot.editGoal')}
              onPress={() => toggle('goal')}
            />
            {open === 'goal' ? (
              <GoalAmountEditor
                goal={fields.goal}
                presets={goalPresets(fields.icon, money.currency)}
                currency={props.currency}
                hue={fields.hue}
                hint={props.goalHint}
                onChange={(goal) => onChange({ goal })}
              />
            ) : null}
            {props.opening ? (
              <Row
                label={t('plan.pot.opening')}
                value={
                  props.opening.amount > 0
                    ? money.short(props.opening.amount)
                    : t('plan.pot.openingNone')
                }
                open={open === 'opening'}
                hint={t('plan.pot.editOpening')}
                onPress={() => toggle('opening')}
              />
            ) : null}
            {open === 'opening' && props.opening ? (
              <GoalAmountEditor
                goal={props.opening.amount}
                presets={[]}
                currency={props.currency}
                hue={fields.hue}
                onChange={props.opening.onChange}
              />
            ) : null}
            <Row
              label={t('plan.pot.neededBy')}
              value={monthValue}
              sub={monthSub}
              open={open === 'date'}
              hint={t('plan.pot.editDate')}
              onPress={() => toggle('date')}
            />
            {open === 'date' ? (
              <NeededByEditor
                month={month}
                from={props.from}
                format={format}
                hue={fields.hue}
                fitsFrom={props.fitsFrom}
                onChange={props.onMonth}
              />
            ) : null}
            {cost && open !== 'goal' && open !== 'opening' ? (
              <PotCostPanel cost={cost} hue={fields.hue} />
            ) : null}
            {saved ? null : props.rows}
          </PotCard>
        </Animated.View>

        {saved && !editing && props.rows ? <PotSettingsCard>{props.rows}</PotSettingsCard> : null}
        {props.summary ? <PotSummary content={props.summary} /> : null}

        <Animated.View layout={potReflow} style={button}>
          <PressScale
            scaleTo={0.95}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={cta.onPress}
            style={{
              height: 56,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(17, 650), color: palette.btnFg }}>{cta.label}</Text>
          </PressScale>
        </Animated.View>
        {props.footer && !editing ? (
          <Animated.View
            layout={potReflow}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(140)}
            // A saved pot's delete sits 4 pt under Save.
            style={saved ? { marginTop: -14 } : null}
          >
            {props.footer}
          </Animated.View>
        ) : null}
      </ScrollView>
    </SheetFrame>
  );
}
