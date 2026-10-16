import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { dayOf } from '../../data/money-store';
import { useMoney, useMoneyStore } from '../../data/money-provider';
import { setSpentSincePayday } from '../../data/since-payday';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { useRunAction } from '../companion/use-run-action';
import { IncomeWheels } from '../onboarding/money-in-controls';
import { dateOf } from '../onboarding/since-payday';
import { PotCard, SheetHeader } from './pot-rows';
import { riverOf } from './plan-view';

/**
 * "Before 6pm", changed: what the person spent between payday and setting 6pm up, on the money
 * wheels onboarding asked it with. Opened from the river while the cycle they joined lasts; the
 * river and the daily number follow on save.
 */
export function SincePaydaySheet() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, dayMonth } = useI18n();
  const run = useRunAction();
  const store = useMoneyStore();
  const snap = useMoney();
  const day = dayOf(snap);
  const [amount, setAmount] = useState(() => (day ? riverOf(snap, day, null).before : 0));
  const [working, setWorking] = useState(false);
  const busy = useRef(false);

  const save = async () => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    if (!(await run(() => setSpentSincePayday(store, amount)))) {
      busy.current = false;
      setWorking(false);
      return;
    }
    haptics.success();
    router.back();
  };

  return (
    <SheetFrame header={<SheetHeader title={t('plan.sincePayday.title')} />}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 14,
          paddingHorizontal: 18,
          paddingBottom: 28,
          gap: 20,
        }}
      >
        <PotCard>
          <View style={{ paddingVertical: 16, paddingHorizontal: 16, gap: 12 }}>
            <Text style={{ ...body(15, 650), lineHeight: 21, color: palette.ink }}>
              {t('plan.sincePayday.question', { date: dayMonth(dateOf(snap.cycle.start)) })}
            </Text>
            <IncomeWheels income={amount} onIncome={setAmount} colours={palette} />
          </View>
        </PotCard>
        <PressScale
          scaleTo={0.95}
          accessibilityRole="button"
          disabled={working}
          onPress={() => void save()}
          style={{
            height: 56,
            borderRadius: 99,
            backgroundColor: palette.btnBg,
            opacity: working ? 0.35 : 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(17, 650), color: palette.btnFg }}>
            {t('plan.sincePayday.save')}
          </Text>
        </PressScale>
      </ScrollView>
    </SheetFrame>
  );
}
