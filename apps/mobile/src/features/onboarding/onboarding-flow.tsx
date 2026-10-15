import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { useI18n, type I18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { useDesignInsets } from '../../ui/layout/design-insets';
import type { AiMode } from '../privacy/ai-mode';
import { useAiMode } from '../privacy/use-ai-mode';
import { catchWaysFor, readyWays } from './catch-ways';
import { CompanionLine, OnboardingCta, OnboardingHeader } from './onboarding-chrome';
import { stepEntering } from './onboarding-motion';
import { onboardingPalette } from './onboarding-palette';
import { OnboardingSky } from './onboarding-sky';
import { StepBills } from './step-bills';
import { StepAi } from './step-ai';
import { StepCatching } from './step-catching';
import { StepCloseTime } from './step-close-time';
import { LeavingOverlay, StepFirstNumber } from './step-first-number';
import { StepFutureYou } from './step-future-you';
import { StepMoneyIn } from './step-money-in';
import { ordinalDay } from './step-parts';
import { StepPayWith } from './step-pay-with';
import { StepWelcome } from './step-welcome';
import {
  AI_STEP,
  BILLS_STEP,
  CLOSE_STEP,
  LAST_STEP,
  useOnboarding,
  type Onboarding,
} from './use-onboarding';

/** The companion's line for the step, from what has been answered so far. */
function stepLine(o: Onboarding, i18n: I18n, mode: AiMode): string | null {
  const { t } = i18n;
  switch (o.step) {
    case 1:
      return o.payday.kind === 'varies'
        ? t('onboarding.line.paydayVaries')
        : o.payday.kind === 'lastDay'
          ? t('onboarding.line.paydayLast')
          : t('onboarding.line.paydayDay', { day: ordinalDay(i18n, o.payday.day) });
    case 2:
      return o.nav.index >= o.deck.length
        ? t('onboarding.line.billsDone')
        : o.bills.length
          ? t('onboarding.line.billsSoFar', { count: o.bills.length })
          : t('onboarding.line.billsStart');
    case 3:
      return o.percent === 0
        ? t('onboarding.line.futureNone')
        : o.percent >= 20
          ? t('onboarding.line.futureBig')
          : t('onboarding.line.future');
    case 4:
      return o.wallets.length === 0
        ? t('onboarding.line.walletsNone')
        : t('onboarding.line.wallets', { count: o.wallets.length });
    case AI_STEP:
      return t(mode === 'device' ? 'onboarding.line.aiDevice' : 'onboarding.line.aiServer');
    case 6: {
      const ways = catchWaysFor(o.currency, mode);
      return t('onboarding.line.catch', { count: readyWays(ways), total: ways.length });
    }
    case CLOSE_STEP:
      return t('onboarding.line.close', { time: o.closeAt });
    default:
      return null;
  }
}

function stepMood(o: Onboarding): CompanionMood {
  if (o.step === 1) return 'think';
  if (o.step === 3 && o.percent >= 20) return 'happy';
  return o.step === LAST_STEP ? 'happy' : 'calm';
}

function ctaFor(o: Onboarding, { t }: I18n) {
  if (o.step === LAST_STEP)
    return { label: t('onboarding.reveal.open'), icon: 'arrow_forward' } as const;
  if (o.step === CLOSE_STEP && o.reminders === null) {
    return {
      label: t('onboarding.close.remind', { time: o.closeAt }),
      icon: 'notifications',
    } as const;
  }
  if (o.step === BILLS_STEP && o.nav.index < o.deck.length) {
    const label = o.bills.length ? t('onboarding.bills.allDone') : t('onboarding.bills.skipAll');
    return { label, icon: 'arrow_forward' } as const;
  }
  return { label: t('onboarding.continue'), icon: 'arrow_forward' } as const;
}

/**
 * Onboarding: eight steps from morning to dusk that set up the month (money in, payday, bills,
 * Future you, banks, close time) and end on the first real number.
 */
export function OnboardingFlow({ startStep = 0 }: { readonly startStep?: number }) {
  const o = useOnboarding(startStep);
  const i18n = useI18n();
  const money = useMoneyFormat();
  const reduceMotion = useReducedMotion();
  const { top, bottom, insets } = useDesignInsets();
  const pal = onboardingPalette(o.step);
  const aiMode = useAiMode();
  const line = stepLine(o, i18n, aiMode);
  const cta = ctaFor(o, i18n);

  const body = (() => {
    switch (o.step) {
      case 0:
        return <StepWelcome pal={pal} onStart={() => o.go(1)} />;
      case 1:
        return (
          <StepMoneyIn
            pal={pal}
            income={o.income}
            payday={o.payday}
            sameDay={o.sameDay}
            dailyHint={o.dailyHint}
            onIncome={o.setIncome}
            onPayday={o.setPayday}
          />
        );
      case BILLS_STEP:
        return (
          <StepBills
            pal={pal}
            deck={o.deck}
            bills={o.bills}
            answers={o.answers}
            nav={o.nav}
            onAnswers={o.setAnswers}
            onGo={o.billGo}
          />
        );
      case 3:
        return (
          <StepFutureYou
            pal={pal}
            percent={o.percent}
            amount={o.futureYou}
            free={o.income - o.billSum - o.futureYou}
            onPercent={o.setPercent}
          />
        );
      case 4:
        return <StepPayWith pal={pal} wallets={o.wallets} onToggle={o.toggleWallet} />;
      case AI_STEP:
        return <StepAi pal={pal} />;
      case 6:
        return (
          <StepCatching
            pal={pal}
            date={`${i18n.weekday(new Date())} ${i18n.dayMonth(new Date())}`}
            closeAt={o.closeAt}
            safe={money.short(o.first.line)}
          />
        );
      case CLOSE_STEP:
        return <StepCloseTime pal={pal} closeAt={o.closeAt} onCloseAt={o.setCloseAt} />;
      default:
        return (
          <StepFirstNumber
            pal={pal}
            income={o.income}
            bills={o.billSum}
            futureYou={o.futureYou}
            first={o.first}
            closeAt={o.closeAt}
            reminded={o.reminders !== false}
            leaving={o.leaving}
          />
        );
    }
  })();

  // The welcome rises and the reveal fades in on their own; every other step slides in.
  const ownEntrance = o.step === 0 || o.step === LAST_STEP;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={pal.dark ? 'light' : 'dark'} animated />
      <OnboardingSky step={o.step} safeTop={insets.top} />
      <View
        style={{
          flex: 1,
          paddingTop: top(60),
          paddingHorizontal: 20,
          paddingBottom: bottom(30),
        }}
      >
        <OnboardingHeader
          step={o.step}
          pal={pal}
          showSkip={o.step >= BILLS_STEP && o.step <= 5}
          onBack={o.back}
          onSkip={o.skip}
        />
        {line !== null ? (
          <CompanionLine step={o.step} line={line} mood={stepMood(o)} pal={pal} top={top(112)} />
        ) : null}
        <Animated.View
          key={o.step}
          {...(ownEntrance ? {} : { entering: stepEntering(o.direction, reduceMotion) })}
          style={{ flex: 1, minHeight: 0 }}
        >
          {body}
        </Animated.View>
        {o.step >= 1 ? (
          <OnboardingCta
            label={cta.label}
            icon={cta.icon}
            hot={o.step === LAST_STEP}
            pal={pal}
            onPress={o.next}
          />
        ) : null}
      </View>
      {o.leaving ? <LeavingOverlay step={o.step} line={o.first.line} pal={pal} /> : null}
    </View>
  );
}
