import { useRef, useState, type ReactNode } from 'react';
import { Keyboard, ScrollView, Text, View, type ScrollViewInstance } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

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
import { PotHero, PotSummary, type PotSummaryContent } from './pot-sheet-parts';
import { useSheetMoney } from './sheet-money';

/** What a pot's sheet edits: how it looks and what it is saving for. */
export interface PotFields {
  readonly name: string;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly goal: number;
}

type Open = 'icon' | 'goal' | 'date' | null;

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
  /** More rows on the card (a goal's share, pause). */
  readonly rows?: ReactNode;
  readonly summary: PotSummaryContent;
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
 * of rows that open in place: the goal on an amount keypad (10.000₫ to a hundred billion, or as
 * much in the home currency) and the month it is needed by (quick picks and wheels, up to ten
 * years out). What it will set aside, and what that does to a day, update live under the card.
 */
export function PotSheet(props: PotSheetProps) {
  const { fields, onChange, cta, month } = props;
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

  const toggle = (next: Exclude<Open, null>) => {
    Keyboard.dismiss();
    setOpen((o) => (o === next ? null : next));
    if (open !== next && next !== 'icon') {
      requestAnimationFrame(() =>
        scroll.current?.scrollTo({ y: Math.max(0, cardY.current - 12), animated: true }),
      );
    }
  };
  const horizon = month === null ? null : neededByHorizon(props.from, month);
  const total = horizon === null ? 0 : horizon.years * 12 + horizon.months;

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
          gap: 20,
        }}
      >
        <PotHero
          fields={fields}
          placeholder={props.placeholder}
          picking={open === 'icon'}
          saved={props.saved}
          currency={props.currency}
          onTogglePick={() => toggle('icon')}
          onName={(name) => onChange({ name })}
          onFocusName={() => setOpen(null)}
        />

        {open === 'icon' ? <PotIconPicker draft={fields} onChange={onChange} /> : null}
        {open !== 'icon' && !named && props.onTemplate ? (
          <PotTemplates onPick={props.onTemplate} currency={props.currency} />
        ) : null}

        <View onLayout={(e) => (cardY.current = e.nativeEvent.layout.y)}>
          <PotCard>
            <DisclosureRow
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
                onChange={(goal) => onChange({ goal })}
              />
            ) : null}
            <DisclosureRow
              label={t('plan.pot.neededBy')}
              value={month ? format.monthLong(month) : t('plan.pot.noDate')}
              sub={
                month === null
                  ? undefined
                  : total === 0
                    ? t('plan.pot.horizonNow')
                    : t('plan.pot.horizon', { span: span(total) })
              }
              open={open === 'date'}
              hint={t('plan.pot.editDate')}
              onPress={() => toggle('date')}
            />
            {open === 'date' ? (
              <NeededByEditor
                month={month}
                from={props.from}
                format={format}
                onChange={props.onMonth}
              />
            ) : null}
            {props.rows}
          </PotCard>
        </View>

        <PotSummary content={props.summary} />

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
        {props.footer ? <Animated.View layout={potReflow}>{props.footer}</Animated.View> : null}
      </ScrollView>
    </SheetFrame>
  );
}
