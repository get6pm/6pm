import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { cycleMonth, designAmount, sharedPotMonthly, sharedPotProgress } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useHomeCurrency } from '../../money/use-money-format';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { useCompanionToast } from '../companion/use-companion-toast';
import { potMonthAt } from '../plan/plan-view';
import { PotSheet, type PotFields } from '../plan/pot-sheet';
import { usePotMoney } from './pot-money';
import { useTogether, useTogetherRun } from './together-provider';

/**
 * A shared pot made or edited (`?id=`) on the same sheet as an own pot: name, icon and colour,
 * goal, month (up to ten years out). What it will need each month is both partners' together.
 * A new pot is in this phone's home currency and keeps it; an edited one stays in its own.
 */
export function SharedPotEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const say = useCompanionToast();
  const run = useTogetherRun();
  const snap = useMoney();
  const { state } = useTogether();
  const existing = id === undefined ? undefined : state.pair?.pots.find((p) => p.id === id);
  const home = useHomeCurrency();
  const { currency, money } = usePotMoney(existing?.currency ?? home.code);
  const from = cycleMonth(snap.cycle);
  const [fields, setFields] = useState<PotFields>(() => ({
    name: existing?.name ?? '',
    icon: existing !== undefined && isSymbolName(existing.icon) ? existing.icon : 'group',
    hue: existing?.hue ?? 30,
    // The design starts a new pot at 2.000.000₫, or as much in the home currency.
    goal: existing?.goal ?? designAmount(2_000_000, currency),
  }));
  const [month, setMonth] = useState<string | null>(() =>
    existing === undefined ? potMonthAt(from, 3) : existing.neededBy,
  );
  const busy = useRef(false);
  const [working, setWorking] = useState(false);

  const saved =
    existing === undefined ? 0 : sharedPotProgress(existing.goal, existing.contributions).saved;
  const monthly = sharedPotMonthly(fields.goal, saved, month, snap.cycle, currency);
  const summary =
    month !== null && monthly > 0
      ? {
          title: t('together.pot.sumMonthly', { amount: money.short(monthly) }),
          sub: t('together.pot.sumSub'),
        }
      : { title: t('together.pot.sumNone'), sub: t('together.pot.sumNoneSub') };

  const save = async () => {
    const name = fields.name.trim();
    if (busy.current || name.length === 0) return;
    busy.current = true;
    setWorking(true);
    const body = { name, icon: fields.icon, hue: fields.hue, goal: fields.goal, neededBy: month };
    const ok = await run(
      existing === undefined
        ? { kind: 'createPot', id: randomUUID(), fields: body, currency: currency.code }
        : { kind: 'editPot', id: existing.id, fields: body },
    );
    busy.current = false;
    setWorking(false);
    if (!ok) return;
    haptics.success();
    router.back();
    if (existing === undefined) say('potMade');
  };

  return (
    <PotSheet
      title={existing === undefined ? t('together.newPot') : t('together.pot.edit')}
      placeholder={t('plan.pot.placeholder')}
      fields={fields}
      onChange={(patch) => setFields((f) => ({ ...f, ...patch }))}
      onTemplate={
        existing === undefined
          ? (draft) => {
              setFields({ name: draft.name, icon: draft.icon, hue: draft.hue, goal: draft.goal });
              setMonth(potMonthAt(from, draft.ahead));
            }
          : undefined
      }
      month={month}
      onMonth={setMonth}
      from={from}
      {...(existing === undefined ? {} : { saved })}
      summary={summary}
      cta={{
        label: existing === undefined ? t('together.pot.start') : t('together.pot.save'),
        enabled: !working && state.me !== null,
        onPress: () => void save(),
      }}
    />
  );
}
