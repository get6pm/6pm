import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { groupDigits } from '@6pm/domain';

import { Companion } from '../../ui/companion/companion';
import { PaperEdge } from '../../ui/paper-edge';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, mono } from '../../ui/type/fonts';

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
