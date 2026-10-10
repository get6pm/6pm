import { Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { groupDigits } from '@6pm/domain';

import { CategoryTile } from '../../ui/category-tile';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { DashedRule } from '../../ui/dashed-rule';
import { PaperEdge } from '../../ui/paper-edge';
import { body, display, mono, tabular } from '../../ui/type/fonts';

const PAPER = '#fbf7ef';
const INK = '#231a24';
const SOFT = 'rgba(35,26,36,.5)';

/**
 * The ticket at the top of Quick add: a little receipt being written as you type — number and
 * time, the amount, what it was, and its category and wallet.
 */
export function QuickTicket({
  heading,
  stamp,
  amount,
  hint,
  note,
  placeholder,
  onNote,
  icon,
  hue,
  categoryLine,
}: {
  readonly heading: string;
  readonly stamp: string;
  readonly amount: number;
  readonly hint: string;
  readonly note: string;
  readonly placeholder: string;
  readonly onNote: (text: string) => void;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly categoryLine: string;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(50).duration(450)}
      style={{ marginHorizontal: 4, boxShadow: '0 16px 24px rgba(20,10,30,.22)' }}
    >
      <View style={{ transform: [{ scaleY: -1 }] }}>
        <PaperEdge color={PAPER} />
      </View>
      <View
        style={{
          backgroundColor: PAPER,
          paddingTop: 8,
          paddingHorizontal: 18,
          paddingBottom: 12,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ ...mono(10.5, 400, 0.14), color: SOFT, textTransform: 'uppercase' }}>
            {heading}
          </Text>
          <Text style={{ ...mono(10.5, 400, 0.14), color: SOFT, textTransform: 'uppercase' }}>
            {stamp}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 3, paddingVertical: 2 }}>
          <Text
            style={{
              ...display(60, 500, -0.02),
              ...tabular,
              lineHeight: 60,
              color: INK,
              opacity: amount > 0 ? 1 : 0.35,
            }}
          >
            {groupDigits(amount)}₫
          </Text>
          <Text style={{ ...mono(11.5), minHeight: 16, color: 'rgba(35,26,36,.55)' }}>{hint}</Text>
        </View>
        <DashedRule color="rgba(35,26,36,.18)" width={1.5} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
          <CategoryTile icon={icon} hue={hue} size={42} radius={14} glyph={23} />
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <TextInput
              value={note}
              onChangeText={onNote}
              placeholder={placeholder}
              placeholderTextColor="rgba(35,26,36,.35)"
              returnKeyType="done"
              style={{ fontSize: 17, fontWeight: '600', color: INK, padding: 0 }}
            />
            <Text numberOfLines={1} style={{ ...body(12.5), color: 'rgba(35,26,36,.55)' }}>
              {categoryLine}
            </Text>
          </View>
        </View>
      </View>
      <PaperEdge color={PAPER} />
    </Animated.View>
  );
}
