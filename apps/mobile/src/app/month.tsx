import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { Payday } from '@6pm/domain';

import { useMoney } from '../data/money-provider';
import { usePlanActions } from '../data/plan-actions';
import { useRunAction } from '../features/companion/use-run-action';
import {
  IncomeWheels,
  PaydayPicker,
  type PickerInk,
} from '../features/onboarding/money-in-controls';
import { PotCard, SheetHeader } from '../features/plan/pot-rows';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetFrame } from '../ui/navigation/sheet-frame';
import { PressScale } from '../ui/primitives/press-scale';
import { useTheme } from '../ui/theme/theme';
import { body } from '../ui/type/fonts';

const DEFAULT_SAME_DAY = 25;

/**
 * Money in and payday, as onboarding asked for them: a raise or a new payday is entered here. The
 * daily number follows at once; the cycle that is running moves to its new start.
 */
export default function MonthSheet() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const run = useRunAction();
  const { plan } = useMoney();
  const actions = usePlanActions();
  const [income, setIncome] = useState(plan?.income ?? 0);
  const [payday, setPayday] = useState<Payday>(plan?.payday ?? { kind: 'lastDay' });
  const [sameDay, setSameDay] = useState(
    plan?.payday.kind === 'sameDay' ? plan.payday.day : DEFAULT_SAME_DAY,
  );
  const [working, setWorking] = useState(false);
  const busy = useRef(false);
  const colours: PickerInk = {
    ink: palette.ink,
    inkSoft: palette.inkSoft,
    chipBg: palette.chipBg,
    segOn: palette.cell,
    segShadow: '0 1px 3px rgba(0,0,0,.12)',
  };

  const save = async () => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    if (!(await run(() => actions.updateMonth({ income, payday })))) {
      busy.current = false;
      setWorking(false);
      return;
    }
    haptics.success();
    router.back();
  };

  return (
    <SheetFrame header={<SheetHeader title={t('plan.month.title')} />}>
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
          <View style={{ paddingVertical: 16, paddingHorizontal: 16, gap: 6 }}>
            <Text style={{ ...body(15, 650), color: palette.ink }}>{t('plan.month.income')}</Text>
            <IncomeWheels income={income} onIncome={setIncome} colours={colours} />
          </View>
        </PotCard>
        <PotCard>
          <View style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
            <Text style={{ ...body(15, 650), color: palette.ink }}>
              {t('onboarding.payday.title')}
            </Text>
            <PaydayPicker
              payday={payday}
              sameDay={sameDay}
              onPayday={(next) => {
                if (next.kind === 'sameDay') setSameDay(next.day);
                setPayday(next);
              }}
              colours={colours}
            />
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
          <Text style={{ ...body(17, 650), color: palette.btnFg }}>{t('plan.month.save')}</Text>
        </PressScale>
      </ScrollView>
    </SheetFrame>
  );
}
