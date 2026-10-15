import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useI18n } from '../../i18n/i18n';
import { useHomeCurrency } from '../../money/use-money-format';
import { haptics } from '../../ui/haptics';
import { useAiMode } from '../privacy/use-ai-mode';
import { CatchCard, type CatchAction, type CatchStatus } from './catch-card';
import { useSampleMoney } from './catch-demo-kit';
import { ScanDemo, ShareDemo } from './catch-demos';
import { EmailDemo, LockDemo } from './catch-demos-mail-lock';
import { VoiceDemo, WalletDemo } from './catch-demos-tap-voice';
import { CatchRail } from './catch-rail';
import { CatchSetupSheet } from './catch-setup-sheet';
import { catchWaysFor, type CatchWay, type WalkedWay } from './catch-ways';
import type { OnboardingPalette } from './onboarding-palette';
import { StepHeading } from './step-parts';

const CARD = 300;
const GAP = 10;
const PAGE = CARD + GAP;
const SIDE = 20;

/**
 * How 6pm catches spending: a tab per way above swipeable cards, each card a small live picture,
 * a line on what it does, and whether it works already. The two that need a minute outside 6pm
 * (the Wallet automation, mail forwarding) and sharing open their drawn walkthrough in a sheet.
 */
export function StepCatching({
  pal,
  date,
  closeAt,
  safe,
}: {
  readonly pal: OnboardingPalette;
  /** Today, for the Lock Screen picture ("Friday 9 October"). */
  readonly date: string;
  readonly closeAt: string;
  /** The user's own first number, short ("245k"), for the Lock Screen picture. */
  readonly safe: string;
}) {
  const { t } = useI18n();
  const aiMode = useAiMode();
  const ways = catchWaysFor(useHomeCurrency(), aiMode);
  const sample = useSampleMoney();
  const bodyOf = (way: CatchWay) =>
    way === 'add'
      ? t('onboarding.catch.add.body', { amount: sample.saidWords })
      : t(`onboarding.catch.${way}.body`);
  const { width: screen } = useWindowDimensions();
  const cards = useAnimatedRef<Animated.ScrollView>();
  const x = useSharedValue(0);
  const shown = useSharedValue(0);
  const [selected, setSelected] = useState(0);
  const [setup, setSetup] = useState<WalkedWay | null>(null);

  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
    const i = Math.round(e.contentOffset.x / PAGE);
    if (i !== shown.value) {
      shown.value = i;
      scheduleOnRN(setSelected, i);
    }
  });

  const pick = (index: number) => {
    haptics.tick();
    scrollTo(cards, index * PAGE, 0, true);
  };
  const open = (way: WalkedWay) => {
    haptics.tap();
    setSetup(way);
  };

  const ready = (label: string): CatchStatus => ({ label, ready: true });
  const nothingToDo = ready(t('onboarding.catch.readyNothing'));
  const setUp = (way: 'wallet' | 'email'): CatchAction => ({
    label: t('onboarding.catch.setUp'),
    accent: true,
    onPress: () => open(way),
  });

  const card = (way: CatchWay) => {
    switch (way) {
      case 'scan':
        return {
          demo: <ScanDemo pal={pal} />,
          status: nothingToDo,
        };
      case 'share':
        return {
          demo: <ShareDemo />,
          status: ready(t('onboarding.catch.ready')),
          action: {
            label: t('onboarding.catch.seeHow'),
            accent: false,
            onPress: () => open('share'),
          },
        };
      case 'wallet':
        return {
          demo: <WalletDemo />,
          status: { label: t('capture.wallet.time'), ready: false },
          action: setUp('wallet'),
        };
      case 'email':
        return {
          demo: <EmailDemo />,
          status: { label: t('capture.email.time'), ready: false },
          action: setUp('email'),
        };
      case 'add':
        return { demo: <VoiceDemo pal={pal} />, status: nothingToDo };
      case 'lock':
        return {
          demo: <LockDemo pal={pal} date={date} time={closeAt} safe={safe} />,
          status: ready(t('onboarding.catch.lock.ready')),
        };
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <StepHeading
        title={t('onboarding.catch.title')}
        sub={t('onboarding.catch.sub', { time: closeAt })}
        pal={pal}
      />
      <CatchRail pal={pal} x={x} page={PAGE} selected={selected} onPick={pick} ways={ways} />
      <Animated.ScrollView
        ref={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAGE}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -SIDE }}
        contentContainerStyle={{
          gap: GAP,
          paddingTop: 2,
          paddingBottom: 14,
          paddingLeft: SIDE,
          // Room for the last card to snap into place like the others.
          paddingRight: Math.max(SIDE, screen - SIDE - CARD),
        }}
      >
        {ways.map((way) => {
          const { demo, status, ...rest } = card(way);
          return (
            <CatchCard
              key={way}
              pal={pal}
              width={CARD}
              demo={demo}
              title={t(`onboarding.catch.${way}.title`)}
              text={bodyOf(way)}
              status={status}
              {...rest}
            />
          );
        })}
      </Animated.ScrollView>
      <CatchSetupSheet way={setup} onClose={() => setSetup(null)} />
    </View>
  );
}
