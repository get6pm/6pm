import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { FadeIn, useAnimatedStyle, ZoomIn } from 'react-native-reanimated';

import {
  homeKeypad,
  keypadHomeMinor,
  offersSplit,
  pressKey,
  splitShare,
  type ScannedCard,
  type ScannedEdits,
} from '@6pm/domain';

import type { ScannedReceipt } from '../../../modules/scan-camera';
import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { Keypad } from '../../ui/keypad';
import { FitWidth } from '../../ui/layout/fit-width';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, tabular } from '../../ui/type/fonts';
import { homeDecimalMark } from '../quick-add/typed-amount';
import { BillChip, SplitRow } from './receipt-extras';
import { CardButton, ScanCard } from './scan-card';
import { scanColours as c } from './scan-colours';
import type { BillChoice, ReceiptBill } from './use-receipt-scan';

/** A category to file the receipt under: its tile over its name, outlined in ink when picked. */
function CategoryChip({
  name,
  icon,
  hue,
  picked,
  onPress,
}: {
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
  readonly picked: boolean;
  readonly onPress: () => void;
}) {
  return (
    <PressScale
      accessibilityRole="radio"
      accessibilityState={{ checked: picked }}
      accessibilityLabel={name}
      onPress={onPress}
      style={{
        height: 44,
        paddingLeft: 6,
        paddingRight: 14,
        borderRadius: 99,
        borderWidth: 1.5,
        borderColor: picked ? c.cardInk : c.walletBorder,
        backgroundColor: picked ? c.walletPicked : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <CategoryTile
        icon={isSymbolName(icon) ? icon : 'payments'}
        hue={hue}
        size={30}
        radius={99}
        glyph={17}
      />
      <Text numberOfLines={1} style={{ ...body(14, 600), color: c.cardInk }}>
        {name}
      </Text>
    </PressScale>
  );
}

/**
 * The receipt as read, to check and save: the cut-out paper above, and on the paper card the shop,
 * the total (typed on the keypad when it could not be read, or changed), the category, and Retake
 * or Save. While the server takes a closer look it says so; its reading lands on the card when it
 * comes, unless the user has typed an amount of their own. A paper bill offers to pay the plan
 * bill it matched (on) or to add the bill it reads as (off); a big shop bill offers a split, and
 * then shows and saves the user's share.
 */
export function ReceiptCard({
  top,
  receipt,
  card,
  bill,
  looking,
  onRetake,
  onSave,
}: {
  /** Where the receipt picture may start, under the close button's row. */
  readonly top: number;
  readonly receipt: ScannedReceipt;
  readonly card: ScannedCard;
  readonly bill: ReceiptBill;
  readonly looking: boolean;
  readonly onRetake: () => void;
  readonly onSave: (edits: ScannedEdits, bill: BillChoice) => void;
}) {
  const { t } = useI18n();
  const { categories } = useMoney();
  const money = useMoneyFormat();
  const { palette } = useTheme();
  const keyboard = useReanimatedKeyboardAnimation();
  const [payee, setPayee] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [keys, setKeys] = useState(() => homeKeypad(money.currency));
  const [typing, setTyping] = useState(false);
  const [cardHeight, setCardHeight] = useState(0);
  // Off until tapped for a bill it only reads as; on for a plan bill it matched.
  const [billOn, setBillOn] = useState<boolean | null>(null);
  const [people, setPeople] = useState(1);

  const unread = card.amount === null && card.foreign === null;
  const keypadOpen = typing || (unread && !looking);
  const typed = keypadHomeMinor(keys);
  const usingTyped = keypadOpen && typed > 0;
  const total = usingTyped ? typed : card.amount;
  const billFace = bill.pays ?? bill.add;
  const paysBill = billOn ?? bill.pays !== null;
  const splits = billFace === null && card.kind === 'shop' && offersSplit(total, money.currency);
  const share =
    splits && people > 1 && total !== null ? splitShare(total, people, money.currency) : null;
  const totalText = usingTyped ? money.full(typed) : card.amountText;
  const parts =
    share !== null ? money.parts(share) : usingTyped ? money.parts(typed) : card.amountParts;
  const label = share !== null ? money.full(share) : totalText;
  const canSave = usingTyped || !unread;
  const picked = categoryId ?? card.categoryId ?? categories[0]?.id ?? null;
  const category = categories.find((x) => x.id === picked);
  const shownPayee = payee ?? card.payee;

  // A text field takes the face, not every text style `body` carries.
  const shop = body(18, 650, -0.02);
  const rise = useAnimatedStyle(() => ({ transform: [{ translateY: keyboard.height.value }] }));

  return (
    <Animated.View style={[{ position: 'absolute', inset: 0 }, rise]} pointerEvents="box-none">
      {cardHeight > 0 ? (
        <Animated.View
          entering={ZoomIn.duration(380).springify().damping(18)}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: top + 56,
            left: 32,
            right: 32,
            bottom: cardHeight + 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={{ uri: receipt.uri }}
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 14,
            }}
          />
        </Animated.View>
      ) : null}
      <ScanCard onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CategoryTile
            icon={category && isSymbolName(category.icon) ? category.icon : 'receipt_long'}
            hue={category?.hue ?? 45}
            size={48}
            radius={16}
            glyph={27}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <TextInput
              value={shownPayee}
              onChangeText={setPayee}
              placeholder={t('scan.receipt.payee')}
              placeholderTextColor={c.cardSoft}
              returnKeyType="done"
              autoCorrect={false}
              style={{
                fontFamily: shop.fontFamily,
                fontSize: shop.fontSize,
                fontWeight: shop.fontWeight,
                letterSpacing: shop.letterSpacing,
                color: c.cardInk,
                padding: 0,
              }}
            />
            <Text numberOfLines={1} style={{ ...body(13), color: c.cardSoft }}>
              {[card.whenText, category?.name].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FitWidth height={56}>
                <View
                  accessible
                  accessibilityLabel={label}
                  style={{ flexDirection: 'row', alignItems: 'baseline' }}
                >
                  {parts.prefix ? (
                    <Text
                      style={{
                        ...display(26, 500),
                        marginRight: 2,
                        opacity: 0.6,
                        color: c.cardInk,
                      }}
                    >
                      {parts.prefix}
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      ...leading(display(56 * palette.numK, 500, -0.02), 56 * palette.numK, true),
                      ...tabular,
                      color: unread && !usingTyped ? c.cardSoft : c.cardInk,
                    }}
                  >
                    {parts.number === '' ? '0' : parts.number}
                  </Text>
                  {parts.suffix ? (
                    <Text
                      style={{ ...display(26, 500), marginLeft: 4, opacity: 0.6, color: c.cardInk }}
                    >
                      {parts.suffix}
                    </Text>
                  ) : null}
                </View>
              </FitWidth>
            </View>
            {!keypadOpen && !unread ? (
              <CardButton
                label={t('scan.receipt.change')}
                height={40}
                onPress={() => {
                  haptics.tick();
                  setTyping(true);
                }}
              />
            ) : null}
          </View>
          {share !== null ? (
            <Text style={{ ...body(14), ...tabular, color: c.cardSoft }}>
              {t('scan.receipt.splitShare', { total: totalText })}
            </Text>
          ) : card.inHomeText && !usingTyped ? (
            <Text style={{ ...body(14), ...tabular, color: c.cardSoft }}>{card.inHomeText}</Text>
          ) : null}
          {looking ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <ActivityIndicator size="small" color={c.cardSoft} />
              <Text style={{ ...body(14), color: c.cardSoft }}>{t('scan.receipt.closer')}</Text>
            </Animated.View>
          ) : unread && !usingTyped ? (
            <Text style={{ ...body(14), color: c.cardSoft }}>{t('scan.receipt.noTotal')}</Text>
          ) : null}
        </View>
        {billFace !== null && !keypadOpen ? (
          <BillChip
            label={t(bill.pays ? 'scan.receipt.billPays' : 'scan.receipt.billAdd', {
              bill: billFace.name,
            })}
            icon={billFace.icon}
            hue={billFace.hue}
            on={paysBill}
            onPress={() => setBillOn(!paysBill)}
          />
        ) : null}
        {splits && !keypadOpen ? <SplitRow people={people} onChange={setPeople} /> : null}
        {keypadOpen ? (
          <Keypad
            onPress={(key) => setKeys((k) => pressKey(k, key))}
            ink={c.cardInk}
            keyBg={c.keyBg}
            decimal={homeDecimalMark(money)}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ marginHorizontal: -20, flexGrow: 0 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
            accessibilityRole="radiogroup"
          >
            {categories.map((x) => (
              <CategoryChip
                key={x.id}
                name={x.name}
                icon={x.icon}
                hue={x.hue}
                picked={x.id === picked}
                onPress={() => {
                  haptics.tick();
                  setCategoryId(x.id);
                }}
              />
            ))}
          </ScrollView>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <CardButton flex={1} label={t('scan.receipt.retake')} onPress={onRetake} />
          <View style={{ flex: 1.4, opacity: canSave ? 1 : 0.4 }}>
            <CardButton
              solid
              label={t('scan.receipt.save')}
              onPress={() => {
                if (!canSave) return;
                haptics.tap();
                const split = share !== null;
                onSave(
                  {
                    ...(usingTyped ? { amount: typed } : {}),
                    ...(payee !== null ? { payee } : {}),
                    ...(picked !== null ? { categoryId: picked } : {}),
                    ...(split
                      ? {
                          people,
                          note: t('scan.receipt.splitNote', { count: people, total: totalText }),
                        }
                      : {}),
                  },
                  paysBill && billFace !== null ? (bill.pays ? 'pays' : 'add') : null,
                );
              }}
            />
          </View>
        </View>
      </ScanCard>
    </Animated.View>
  );
}
