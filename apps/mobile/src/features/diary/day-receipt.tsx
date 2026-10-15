import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useMoneyFormat } from '../../money/use-money-format';
import { DashedRule } from '../../ui/dashed-rule';
import { PaperEdge } from '../../ui/paper-edge';
import { families, mono, tabular } from '../../ui/type/fonts';
import { paper } from './diary-colours';

export interface DayReceiptView {
  readonly day: string;
  readonly title: string;
  readonly no: string;
  readonly rows: readonly {
    readonly time: string;
    readonly name: string;
    readonly amount: number;
  }[];
  readonly empty: string;
  readonly totalLabel: string;
  readonly total: number;
  readonly note: string;
  readonly stamp: string;
  readonly closedAt: string;
}

/**
 * A closed day's receipt under the calendar: torn top and bottom, tilted a degree, the day's kept
 * spends, its total, a handwritten note and the CLOSED stamp with the time (or LATE).
 */
export function DayReceipt({ receipt }: { readonly receipt: DayReceiptView }) {
  const money = useMoneyFormat();
  const line = { ...mono(12), color: paper.ink };
  return (
    <View style={{ alignItems: 'center', marginTop: -6 }}>
      <Animated.View
        key={receipt.day}
        entering={FadeIn.duration(250)}
        style={{
          width: 306,
          transform: [{ rotate: '-1deg' }],
          boxShadow: '0 16px 22px rgba(15,5,25,.3)',
        }}
      >
        <View style={{ transform: [{ scaleY: -1 }] }}>
          <PaperEdge color={paper.sheet} />
        </View>
        <View
          style={{
            backgroundColor: paper.sheet,
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: 14,
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...mono(12, 600, 0.12), color: paper.ink }}>{receipt.title}</Text>
            <Text style={{ ...mono(12, 600, 0.12), color: paper.ink, opacity: 0.55 }}>
              {receipt.no}
            </Text>
          </View>
          <DashedRule color={paper.rule} />
          {receipt.rows.length === 0 ? (
            <Text style={{ ...line, color: paper.soft, textAlign: 'center' }}>{receipt.empty}</Text>
          ) : null}
          {receipt.rows.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ ...line, color: paper.soft }}>{r.time}</Text>
              <Text numberOfLines={1} style={{ ...line, flex: 1, minWidth: 0 }}>
                {r.name}
              </Text>
              <Text style={{ ...line, ...tabular }}>{money.number(r.amount)}</Text>
            </View>
          ))}
          <DashedRule color={paper.rule} />
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ ...mono(14, 600, 0.12), color: paper.ink, flex: 1 }}>
              {receipt.totalLabel}
            </Text>
            <Text style={{ ...mono(14, 600), ...tabular, color: paper.ink }}>
              {money.full(receipt.total)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              paddingTop: 6,
            }}
          >
            <Text
              style={{
                fontFamily: families.hand,
                fontSize: 20,
                lineHeight: 21,
                color: paper.hand,
                maxWidth: 160,
                transform: [{ rotate: '-2deg' }],
              }}
            >
              {receipt.note}
            </Text>
            <View
              style={{
                paddingTop: 5,
                paddingHorizontal: 9,
                paddingBottom: 4,
                borderWidth: 2.5,
                borderColor: paper.stamp,
                borderRadius: 6,
                transform: [{ rotate: '-7deg' }],
                mixBlendMode: 'multiply',
              }}
            >
              <Text
                style={{
                  ...mono(12, 600, 0.14),
                  lineHeight: 14.4,
                  color: paper.stamp,
                  textAlign: 'center',
                }}
              >
                {receipt.stamp}
                {'\n'}
                {receipt.closedAt}
              </Text>
            </View>
          </View>
        </View>
        <PaperEdge color={paper.sheet} />
      </Animated.View>
    </View>
  );
}
