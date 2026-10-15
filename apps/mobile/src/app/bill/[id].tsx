import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, type TextInputInstance, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useMoney } from '../../data/money-provider';
import { usePlanActions } from '../../data/plan-actions';
import { useRunAction } from '../../features/companion/use-run-action';
import { AmountWheels } from '../../features/onboarding/bill-card-parts';
import { DEFAULT_DUE_DAY } from '../../features/onboarding/bill-deck';
import { DayOfMonthWheel } from '../../features/onboarding/money-in-controls';
import { PotCard, SheetHeader } from '../../features/plan/pot-rows';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { useFocusOnPresent } from '../../ui/navigation/use-focus-on-present';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, families } from '../../ui/type/fonts';
import { useOfferUndo } from '../../ui/undo/undo-host';

const NAME_SIZE = 28;
/** A bill made here has no icon of its own to pick: a receipt, in a calm blue. */
const NEW_BILL = { icon: 'receipt_long', hue: 250 } as const;

/**
 * A bill's sheet: its name, what it costs each month and the day it falls due. `/bill/new` adds
 * one; an existing bill can be changed or deleted (with an undo).
 */
export default function BillSheet() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const { t } = useI18n();
  const run = useRunAction();
  const offerUndo = useOfferUndo();
  const actions = usePlanActions();
  const { bills } = useMoney();
  const bill = id === 'new' ? undefined : bills.find((b) => b.id === id);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [dueDay, setDueDay] = useState(DEFAULT_DUE_DAY);
  const [loaded, setLoaded] = useState(id === 'new');
  const [working, setWorking] = useState(false);
  const busy = useRef(false);
  const left = useRef(false);
  const nameInput = useRef<TextInputInstance>(null);
  // A new bill starts with its name, so the keyboard is up once the sheet is; an existing one
  // opens to be looked over first.
  useFocusOnPresent(nameInput, id === 'new');

  // The sheet edits a copy; it starts from the bill as saved, once.
  useEffect(() => {
    if (!bill || loaded) return;
    setName(bill.name);
    setAmount(bill.amount);
    setDueDay(bill.dueDay);
    setLoaded(true);
  }, [bill, loaded]);

  // The bill is gone (deleted here): nothing left to edit.
  useEffect(() => {
    if (id !== 'new' && !bill && !left.current) {
      left.current = true;
      router.back();
    }
  }, [id, bill, router]);

  const ready = name.trim().length > 0 && !working && loaded;
  const button = useAnimatedStyle(() => ({
    opacity: withTiming(ready ? 1 : 0.35, { duration: 200 }),
  }));

  const finish = async (task: () => Promise<unknown>) => {
    if (busy.current) return false;
    busy.current = true;
    setWorking(true);
    if (await run(task)) {
      left.current = true;
      return true;
    }
    busy.current = false;
    setWorking(false);
    return false;
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const done = await finish(() =>
      bill
        ? actions.updateBill(bill.id, { name: trimmed, amount, dueDay })
        : actions.addBill({ ...NEW_BILL, name: trimmed, amount, dueDay }),
    );
    if (done) {
      haptics.success();
      router.back();
    }
  };

  const remove = async () => {
    if (!bill) return;
    const gone = bill;
    if (await finish(() => actions.removeBill(gone.id))) {
      haptics.tap();
      router.back();
      offerUndo(t('plan.bill.deleted', { name: gone.name }), t('plan.pot.undo'), () => {
        void run(() => actions.restoreBill(gone.id));
      });
    }
  };

  return (
    <SheetFrame
      header={<SheetHeader title={bill ? t('plan.bill.editTitle') : t('plan.bill.newTitle')} />}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 14,
          paddingHorizontal: 18,
          paddingBottom: 28,
          gap: 20,
        }}
      >
        <TextInput
          ref={nameInput}
          value={name}
          onChangeText={setName}
          placeholder={t('plan.bill.placeholder')}
          placeholderTextColor={palette.inkSoft}
          returnKeyType="done"
          accessibilityLabel={t('plan.bill.name')}
          style={{
            textAlign: 'center',
            padding: 0,
            fontFamily: families.display,
            fontSize: NAME_SIZE,
            fontWeight: '500',
            letterSpacing: -0.015 * NAME_SIZE,
            color: palette.ink,
          }}
        />
        <PotCard>
          <View style={{ paddingVertical: 18, paddingHorizontal: 12, gap: 6 }}>
            <Text style={{ ...body(13, 600), textAlign: 'center', color: palette.inkSoft }}>
              {t('plan.bill.amount')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <AmountWheels
                value={amount}
                ink={palette.ink}
                band={palette.chipBg}
                onValue={setAmount}
              />
              <View style={{ alignItems: 'center', gap: 4 }}>
                <DayOfMonthWheel
                  day={dueDay}
                  onDay={setDueDay}
                  label={t('plan.bill.dueDay')}
                  colours={palette}
                />
                <Text style={{ ...body(11.5, 600), color: palette.inkSoft }}>
                  {t('plan.bill.dueDay')}
                </Text>
              </View>
            </View>
          </View>
        </PotCard>
        <Animated.View style={button}>
          <PressScale
            scaleTo={0.95}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={() => void save()}
            style={{
              height: 56,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(17, 650), color: palette.btnFg }}>{t('plan.bill.save')}</Text>
          </PressScale>
        </Animated.View>
        {bill ? (
          <PressScale
            accessibilityRole="button"
            disabled={working}
            onPress={() => void remove()}
            style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ ...body(16, 600), color: palette.inkSoft }}>
              {t('plan.bill.delete')}
            </Text>
          </PressScale>
        ) : null}
      </ScrollView>
    </SheetFrame>
  );
}
