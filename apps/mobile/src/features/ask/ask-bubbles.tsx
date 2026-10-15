import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';
import { answerBubbleIn, growEase, meBubbleIn, riseIn } from './ask-motion';
import type { AskBarsView, AskCard } from './ask-words';

/** The tail corner is tight (8), the rest round (22), as in the prototype. */
const OPEN = { borderTopLeftRadius: 22, borderTopRightRadius: 22 } as const;
const fromSix = { ...OPEN, borderBottomRightRadius: 22, borderBottomLeftRadius: 8 } as const;
const fromMe = { ...OPEN, borderBottomRightRadius: 8, borderBottomLeftRadius: 22 } as const;

/** 6pm's opening line. */
export function IntroBubble({ text }: { readonly text: string }) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={riseIn}
      style={{
        alignSelf: 'flex-start',
        maxWidth: '86%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        ...fromSix,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <Text style={{ ...body(16), lineHeight: 22.4, color: palette.ink }}>{text}</Text>
    </Animated.View>
  );
}

/** What the user asked. */
export function MeBubble({ text }: { readonly text: string }) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={meBubbleIn}
      style={{
        alignSelf: 'flex-end',
        maxWidth: '80%',
        paddingVertical: 11,
        paddingHorizontal: 15,
        ...fromMe,
        backgroundColor: palette.btnBg,
        transformOrigin: 'right bottom',
      }}
    >
      <Text style={{ ...body(16), lineHeight: 21.6, color: palette.btnFg }}>{text}</Text>
    </Animated.View>
  );
}

/** One of the Now / After bars; the After bar grows from the left once the bubble has landed. */
function BarRow({
  label,
  value,
  percent,
  fill,
  grows,
}: {
  readonly label: string;
  readonly value: string;
  readonly percent: number;
  readonly fill: string;
  readonly grows: boolean;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const grow = useSharedValue(grows && !reduceMotion ? 0 : 1);
  useEffect(() => {
    if (grows && !reduceMotion) {
      grow.value = withDelay(200, withTiming(1, { duration: 900, easing: growEase }));
    }
  }, [grows, reduceMotion, grow]);
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }] }));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ ...body(12), minWidth: 44, color: palette.inkSoft }}>{label}</Text>
      <View style={{ flex: 1, height: 10, borderRadius: 6, backgroundColor: palette.hair }}>
        <Animated.View
          style={[
            {
              height: '100%',
              width: `${percent}%`,
              borderRadius: 6,
              backgroundColor: fill,
              transformOrigin: 'left center',
            },
            barStyle,
          ]}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{ ...body(12, 600), minWidth: 78, textAlign: 'right', color: palette.ink }}
      >
        {value}
      </Text>
    </View>
  );
}

function Bars({ bars }: { readonly bars: AskBarsView }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ gap: 7 }}>
      <BarRow
        label={t('ask.bar.now')}
        value={bars.nowValue}
        percent={100}
        fill={palette.inkSoft}
        grows={false}
      />
      <BarRow
        label={t('ask.bar.after')}
        value={bars.afterValue}
        percent={bars.afterPercent}
        fill={palette.accent}
        grows
      />
    </View>
  );
}

/** An answer's buttons: the first does what the answer offers, filled; the other is outlined. */
function AnswerActions({
  actions,
  onAction,
}: {
  readonly actions: NonNullable<AskCard['actions']>;
  readonly onAction: (choice: 'go' | 'cancel') => void;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
      {actions.map((action) => (
        <PressScale
          key={action.id}
          accessibilityRole="button"
          scaleTo={0.95}
          onPress={() => {
            haptics.tap();
            onAction(action.id);
          }}
          style={{
            minHeight: 44,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 18,
            justifyContent: 'center',
            ...(action.primary
              ? { backgroundColor: palette.btnBg }
              : { borderWidth: 1, borderColor: palette.hair }),
          }}
        >
          <Text style={{ ...body(15, 600), color: action.primary ? palette.btnFg : palette.ink }}>
            {action.label}
          </Text>
        </PressScale>
      ))}
    </View>
  );
}

/** 6pm's answer: the sentence in the display face, the bars, the working, a note, any buttons. */
export function AnswerBubble({
  card,
  onAction,
}: {
  readonly card: AskCard;
  readonly onAction?: (choice: 'go' | 'cancel') => void;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={answerBubbleIn}
      style={{
        alignSelf: 'flex-start',
        width: '88%',
        padding: 16,
        ...fromSix,
        gap: 12,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        transformOrigin: 'left bottom',
      }}
    >
      <Text style={{ ...display(21, 500, -0.01), lineHeight: 25.2, color: palette.ink }}>
        {card.text}
      </Text>
      {card.bars === null ? null : <Bars bars={card.bars} />}
      {card.rows.length === 0 ? null : (
        <View style={{ gap: 6 }}>
          {card.rows.map((row) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 12,
                paddingTop: 6,
                borderTopWidth: 0.5,
                borderTopColor: palette.hair,
              }}
            >
              <Text style={{ ...body(13.5), ...tabular, flexShrink: 1, color: palette.inkSoft }}>
                {row.key}
              </Text>
              <Text style={{ ...body(13.5, 600), ...tabular, color: palette.ink }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      )}
      {card.note === null ? null : (
        <Text style={{ ...body(13.5), color: palette.inkSoft }}>{card.note}</Text>
      )}
      {card.actions === undefined || card.actions.length === 0 || onAction === undefined ? null : (
        <AnswerActions actions={card.actions} onAction={onAction} />
      )}
    </Animated.View>
  );
}

/** `dot`: rises and fades up for 40% of a second, back for 40%, rests for 20%. */
function Dot({ delay }: { readonly delay: number }) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const beat = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
    beat.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: ease }),
          withTiming(0, { duration: 400, easing: ease }),
          withTiming(0, { duration: 200 }),
        ),
        -1,
      ),
    );
  }, [delay, reduceMotion, beat]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + 0.75 * beat.value,
    transform: [{ translateY: -3 * beat.value }],
  }));
  return (
    <Animated.View
      style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: palette.ink }, style]}
    />
  );
}

/** Three dots while an answer is on its way. */
export function TypingBubble() {
  const { palette } = useTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        gap: 5,
        paddingVertical: 16,
        paddingHorizontal: 18,
        ...fromSix,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}
