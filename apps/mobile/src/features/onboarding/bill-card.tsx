import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { body, display } from '../../ui/type/fonts';
import { BillAmountFace } from './bill-amount-card';
import { CardTop, Pill, Question } from './bill-card-parts';
import { cardCopy, optionLabel } from './bill-copy';
import type { BillAnswers, DeckItem } from './bill-deck';
import { popEntering } from './onboarding-motion';
import type { OnboardingPalette } from './onboarding-palette';
import { Grid3 } from './step-parts';

export interface BillCardProps {
  readonly item: DeckItem | null;
  readonly deckIndex: number;
  readonly answers: BillAnswers;
  readonly pal: OnboardingPalette;
  /** The end card's title: what was noted. */
  readonly endTitle: string;
  readonly onAnswers: (next: BillAnswers) => void;
  readonly onGo: (index: number, direction: 1 | -1) => void;
  /** The height an amount card needs for its question, wheels and buttons, once laid out. */
  readonly onHeight?: (height: number) => void;
}

/** The card's padding and the gap between its rows. */
const PAD = 18;
const GAP = 10;
const BUTTON_HEIGHT = 44;

/** One card of the bills deck: a yes/no question, a pick-several, an amount, or the end. */
export function BillCardFace({
  item,
  deckIndex,
  answers,
  pal,
  endTitle,
  onAnswers,
  onGo,
  onHeight,
}: BillCardProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const reduceMotion = useReducedMotion();
  const [questionBottom, setQuestionBottom] = useState(0);
  const [wheelsHeight, setWheelsHeight] = useState(0);
  useEffect(() => {
    if (questionBottom === 0 || wheelsHeight === 0) return;
    // Below the subline: the spacer between two gaps, the wheels, a gap, the buttons, the padding.
    onHeight?.(questionBottom + GAP * 3 + wheelsHeight + BUTTON_HEIGHT + PAD);
  }, [questionBottom, wheelsHeight, onHeight]);
  const face = {
    flex: 1,
    borderRadius: 30,
    backgroundColor: pal.cell,
    boxShadow: pal.cardShadow,
    padding: PAD,
    gap: GAP,
  } as const;

  if (item === null) {
    return (
      <View style={[face, { alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
        <Animated.View
          entering={popEntering(500, 150, reduceMotion)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: pal.doneBadge,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="check" size={28} color={pal.doneBadgeInk} />
        </Animated.View>
        <Text
          style={{
            ...display(26, 600, -0.025),
            paddingTop: 6,
            textAlign: 'center',
            color: pal.ink,
          }}
        >
          {endTitle}
        </Text>
        <Text
          style={{
            ...body(14),
            lineHeight: 20.3,
            maxWidth: 260,
            textAlign: 'center',
            color: pal.inkSoft,
          }}
        >
          {t('onboarding.bills.endSub')}
        </Text>
      </View>
    );
  }

  if (item.type === 'ask') {
    const { q, sub } = cardCopy(i18n, item.card);
    const answer = (yes: boolean) => {
      onAnswers({ ...answers, asks: { ...answers.asks, [item.card.key]: yes } });
      onGo(deckIndex + 1, yes ? 1 : -1);
    };
    return (
      <View style={face}>
        <CardTop item={item} pal={pal} />
        <Question q={q} sub={sub} pal={pal} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pill
            label={t('onboarding.bills.no')}
            bg={pal.chipBg}
            fg={pal.ink}
            flex={1}
            height={56}
            radius={18}
            onPress={() => answer(false)}
          />
          <Pill
            label={t('onboarding.bills.yes')}
            bg={pal.btnBg}
            fg={pal.btnFg}
            flex={1}
            height={56}
            radius={18}
            onPress={() => answer(true)}
          />
        </View>
      </View>
    );
  }

  if (item.type === 'multi') {
    const { card } = item;
    const { q, sub } = cardCopy(i18n, card);
    const picked = answers.multis[card.key]?.picked ?? [];
    const set = (next: readonly string[], done: boolean) =>
      onAnswers({ ...answers, multis: { ...answers.multis, [card.key]: { picked: next, done } } });
    const count = picked.length;
    return (
      <View style={face}>
        <CardTop item={item} pal={pal} />
        <Question q={q} sub={sub} pal={pal} />
        <Grid3
          items={card.options}
          gap={6}
          render={(option) => {
            const on = picked.includes(option.id);
            const label = optionLabel(i18n, option);
            return (
              <Pill
                label={label}
                bg={on ? pal.btnBg : pal.chipBg}
                fg={on ? pal.btnFg : pal.ink}
                height={48}
                radius={16}
                onPress={() =>
                  set(on ? picked.filter((p) => p !== option.id) : [...picked, option.id], false)
                }
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 8,
                  }}
                >
                  <Symbol name={option.icon} size={17} fill={1} color={on ? pal.btnFg : pal.ink} />
                  <Text
                    numberOfLines={1}
                    style={{ ...body(13.5, 650), flexShrink: 1, color: on ? pal.btnFg : pal.ink }}
                  >
                    {label}
                  </Text>
                </View>
              </Pill>
            );
          }}
        />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pill
            label={count ? t('onboarding.bills.clear') : t('onboarding.bills.none')}
            bg={pal.accentClear}
            fg={pal.inkSoft}
            flex={1}
            height={44}
            onPress={() => {
              set([], count === 0);
              if (count === 0) onGo(deckIndex + 1, -1);
            }}
          />
          <Pill
            label={count ? t('onboarding.bills.next', { count }) : t('onboarding.bills.pickOrNone')}
            bg={count ? pal.btnBg : pal.chipBg}
            fg={count ? pal.btnFg : pal.inkSoft}
            flex={2}
            height={44}
            onPress={() => {
              if (count === 0) return;
              set(picked, true);
              onGo(deckIndex + 1, 1);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <BillAmountFace
      item={item}
      deckIndex={deckIndex}
      answers={answers}
      pal={pal}
      face={face}
      buttonHeight={BUTTON_HEIGHT}
      onAnswers={onAnswers}
      onGo={onGo}
      onQuestionBottom={setQuestionBottom}
      onWheelsHeight={setWheelsHeight}
    />
  );
}
