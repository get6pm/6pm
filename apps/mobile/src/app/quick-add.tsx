import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { emptyKeypad, keypadVnd, likelyCategoriesAt, pressKey, type KeypadKey } from '@6pm/domain';

import { useMoney, useMoneyActions } from '../data/money-provider';
import { QuickTicket } from '../features/quick-add/quick-ticket';
import { useI18n } from '../i18n/i18n';
import { CategoryTile } from '../ui/category-tile';
import { haptics } from '../ui/haptics';
import { isSymbolName, Symbol } from '../ui/icons/symbol';
import type { SymbolName } from '../ui/icons/symbols.generated';
import { PressScale } from '../ui/primitives/press-scale';
import { useClock } from '../ui/theme/clock';
import { SheetFrame } from '../ui/navigation/sheet-frame';
import { useTheme } from '../ui/theme/theme';
import { body, display } from '../ui/type/fonts';

const KEYS: (KeypadKey | null)[] = [
  '1',
  '2',
  '3',
  'back',
  '4',
  '5',
  '6',
  'k',
  '7',
  '8',
  '9',
  '000',
  null,
  '0',
  null,
  null,
];
const WALLETS: { id: string; icon: SymbolName }[] = [
  { id: 'Cash', icon: 'payments' },
  { id: 'MB Bank', icon: 'account_balance' },
  { id: 'MoMo', icon: 'account_balance_wallet' },
];

/** Quick add: type it in a few taps, the category most likely at this hour already picked. */
export default function QuickAdd() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const { now, hour } = useClock();
  const snap = useMoney();
  const actions = useMoneyActions();
  const [keys, setKeys] = useState(emptyKeypad);
  const [note, setNote] = useState('');
  const [wallet, setWallet] = useState('Cash');
  const likely = likelyCategoriesAt(hour).map((name) => name.toLowerCase());
  const ordered = [...snap.categories].sort(
    (a, b) => (likely.indexOf(a.id) + 1 || 9) - (likely.indexOf(b.id) + 1 || 9),
  );
  const [categoryId, setCategoryId] = useState(ordered[0]?.id ?? '');
  const category = snap.categories.find((c) => c.id === categoryId);
  const amount = keypadVnd(keys, 0);
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const stamp = `${new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(now)} · ${new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(now)}`;

  const press = (key: KeypadKey) => {
    haptics.tick();
    setKeys((s) => pressKey(s, key));
  };
  const save = async () => {
    if (amount <= 0 || !category) return;
    await actions.addSpend({
      amount,
      categoryId: category.id,
      merchant: note.trim() || category.name,
      source: 'manual',
      status: 'kept',
      wallet,
    });
    haptics.success();
    router.back();
  };

  const header = (
    <View style={{ paddingTop: 8, paddingHorizontal: 16, gap: 8 }}>
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: palette.inkSoft,
          opacity: 0.35,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PressScale onPress={() => router.back()} style={{ width: 60, paddingVertical: 6 }}>
          <Text style={{ ...body(16), color: palette.inkSoft }}>{t('quick.cancel')}</Text>
        </PressScale>
        <Text style={{ ...body(17, 650), color: palette.ink }}>{t('home.quickAdd')}</Text>
        <View style={{ width: 60 }} />
      </View>
    </View>
  );

  return (
    <SheetFrame header={header}>
      <View style={{ flex: 1, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 22, gap: 14 }}>
        <QuickTicket
          heading={t('quick.ticket', { no: String(snap.cycleSpends.length + 1).padStart(3, '0') })}
          stamp={stamp}
          amount={amount}
          hint={amount ? '' : t('quick.hint')}
          note={note}
          placeholder={t('quick.what')}
          onNote={setNote}
          icon={category && isSymbolName(category.icon) ? category.icon : 'payments'}
          hue={category?.hue ?? 80}
          categoryLine={`${category?.name ?? ''} · ${wallet}`}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16, flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 2 }}
        >
          {ordered.map((c) => {
            const on = c.id === categoryId;
            return (
              <PressScale
                key={c.id}
                onPress={() => {
                  haptics.tick();
                  setCategoryId(c.id);
                }}
                style={{ width: 62, alignItems: 'center', gap: 6 }}
              >
                <View
                  style={{
                    borderRadius: 19,
                    padding: 2,
                    borderWidth: 2,
                    borderColor: on ? palette.ink : 'transparent',
                    transform: [{ translateY: on ? -2 : 0 }],
                  }}
                >
                  <CategoryTile
                    icon={isSymbolName(c.icon) ? c.icon : 'payments'}
                    hue={c.hue}
                    size={48}
                    radius={15}
                    glyph={25}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={{ ...body(11.5, on ? 650 : 500), color: palette.ink, maxWidth: 62 }}
                >
                  {c.name}
                </Text>
              </PressScale>
            );
          })}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {WALLETS.map((w) => {
            const on = w.id === wallet;
            return (
              <PressScale
                key={w.id}
                onPress={() => {
                  haptics.tick();
                  setWallet(w.id);
                }}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: on ? palette.btnBg : palette.chipBg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <Symbol name={w.icon} size={17} color={on ? palette.btnFg : palette.ink} />
                <Text style={{ ...body(13, 650), color: on ? palette.btnFg : palette.ink }}>
                  {w.id}
                </Text>
              </PressScale>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {KEYS.map((key, i) =>
            key === null ? (
              <View key={i} style={{ width: '23.5%', height: 48 }} />
            ) : (
              <PressScale
                key={key}
                scaleTo={0.92}
                onPress={() => press(key)}
                style={{
                  width: '23.5%',
                  height: 48,
                  borderRadius: 15,
                  backgroundColor: palette.chipBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {key === 'back' ? (
                  <Symbol name="backspace" size={22} color={palette.ink} />
                ) : (
                  <Text
                    style={{
                      ...(/\d/.test(key) && key.length === 1 ? display(24, 500) : body(17, 650)),
                      color: palette.ink,
                    }}
                  >
                    {key}
                  </Text>
                )}
              </PressScale>
            ),
          )}
        </View>
        <PressScale
          scaleTo={0.97}
          onPress={() => void save()}
          disabled={amount <= 0}
          style={{
            height: 56,
            borderRadius: 18,
            backgroundColor: palette.btnBg,
            opacity: amount > 0 ? 1 : 0.4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Symbol name="receipt_long" size={20} color={palette.btnFg} />
          <Text style={{ ...body(17, 650), color: palette.btnFg }}>{t('quick.keep')}</Text>
        </PressScale>
      </View>
    </SheetFrame>
  );
}
