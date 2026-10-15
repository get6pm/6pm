import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { CategoryTile } from '../../ui/category-tile';
import { DashedRule } from '../../ui/dashed-rule';
import { FitWidth } from '../../ui/layout/fit-width';
import { PaperEdge } from '../../ui/paper-edge';
import { useTheme } from '../../ui/theme/theme';
import { body, display, mono, tabular } from '../../ui/type/fonts';
import { AmountText } from '../quick-add/amount-text';
import type { SpendRowView } from '../today/spend-row';
import { useMoneyFormat } from '../../money/use-money-format';

const PAPER = '#f4efe4';
const INK = '#2a2230';
const INK_SOFT = 'rgba(42,34,48,.6)';
const RULE = 'rgba(42,34,48,.25)';

export interface CloseCardContent {
  readonly row: SpendRowView;
  readonly no: string;
  readonly source: string;
  readonly time: string;
  readonly category: string;
  readonly amount: number;
  readonly keptBefore: number;
  readonly detail: string | null;
  readonly labels: {
    readonly keptSoFar: string;
    readonly withThis: string;
    readonly keep: string;
    readonly edit: string;
    readonly notMine: string;
  };
}

/** Runs on the UI thread inside the stamps' animated styles. */
function clamp(v: number): number {
  'worklet';
  return Math.min(1, Math.max(0, v));
}

/** A stamp that inks in as the card is dragged toward its verdict. */
function Stamp({
  label,
  color,
  rotate,
  style,
  opacity,
  size = 24,
  spacing = 0.16,
}: {
  readonly label: string;
  readonly color: string;
  readonly rotate: string;
  readonly style: object;
  readonly opacity: () => number;
  readonly size?: number;
  readonly spacing?: number;
}) {
  const fade = useAnimatedStyle(() => ({ opacity: opacity() }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          paddingVertical: 5,
          paddingHorizontal: 12,
          borderWidth: 3,
          borderColor: color,
          borderRadius: 6,
          transform: [{ rotate }],
          mixBlendMode: 'multiply',
        },
        style,
        fade,
      ]}
    >
      <Text style={{ ...mono(size, 600, spacing), color }}>{label}</Text>
    </Animated.View>
  );
}

/**
 * One caught spend on thermal paper: number and source, the merchant tile, the running total,
 * the amount in big type, where it was read from, and the three stamps.
 */
export function CloseCard({
  content,
  dx,
  dy,
  top,
}: {
  readonly content: CloseCardContent;
  readonly dx: SharedValue<number>;
  readonly dy: SharedValue<number>;
  readonly top: boolean;
}) {
  const { row, labels } = content;
  const money = useMoneyFormat();
  const { numK } = useTheme().palette;
  return (
    <View style={{ boxShadow: '0 22px 34px rgba(20,6,30,.32)' }}>
      <View
        style={{
          height: 340,
          paddingTop: 20,
          paddingHorizontal: 22,
          paddingBottom: 18,
          gap: 12,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          overflow: 'hidden',
          experimental_backgroundImage: `linear-gradient(180deg, #fdfaf3, ${PAPER})`,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text
            numberOfLines={1}
            style={{ ...mono(11.5, 400, 0.1), color: INK_SOFT, flexShrink: 1 }}
          >
            {content.no.toUpperCase()}
          </Text>
          <Text style={{ ...mono(11.5, 400, 0.1), color: INK_SOFT }}>{content.time}</Text>
        </View>
        <DashedRule color={RULE} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CategoryTile icon={row.icon} hue={row.hue} size={44} radius={15} glyph={25} />
          <View style={{ gap: 2, flexShrink: 1 }}>
            <Text numberOfLines={1} style={{ ...body(20, 650, -0.02), color: INK }}>
              {row.name}
            </Text>
            <Text style={{ ...body(13), color: INK_SOFT }}>{content.category}</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...mono(11.5, 400, 0.1), color: 'rgba(42,34,48,.62)' }}>
              {labels.keptSoFar}
            </Text>
            <Text style={{ ...mono(11.5), ...tabular, color: 'rgba(42,34,48,.62)' }}>
              {money.number(content.keptBefore)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...mono(11.5, 400, 0.1), color: INK }}>{labels.withThis}</Text>
            <Text style={{ ...mono(11.5, 600), ...tabular, color: INK }}>
              {money.number(content.keptBefore + content.amount)}
            </Text>
          </View>
        </View>
        {/* The prototype's inline `<span style="font-size:.42em; margin-left:4px">₫</span>`. */}
        <FitWidth height={72}>
          <AmountText
            parts={money.parts(content.amount)}
            numberOfLines={1}
            gap={'\u2006'}
            style={{
              ...display(72 * numK, 500, -0.02),
              ...tabular,
              lineHeight: 72 * numK,
              color: INK,
            }}
            symbol={{ ...display(30, 500), opacity: 0.55 }}
          />
        </FitWidth>
        {content.detail ? (
          <View style={{ gap: 10 }}>
            <DashedRule color={RULE} />
            <Text style={{ ...mono(11.5), color: 'rgba(42,34,48,.62)' }}>{content.detail}</Text>
          </View>
        ) : null}
        {top ? (
          <>
            <Stamp
              label={labels.keep}
              color="#2f7d55"
              rotate="-11deg"
              style={{ top: 96, left: 18 }}
              opacity={() => {
                'worklet';
                return clamp(dx.value / 90);
              }}
            />
            <Stamp
              label={labels.edit}
              color="#33599a"
              rotate="9deg"
              style={{ top: 96, right: 18 }}
              opacity={() => {
                'worklet';
                return clamp(-dx.value / 90);
              }}
            />
            <Stamp
              label={labels.notMine}
              color="#b5433a"
              rotate="-4deg"
              style={{ top: 112, alignSelf: 'center' }}
              size={22}
              spacing={0.14}
              opacity={() => {
                'worklet';
                return clamp(dy.value / 90);
              }}
            />
          </>
        ) : null}
      </View>
      <PaperEdge color={PAPER} />
    </View>
  );
}
