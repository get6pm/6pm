import { memo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { dayDot } from '@6pm/domain';
import { paperInk, zineInk } from '@6pm/theme';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display, families, leading, mono, tabular } from '../../ui/type/fonts';
import { dots } from '../diary/diary-colours';
import { merchantIcon } from '../today/merchant-icon';
import type { DiaryDayView } from './diary-bridge';

const turnIn = FadeIn.duration(300).reduceMotion(ReduceMotion.System);

function Step({
  icon,
  label,
  onPress,
}: {
  readonly icon: 'expand_less' | 'expand_more';
  readonly label: string;
  readonly onPress: (() => void) | null;
}) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: onPress === null }}
      disabled={onPress === null}
      scaleTo={0.94}
      onPress={() => {
        haptics.tick();
        onPress?.();
      }}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: zineInk.track,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: onPress === null ? 0.35 : 1,
      }}
    >
      <Symbol name={icon} size={24} color={paperInk.ink} />
    </PressScale>
  );
}

/**
 * The right page of the iPhone Duo opened beside the Diary: the chosen day written into a
 * notebook. What was spent against the day's line, the CLOSED stamp (green under the line, red
 * over), the handwritten note and each spend, with steps to the closed days either side.
 */
export const DayPane = memo(function DayPane({ view }: { readonly view: DiaryDayView }) {
  const { t } = useI18n();
  const money = useMoneyFormat();
  const { categories } = useMoney();
  const { receipt } = view;
  const stamp = dayDot(receipt.total, receipt.line) === 'under' ? dots.paperUnder : paperInk.stamp;

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 32,
        backgroundColor: paperInk.sheet,
        boxShadow: '0 20px 50px rgba(20,8,30,.25)',
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', right: 14, top: 14, gap: 10, zIndex: 1 }}>
        <Step icon="expand_less" label={t('duo.day.previous')} onPress={view.onPrevious} />
        <Step icon="expand_more" label={t('duo.day.next')} onPress={view.onNext} />
      </View>
      <Animated.View key={receipt.day} entering={turnIn} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 30,
            paddingLeft: 26,
            paddingRight: 72,
            paddingBottom: 30,
            gap: 16,
          }}
        >
          <Text style={{ ...mono(11, 400, 0.16), color: paperInk.soft }}>
            {`${receipt.title} · ${receipt.stamp} ${receipt.closedAt}`}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ gap: 4, flexShrink: 1 }}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  ...leading(display(76, 500, -0.03), 72, true),
                  ...tabular,
                  color: paperInk.ink,
                }}
              >
                {money.short(receipt.total)}
              </Text>
              <Text style={{ ...body(14), color: paperInk.soft }}>
                {t('duo.day.ofLine', { line: money.short(receipt.line) })}
              </Text>
            </View>
            <View
              style={{
                marginBottom: 8,
                paddingTop: 6,
                paddingHorizontal: 10,
                paddingBottom: 5,
                borderWidth: 2.5,
                borderColor: stamp,
                borderRadius: 6,
                transform: [{ rotate: '-7deg' }],
                opacity: 0.9,
              }}
            >
              <Text style={{ ...mono(13, 600, 0.14), color: stamp, textAlign: 'center' }}>
                {receipt.stamp}
              </Text>
              <Text style={{ ...mono(13, 600, 0.14), color: stamp, textAlign: 'center' }}>
                {receipt.closedAt}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: families.hand,
              fontSize: 22,
              lineHeight: 27.5,
              color: paperInk.hand,
            }}
          >
            {`“${receipt.note}”`}
          </Text>
          <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: paperInk.rule }}>
            {receipt.rows.length === 0 ? (
              <Text style={{ ...body(15), color: paperInk.soft, paddingVertical: 12 }}>
                {receipt.empty}
              </Text>
            ) : (
              receipt.rows.map((row, k) => {
                const category = categories.find((c) => c.id === row.categoryId);
                const icon = merchantIcon(
                  row.merchant,
                  category && isSymbolName(category.icon) ? category.icon : 'payments',
                );
                return (
                  <View
                    key={`${row.time}-${k}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 11,
                      borderBottomWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: paperInk.rule,
                    }}
                  >
                    <CategoryTile
                      icon={icon}
                      hue={category?.hue ?? 80}
                      size={34}
                      radius={12}
                      glyph={19}
                    />
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, ...body(15, 550), color: paperInk.ink }}
                    >
                      {row.merchant}
                    </Text>
                    <Text style={{ ...mono(14, 500), ...tabular, color: paperInk.ink }}>
                      {money.short(row.amount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
});
