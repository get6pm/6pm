import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { categoryHintOf, likelyCategoriesAt, parseBankLine } from '@6pm/domain';

import { DropTextView } from '../../../modules/drop-text';
import { useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { useToast } from '../../ui/toast/toast-host';
import { body, display, leading } from '../../ui/type/fonts';

const fade = {
  entering: FadeIn.duration(200).reduceMotion(ReduceMotion.System),
  exiting: FadeOut.duration(150).reduceMotion(ReduceMotion.System),
};

/**
 * Lets a payment line be dragged into 6pm from the bank app beside it in Split View, as on the
 * opened iPhone Duo. While a drag is over 6pm a card says where to drop it; a dropped line is read
 * for its merchant and amount and caught like any other capture, waiting for the close, under the
 * merchant's rule, its name's category or the hour's.
 */
export function BankDrop({ children }: { readonly children: ReactNode }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const toast = useToast();
  const [over, setOver] = useState(false);

  if (!DropTextView) return children;

  const catchLine = async (text: string) => {
    const line = parseBankLine(text, money.currency);
    if (!line) {
      toast(t('duo.drop.unread'));
      return;
    }
    const merchant = line.merchant || t('source.shared');
    const categories = store.getSnapshot().categories;
    const exists = (id: string | null | undefined) =>
      id ? categories.find((c) => c.id === id)?.id : undefined;
    const ruled = await actions.ruleCategory(merchant).catch(() => null);
    const likely = likelyCategoriesAt(new Date().getHours()).map((n) => n.toLowerCase());
    const categoryId =
      exists(ruled) ??
      exists(line.categoryHint ?? categoryHintOf(merchant)) ??
      categories.find((c) => likely.includes(c.id))?.id ??
      categories[0]?.id ??
      'food';
    await actions.captureSpend({
      amount: line.amount,
      categoryId,
      merchant,
      source: 'shared',
      status: 'caught',
      detail: text.trim().slice(0, 200),
    });
    haptics.success();
    toast(t('duo.drop.caught', { merchant, amount: money.short(line.amount) }));
  };

  return (
    <DropTextView
      style={{ flex: 1 }}
      onDragOver={(e) => setOver(e.nativeEvent.over)}
      onDropText={(e) => {
        setOver(false);
        void catchLine(e.nativeEvent.text).catch(() => toast(t('duo.drop.unread')));
      }}
    >
      {children}
      {over ? (
        <Animated.View
          {...fade}
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'rgba(10,6,18,.35)',
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 26,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: palette.accent,
              backgroundColor: palette.sheetSolid,
              padding: 24,
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Symbol name="add_box" size={36} color={palette.accent} />
            <Text
              style={{ ...leading(display(22, 500), 26), color: palette.ink, textAlign: 'center' }}
            >
              {t('duo.drop.title')}
            </Text>
            <Text
              style={{ ...body(14), lineHeight: 19, color: palette.inkSoft, textAlign: 'center' }}
            >
              {t('duo.drop.sub')}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </DropTextView>
  );
}
