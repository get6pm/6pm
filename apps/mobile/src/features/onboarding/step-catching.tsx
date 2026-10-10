import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { body } from '../../ui/type/fonts';
import { ScanDemo, ShareDemo } from './catch-demos';
import { EmailDemo, LockDemo } from './catch-demos-mail-lock';
import type { OnboardingPalette } from './onboarding-palette';
import { StepHeading } from './step-parts';

const CARD = 300;
const GAP = 10;
const PAGE = CARD + GAP;
const CARDS = 4;

function DemoCard({
  pal,
  demo,
  title,
  text,
  status,
}: {
  readonly pal: OnboardingPalette;
  readonly demo: ReactNode;
  readonly title: string;
  readonly text: string;
  readonly status: { readonly label: string; readonly icon: SymbolName; readonly ready: boolean };
}) {
  return (
    <View
      style={{
        width: CARD,
        borderRadius: 28,
        backgroundColor: pal.cell,
        boxShadow: pal.cardShadow,
        padding: 10,
        gap: 12,
      }}
    >
      {demo}
      <View style={{ paddingHorizontal: 8, gap: 4 }}>
        <Text style={{ ...body(18, 650, -0.015), color: pal.ink }}>{title}</Text>
        <Text style={{ ...body(13.5), lineHeight: 18.9, color: pal.inkSoft }}>{text}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View
        style={{
          marginHorizontal: 6,
          marginBottom: 6,
          height: 42,
          borderRadius: 99,
          backgroundColor: status.ready ? pal.greenSoft : pal.chipBg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Symbol name={status.icon} size={18} color={status.ready ? pal.okInk : pal.inkSoft} />
        <Text style={{ ...body(14, 650), color: status.ready ? pal.okInk : pal.inkSoft }}>
          {status.label}
        </Text>
      </View>
    </View>
  );
}

/** A page dot: stretches to 18 pt and brightens as its card comes under the finger. */
function Dot({
  index,
  x,
  pal,
}: {
  readonly index: number;
  readonly x: SharedValue<number>;
  readonly pal: OnboardingPalette;
}) {
  const style = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(x.value / PAGE - index));
    return { width: 6 + 12 * near, opacity: 0.25 + 0.65 * near };
  });
  return (
    <Animated.View style={[{ height: 6, borderRadius: 6, backgroundColor: pal.ink }, style]} />
  );
}

/**
 * How 6pm catches spending: swipeable cards, each with a small live picture. Scan to pay works
 * already; the others are set up later from Settings, so they say so instead of pretending.
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
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });
  const later = { label: t('onboarding.catch.later'), icon: 'schedule', ready: false } as const;
  return (
    <View style={{ gap: 14 }}>
      <StepHeading title={t('onboarding.catch.title')} sub={t('onboarding.catch.sub')} pal={pal} />
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAGE}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{
          gap: GAP,
          paddingTop: 4,
          paddingBottom: 14,
          paddingHorizontal: 20,
        }}
      >
        <DemoCard
          pal={pal}
          demo={<ScanDemo pal={pal} />}
          title={t('onboarding.catch.scan.title')}
          text={t('onboarding.catch.scan.body')}
          status={{ label: t('onboarding.catch.scan.ready'), icon: 'check_circle', ready: true }}
        />
        <DemoCard
          pal={pal}
          demo={<ShareDemo />}
          title={t('onboarding.catch.share.title')}
          text={t('onboarding.catch.share.body')}
          status={later}
        />
        <DemoCard
          pal={pal}
          demo={<EmailDemo />}
          title={t('onboarding.catch.email.title')}
          text={t('onboarding.catch.email.body')}
          status={later}
        />
        <DemoCard
          pal={pal}
          demo={<LockDemo pal={pal} date={date} time={closeAt} safe={safe} />}
          title={t('onboarding.catch.lock.title')}
          text={t('onboarding.catch.lock.body')}
          status={later}
        />
      </Animated.ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -4 }}>
        {Array.from({ length: CARDS }, (_, i) => (
          <Dot key={i} index={i} x={x} pal={pal} />
        ))}
      </View>
    </View>
  );
}
