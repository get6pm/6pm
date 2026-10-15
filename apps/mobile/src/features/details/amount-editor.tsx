import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  editKeypadOf,
  editedAmount,
  foreignAmountText,
  formatTypedForeign,
  formatVnd,
  groupDigits,
  pressEditKey,
  travelCurrency,
  type KeypadState,
  type SpendAmount,
} from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Keypad, type KeypadCurrencyKey } from '../../ui/keypad';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';

/** "Rp496.650" as typed so far; a currency without a symbol writes its code after the digits. */
function typedText(keys: KeypadState): string {
  const known = travelCurrency(keys.currency);
  return known ? formatTypedForeign(keys.digits, known) : `${keys.digits || '0'} ${keys.currency}`;
}

/**
 * The detail's amount, and fixing it: tapped, Quick add's keypad opens under it and the number
 * follows the keys. A spend from abroad is typed in its own currency and re-priced at the rate it
 * was priced at, with the currency key to switch it to đồng. Done saves; Cancel leaves it as it was.
 */
export function AmountEditor({
  spend,
  editing,
  onEditing,
  onSave,
}: {
  readonly spend: SpendAmount;
  readonly editing: boolean;
  readonly onEditing: (editing: boolean) => void;
  readonly onSave: (amount: SpendAmount) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [keys, setKeys] = useState<KeypadState>(() => editKeypadOf(spend));
  // The first key types over the amount, as it does in a selected field.
  const [fresh, setFresh] = useState(true);
  const shown = editing ? editedAmount(keys, spend) : spend;
  const foreign = editing ? (keys.currency === 'VND' ? null : keys) : null;
  const begin = () => {
    haptics.tick();
    setKeys(editKeypadOf(spend));
    setFresh(true);
    onEditing(true);
  };
  const done = () => {
    haptics.tap();
    onSave(shown);
    onEditing(false);
  };
  const currencyKey: KeypadCurrencyKey | undefined = spend.foreignAmount
    ? {
        label:
          keys.currency === 'VND'
            ? (travelCurrency(spend.foreignAmount.currency)?.symbol ?? spend.foreignAmount.currency)
            : '₫',
        accessibilityLabel: t('travel.quick.currency'),
        decimal: keys.currency !== 'VND' && (keys.foreign?.decimals ?? 0) > 0,
      }
    : undefined;

  const big = foreign
    ? typedText(foreign)
    : shown.foreignAmount
      ? foreignAmountText(shown.foreignAmount)
      : null;
  const under = shown.foreignAmount
    ? shown.foreignAmount.rate > 0 && shown.amount > 0
      ? t('inbox.inDong', { amount: formatVnd(shown.amount) })
      : t('inbox.ratePending')
    : null;

  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 10 }}>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('details.amount.edit')}
        disabled={editing}
        onPress={begin}
        style={{ alignItems: 'center', gap: 4, paddingTop: 8 }}
      >
        {big !== null ? (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ ...display(56, 500, -0.02), ...tabular, lineHeight: 60, color: palette.ink }}
          >
            {big}
          </Text>
        ) : (
          <Text
            style={{
              ...display(72, 500, -0.02),
              ...tabular,
              lineHeight: 72,
              color: palette.ink,
              opacity: shown.amount > 0 ? 1 : 0.35,
            }}
          >
            {groupDigits(shown.amount)}
            <Text style={{ ...display(29, 500), opacity: 0.55 }}>{' ₫'}</Text>
          </Text>
        )}
        {under !== null ? (
          <Text style={{ ...body(14), ...tabular, color: palette.inkSoft }}>{under}</Text>
        ) : null}
      </PressScale>
      {editing ? (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={{ alignSelf: 'stretch', gap: 12 }}
        >
          <Keypad
            onPress={(key) => {
              setKeys((k) => pressEditKey(k, key, fresh));
              setFresh(false);
            }}
            {...(currencyKey ? { currency: currencyKey } : {})}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PressScale
              scaleTo={0.97}
              onPress={() => {
                haptics.tick();
                onEditing(false);
              }}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 18,
                backgroundColor: palette.chipBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(17, 600), color: palette.ink }}>{t('quick.cancel')}</Text>
            </PressScale>
            <PressScale
              scaleTo={0.97}
              disabled={shown.amount <= 0}
              onPress={done}
              style={{
                flex: 2,
                height: 52,
                borderRadius: 18,
                backgroundColor: palette.btnBg,
                opacity: shown.amount > 0 ? 1 : 0.4,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(17, 650), color: palette.btnFg }}>{t('common.done')}</Text>
            </PressScale>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
