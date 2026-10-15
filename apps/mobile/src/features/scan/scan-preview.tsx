import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  homeKeypad,
  keypadHomeMinor,
  pressKey,
  VND,
  type BankInfo,
  type VietQR,
} from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { moneyFormatFor, useMoneyFormat } from '../../money/use-money-format';
import { BankLogo } from '../../ui/bank-logo/bank-logo';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { Keypad } from '../../ui/keypad';
import { FitWidth } from '../../ui/layout/fit-width';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTravel } from '../travel/travel-provider';
import { body, display, tabular } from '../../ui/type/fonts';
import type { PayOptions } from './pay-options';
import { dongInHome } from './priced-spend';
import { CardButton, ScanCard } from './scan-card';
import { scanColours as c } from './scan-colours';

/** A wallet tile on the card: its logo over its name, outlined in ink when picked. */
function WalletTile({
  bank,
  picked,
  onPress,
  wide,
}: {
  readonly bank: BankInfo;
  readonly picked: boolean;
  readonly onPress: () => void;
  readonly wide: boolean;
}) {
  return (
    <PressScale
      accessibilityRole="radio"
      accessibilityState={{ checked: picked }}
      onPress={onPress}
      style={{
        ...(wide ? { width: 108 } : { flex: 1 }),
        height: 64,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: picked ? c.cardInk : c.walletBorder,
        backgroundColor: picked ? c.walletPicked : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
      }}
    >
      <BankLogo
        id={bank.id}
        size={22}
        radius={7}
        neutral={c.cardSoft}
        neutralInk={c.card}
        edge={c.walletBorder}
      />
      <Text numberOfLines={1} style={{ ...body(13, 600), color: c.cardInk }}>
        {bank.shortName}
      </Text>
    </PressScale>
  );
}

/**
 * The scanned QR as a payment: who it goes to, the amount (typed here when the QR leaves it
 * open), the note the payee wrote, which of the user's banks to pay from, and the button that
 * hands off to it.
 */
export function ScanPreview({
  qr,
  payee,
  categoryId,
  options,
  onPay,
}: {
  readonly qr: VietQR;
  readonly payee: string;
  readonly categoryId: string;
  readonly options: PayOptions;
  readonly onPay: (amount: number, bank: BankInfo | null) => void;
}) {
  const { t, language } = useI18n();
  const { categories } = useMoney();
  const money = useMoneyFormat();
  const { dongQuote } = useTravel();
  // A VietQR is đồng, whatever the home currency: typed, shown and paid in đồng.
  const dong = moneyFormatFor(VND, language);
  const category = categories.find((x) => x.id === categoryId);
  const [keys, setKeys] = useState(() => homeKeypad(VND));
  const wallets = options.mode === 'wallets' ? options.wallets : [];
  const [picked, setPicked] = useState(wallets[0]?.id ?? null);
  const bank =
    options.mode === 'wallets'
      ? (wallets.find((w) => w.id === picked) ?? wallets[0] ?? null)
      : options.bank;
  const amount = qr.amount ?? keypadHomeMinor(keys);
  const parts = dong.parts(amount);
  // Away from a đồng home, what it comes to at home, under the đồng.
  const inHome =
    money.currency.code === VND.code || amount <= 0
      ? null
      : dongInHome(amount, money.currency, dongQuote);
  const wide = wallets.length > 3;
  const walletName = bank?.shortName ?? '';
  // Three or fewer share the row equally, as designed; more scroll sideways at a fixed width.
  const tiles = wallets.map((w) => (
    <WalletTile
      key={w.id}
      bank={w}
      wide={wide}
      picked={w.id === bank?.id}
      onPress={() => {
        haptics.tick();
        setPicked(w.id);
      }}
    />
  ));

  return (
    <ScanCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CategoryTile
          icon={category && isSymbolName(category.icon) ? category.icon : 'payments'}
          hue={category?.hue ?? 45}
          size={48}
          radius={16}
          glyph={27}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={1} style={{ ...body(18, 650, -0.02), color: c.cardInk }}>
            {payee}
          </Text>
          <Text numberOfLines={1} style={{ ...body(13), color: c.cardSoft }}>
            {[qr.bank?.shortName ?? qr.bin, qr.accountMasked, category?.name]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <FitWidth height={64}>
          <View
            accessible
            accessibilityLabel={dong.full(amount)}
            style={{ flexDirection: 'row', alignItems: 'baseline' }}
          >
            <Text
              style={{ ...display(64, 500, -0.02), ...tabular, lineHeight: 64, color: c.cardInk }}
            >
              {parts.number}
            </Text>
            <Text style={{ ...display(29, 500), marginLeft: 4, opacity: 0.6, color: c.cardInk }}>
              {parts.suffix}
            </Text>
          </View>
        </FitWidth>
        {inHome !== null && inHome.amount > 0 ? (
          <Text style={{ ...body(14), ...tabular, color: c.cardSoft }}>
            {t('inbox.inDong', { amount: money.full(inHome.amount) })}
          </Text>
        ) : null}
        {qr.amount === null ? (
          <Text style={{ ...body(14), color: c.cardSoft }}>{t('scan.howMuch')}</Text>
        ) : null}
        {qr.note ? (
          <Text numberOfLines={2} style={{ ...body(14), color: c.cardSoft }}>
            {t('scan.note', { note: qr.note })}
          </Text>
        ) : null}
      </View>
      {qr.amount === null ? (
        <Keypad
          onPress={(key) => setKeys((k) => pressKey(k, key))}
          ink={c.cardInk}
          keyBg={c.keyBg}
        />
      ) : null}
      {options.mode === 'wallets' ? (
        <View style={{ gap: 10 }}>
          <Text style={{ ...body(12, 600, 0.05), textTransform: 'uppercase', color: c.cardLabel }}>
            {t('scan.payWith')}
          </Text>
          {wide ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20, flexGrow: 0 }}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
              accessibilityRole="radiogroup"
            >
              {tiles}
            </ScrollView>
          ) : (
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
              {tiles}
            </View>
          )}
        </View>
      ) : (
        <Text style={{ ...body(14), color: c.cardSoft }}>{t('scan.merchantHint')}</Text>
      )}
      <View style={{ opacity: amount > 0 ? 1 : 0.4 }}>
        <CardButton
          solid
          height={56}
          label={
            options.mode === 'wallets'
              ? t('scan.open', { wallet: walletName })
              : t('scan.payInBank')
          }
          onPress={() => {
            if (amount <= 0) return;
            haptics.tap();
            onPay(amount, bank);
          }}
        />
      </View>
    </ScanCard>
  );
}
