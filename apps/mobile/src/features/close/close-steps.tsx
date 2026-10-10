import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { formatShort, groupDigits } from '@6pm/domain';

import { Companion } from '../../ui/companion/companion';
import { DashedRule } from '../../ui/dashed-rule';
import { Symbol } from '../../ui/icons/symbol';
import { PaperEdge } from '../../ui/paper-edge';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, mono, tabular } from '../../ui/type/fonts';

/** The bubble pops with the design's springy `cubic-bezier(.2,1.6,.4,1)`. */
const pop = ZoomIn.springify().damping(9).stiffness(220);

export function SortedStep({
  title,
  sub,
  undoLabel,
  canUndo,
  onUndo,
}: {
  readonly title: string;
  readonly sub: string;
  readonly undoLabel: string;
  readonly canUndo: boolean;
  readonly onUndo: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        paddingBottom: 40,
      }}
    >
      <Animated.View
        entering={pop}
        style={{
          width: 104,
          height: 104,
          borderRadius: 52,
          backgroundColor: palette.accent,
          boxShadow: '0 18px 40px rgba(255,120,70,.4), inset 0 1px 0 rgba(255,255,255,.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="check" size={56} weight={600} color="#2a1424" />
      </Animated.View>
      <Animated.Text
        entering={FadeInDown.delay(150).duration(400)}
        style={{ ...display(42, 500, -0.01), color: palette.ink, paddingTop: 8 }}
      >
        {title}
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(250).duration(400)}
        style={{ ...body(15), color: palette.inkSoft }}
      >
        {sub}
      </Animated.Text>
      {canUndo ? (
        <PressScale
          onPress={onUndo}
          style={{
            marginTop: 10,
            height: 36,
            paddingLeft: 10,
            paddingRight: 14,
            borderRadius: 99,
            backgroundColor: palette.glass,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Symbol name="undo" size={18} color={palette.ink} />
          <Text style={{ ...body(14, 600), color: palette.ink }}>{undoLabel}</Text>
        </PressScale>
      ) : null}
    </Animated.View>
  );
}

export interface CashChip {
  readonly key: string;
  readonly name: string;
  readonly amount: number;
}

export function CashStep({
  title,
  sub,
  chips,
  added,
  totalLabel,
  doneLabel,
  noneLabel,
  onAdd,
  onDone,
}: {
  readonly title: string;
  readonly sub: string;
  readonly chips: readonly CashChip[];
  readonly added: readonly CashChip[];
  readonly totalLabel: string;
  readonly doneLabel: string;
  readonly noneLabel: string;
  readonly onAdd: (chip: CashChip) => void;
  readonly onDone: () => void;
}) {
  const { palette } = useTheme();
  const total = added.reduce((sum, c) => sum + c.amount, 0);
  return (
    <Animated.View entering={FadeInDown.duration(450)} style={{ flex: 1, gap: 20, paddingTop: 22 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ ...display(40, 500, -0.01), lineHeight: 40.8, color: palette.ink }}>
          {title}
        </Text>
        <Text style={{ ...body(15), lineHeight: 21.75, color: palette.inkSoft, paddingTop: 4 }}>
          {sub}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {chips.map((chip) => (
          <PressScale
            key={chip.key}
            onPress={() => onAdd(chip)}
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 99,
              borderWidth: 0.5,
              borderColor: palette.glassBorder,
              backgroundColor: palette.glass,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text style={{ ...body(15, 600), color: palette.ink }}>{chip.name}</Text>
            <Text style={{ ...body(15, 500), color: palette.ink, opacity: 0.6 }}>
              {formatShort(chip.amount)}
            </Text>
          </PressScale>
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {added.map((chip, i) => (
          <Animated.View
            key={`${chip.key}-${i}`}
            entering={FadeInDown.duration(300)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 6,
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ ...mono(13, 400, 0.04), color: palette.ink }}>+ {chip.name}</Text>
            <Text style={{ ...mono(13), ...tabular, color: palette.ink }}>
              {groupDigits(chip.amount)}
            </Text>
          </Animated.View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <DashedRule color={palette.inkSoft} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: -8,
          paddingHorizontal: 4,
        }}
      >
        <Text style={{ ...mono(11.5, 400, 0.12), color: palette.inkSoft }}>{totalLabel}</Text>
        <Text style={{ ...body(15, 600), ...tabular, color: palette.ink }}>
          {groupDigits(total)}₫
        </Text>
      </View>
      <PressScale
        scaleTo={0.97}
        onPress={onDone}
        style={{
          height: 56,
          borderRadius: 99,
          backgroundColor: palette.btnBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(17, 650), color: palette.btnFg }}>
          {added.length ? doneLabel : noneLabel}
        </Text>
      </PressScale>
    </Animated.View>
  );
}

export function WorkQuestionStep({
  line,
  receiptLine,
  title,
  sub,
  yes,
  no,
  onAnswer,
}: {
  readonly line: string | null;
  readonly receiptLine: { readonly time: string; readonly name: string; readonly amount: number };
  readonly title: string;
  readonly sub: string;
  readonly yes: string;
  readonly no: string;
  readonly onAnswer: (forWork: boolean) => void;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(450)} style={{ flex: 1, gap: 20, paddingTop: 56 }}>
      {line ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          <Companion size={84} mood="think" />
          <View
            style={{
              marginBottom: 48,
              paddingVertical: 8,
              paddingHorizontal: 13,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
              borderBottomLeftRadius: 4,
              backgroundColor: palette.bubbleBg,
            }}
          >
            <Text style={{ ...display(18), color: palette.bubbleFg }}>{line}</Text>
          </View>
        </View>
      ) : null}
      <View
        style={{
          alignSelf: 'flex-start',
          transform: [{ rotate: '-1.5deg' }],
          boxShadow: '0 10px 18px rgba(20,6,30,.3)',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 14,
            alignItems: 'baseline',
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: 10,
            backgroundColor: '#f7f2e8',
          }}
        >
          <Text style={{ ...mono(12.5), color: 'rgba(43,37,48,.55)' }}>{receiptLine.time}</Text>
          <Text style={{ ...mono(12.5), color: '#2b2530' }}>{receiptLine.name.toUpperCase()}</Text>
          <Text style={{ ...mono(12.5, 600), color: '#2b2530' }}>
            {groupDigits(receiptLine.amount)}
          </Text>
        </View>
        <PaperEdge color="#f7f2e8" height={7} step={10} radius={4.75} />
      </View>
      <Text style={{ ...display(44, 500, -0.01), lineHeight: 45.8, color: palette.ink }}>
        {title}
      </Text>
      <Text style={{ ...body(16), lineHeight: 23.2, color: palette.inkSoft }}>{sub}</Text>
      <View style={{ flex: 1 }} />
      <PressScale
        scaleTo={0.97}
        onPress={() => onAnswer(true)}
        style={{
          height: 56,
          borderRadius: 99,
          backgroundColor: palette.btnBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(17, 650), color: palette.btnFg }}>{yes}</Text>
      </PressScale>
      <PressScale
        scaleTo={0.97}
        onPress={() => onAnswer(false)}
        style={{
          height: 56,
          borderRadius: 99,
          borderWidth: 1,
          borderColor: palette.inkSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(17, 600), color: palette.ink }}>{no}</Text>
      </PressScale>
    </Animated.View>
  );
}
