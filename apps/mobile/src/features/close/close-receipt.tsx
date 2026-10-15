import { useEffect, type ComponentRef, type Ref } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { DashedRule } from '../../ui/dashed-rule';
import { haptics } from '../../ui/haptics';
import { barcode } from './barcode';
import { PaperEdge } from '../../ui/paper-edge';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, families, leading, mono, tabular } from '../../ui/type/fonts';
import { useMoneyFormat } from '../../money/use-money-format';

const PAPER = '#f7f2e8';
const INK = '#2b2530';
const SOFT = 'rgba(43,37,48,.6)';
const RULE = 'rgba(43,37,48,.35)';
const STAMP = '#c0392b';
const print = Easing.bezier(0.45, 0.05, 0.4, 1);
const stampEase = Easing.bezier(0.3, 1.5, 0.5, 1);
const STAMP_MS = { delay: 1600, land: 300, rest: 200 };
/** From mount until the CLOSED stamp has landed and settled: the paper is final from here on. */
export const RECEIPT_SETTLE_MS = STAMP_MS.delay + STAMP_MS.land + STAMP_MS.rest;

export interface ReceiptLine {
  readonly time: string;
  readonly name: string;
  readonly amount: number;
}

/**
 * The day, printed: the paper feeds down out of a slot, then the CLOSED stamp lands in red ink
 * with a thump (the prototype's stampIn after 1.6 s).
 */
export function CloseReceipt(props: {
  readonly no: string;
  readonly dateLine: string;
  readonly rows: readonly ReceiptLine[];
  readonly claimBack: { readonly name: string; readonly amount: number } | null;
  readonly total: number;
  readonly tomorrow: number;
  readonly note: string;
  readonly closedAt: string;
  readonly labels: Record<
    'daily' | 'empty' | 'total' | 'tomorrow' | 'thanks' | 'closed' | 'share' | 'next' | 'claimBack',
    string
  >;
  readonly onShare: () => void;
  readonly onNext: () => void;
  /** The printed paper alone (no slot, no buttons), for sharing it as an image. */
  readonly paperRef: Ref<ComponentRef<typeof View>>;
}) {
  const money = useMoneyFormat();
  const { palette } = useTheme();
  const feed = useSharedValue(0);
  const stamp = useSharedValue(0);
  useEffect(() => {
    feed.value = withTiming(1, { duration: 1500, easing: print });
    stamp.value = withDelay(
      STAMP_MS.delay,
      withSequence(
        withTiming(0.6, { duration: STAMP_MS.land, easing: stampEase }, () =>
          runOnJS(haptics.tap)(),
        ),
        withTiming(1, { duration: STAMP_MS.rest }),
      ),
    );
  }, [feed, stamp]);
  const paper = useAnimatedStyle(() => ({
    transform: [{ translateY: `${(feed.value - 1) * 100}%` }],
  }));
  const stampStyle = useAnimatedStyle(() => {
    const t = stamp.value;
    const scale = t < 0.6 ? 2.4 - (t / 0.6) * (2.4 - 0.94) : 0.94 + ((t - 0.6) / 0.4) * 0.06;
    return {
      opacity: Math.min(0.92, t / 0.6),
      transform: [{ rotate: `${-14 + 7 * Math.min(1, t / 0.6)}deg` }, { scale }],
    };
  });
  const { labels } = props;

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 16, paddingTop: 18, minHeight: 0 }}>
      <View
        style={{
          width: 340,
          height: 14,
          borderRadius: 8,
          backgroundColor: '#0b0810',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,.8), 0 1px 0 rgba(255,255,255,.14)',
          zIndex: 2,
        }}
      />
      <View
        style={{
          width: 340,
          flex: 1,
          minHeight: 0,
          marginTop: -23,
          overflow: 'hidden',
          alignItems: 'center',
        }}
      >
        <Animated.View
          ref={props.paperRef}
          style={[
            { width: 306, paddingBottom: 40, boxShadow: '0 18px 24px rgba(15,5,25,.35)' },
            paper,
          ]}
        >
          <View
            style={{
              experimental_backgroundImage: `linear-gradient(180deg, #efe9dd 0px, #fcf9f2 30px, ${PAPER} 100%)`,
              paddingTop: 26,
              paddingHorizontal: 22,
              paddingBottom: 14,
              gap: 7,
            }}
          >
            <Text
              style={{
                ...leading(display(42, 500, -0.01), 42),
                color: INK,
                textAlign: 'center',
              }}
            >
              6pm
            </Text>
            <Text style={{ ...mono(11, 400, 0.2), color: SOFT, textAlign: 'center' }}>
              {labels.daily}
            </Text>
            <Text style={{ ...mono(11, 400, 0.08), color: SOFT, textAlign: 'center' }}>
              {props.dateLine}
            </Text>
            <DashedRule color={RULE} style={{ marginTop: 6, marginBottom: 2 }} />
            {props.rows.length === 0 ? (
              <Text
                style={{
                  ...mono(12.5, 400, 0.1),
                  color: SOFT,
                  textAlign: 'center',
                  paddingVertical: 8,
                }}
              >
                {labels.empty}
              </Text>
            ) : null}
            {props.rows.map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ ...mono(12.5), color: 'rgba(43,37,48,.5)' }}>{r.time}</Text>
                <Text numberOfLines={1} style={{ ...mono(12.5), color: INK, flex: 1 }}>
                  {r.name}
                </Text>
                <Text style={{ ...mono(12.5), ...tabular, color: INK }}>
                  {money.number(r.amount)}
                </Text>
              </View>
            ))}
            {props.claimBack ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ ...mono(12.5), color: 'rgba(43,37,48,.55)', flex: 1 }}>
                  {labels.claimBack}
                </Text>
                <Text style={{ ...mono(12.5), color: 'rgba(43,37,48,.55)' }}>
                  {money.number(props.claimBack.amount)}
                </Text>
              </View>
            ) : null}
            <DashedRule color={RULE} style={{ marginTop: 4, marginBottom: 2 }} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ ...mono(15, 600, 0.12), color: INK, flex: 1 }}>{labels.total}</Text>
              <Text style={{ ...mono(15, 600), ...tabular, color: INK }}>
                {money.full(props.total)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ ...mono(11.5, 400, 0.1), color: 'rgba(43,37,48,.7)', flex: 1 }}>
                {labels.tomorrow}
              </Text>
              <Text style={{ ...mono(11.5), color: 'rgba(43,37,48,.7)' }}>
                {money.full(props.tomorrow)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                paddingTop: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: families.hand,
                  fontSize: 21,
                  lineHeight: 21,
                  color: '#4a3550',
                  maxWidth: 150,
                  transform: [{ rotate: '-2deg' }],
                }}
              >
                {props.note}
              </Text>
              <Animated.View
                style={[
                  {
                    paddingTop: 6,
                    paddingHorizontal: 10,
                    paddingBottom: 5,
                    borderWidth: 2.5,
                    borderColor: STAMP,
                    borderRadius: 6,
                    mixBlendMode: 'multiply',
                  },
                  stampStyle,
                ]}
              >
                <Text
                  style={{
                    ...mono(13, 600, 0.14),
                    color: STAMP,
                    textAlign: 'center',
                    lineHeight: 15,
                  }}
                >
                  {labels.closed}
                  {'\n'}
                  {props.closedAt}
                </Text>
              </Animated.View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: 1.5,
                height: 30,
                marginTop: 8,
              }}
            >
              {barcode(Number(props.no)).map((w, i) => (
                <View key={i} style={{ width: w, height: '100%', backgroundColor: INK }} />
              ))}
            </View>
            <Text
              style={{ ...mono(10, 400, 0.24), color: 'rgba(43,37,48,.5)', textAlign: 'center' }}
            >
              {labels.thanks}
            </Text>
          </View>
          <PaperEdge color={PAPER} />
        </Animated.View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
        <PressScale
          scaleTo={0.97}
          onPress={props.onShare}
          style={{
            flex: 1,
            height: 56,
            borderRadius: 99,
            borderWidth: 0.5,
            borderColor: palette.glassBorder,
            backgroundColor: palette.glass,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(16, 600), color: palette.ink }}>{labels.share}</Text>
        </PressScale>
        <PressScale
          scaleTo={0.97}
          onPress={props.onNext}
          style={{
            flex: 2,
            height: 56,
            borderRadius: 99,
            backgroundColor: palette.btnBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(17, 650), color: palette.btnFg }}>{labels.next}</Text>
        </PressScale>
      </View>
    </View>
  );
}
