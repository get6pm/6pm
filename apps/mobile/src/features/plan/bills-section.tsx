import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { cyclePosition, type PayCycle } from '@6pm/domain';

import { usePlanActions } from '../../data/plan-actions';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, mono } from '../../ui/type/fonts';
import { useRunAction } from '../companion/use-run-action';
import { markerTint, type PlanColours } from './plan-colours';
import type { PlanFormat } from './plan-format';
import { PlanCard } from './plan-parts';
import { planRoutes } from './plan-routes';
import { BillRowView } from './bill-row';
import type { BillView } from './plan-view';

interface Marker {
  readonly key: string;
  readonly position: number;
  readonly icon: SymbolName;
  readonly bg: string;
  readonly fg: string;
  readonly label: string;
  readonly labelColour: string;
}

function Timeline({ markers, today }: { readonly markers: Marker[]; readonly today: number }) {
  const { palette } = useTheme();
  const line = { position: 'absolute', top: 12, height: 3, borderRadius: 3 } as const;
  return (
    <View style={{ height: 52, marginHorizontal: 13 }}>
      <View style={[line, { left: 0, right: 0, backgroundColor: palette.hair }]} />
      <View
        style={[line, { left: 0, width: `${today * 100}%`, backgroundColor: palette.inkSoft }]}
      />
      {markers.map((m) => (
        <View
          key={m.key}
          style={{
            position: 'absolute',
            top: 0,
            left: `${m.position * 100}%`,
            width: 0,
            alignItems: 'center',
            gap: 5,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: m.bg,
              boxShadow: `0 0 0 3px ${palette.cell}`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name={m.icon} size={15} fill={1} color={m.fg} />
          </View>
          <Text numberOfLines={1} style={{ ...mono(10, 400, 0.04), color: m.labelColour }}>
            {m.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Bills: the cycle as a line (unpaid bills, what is paid, today, payday) and the list with ticks. */
export function BillsCard({
  bills,
  cycle,
  today,
  colours,
  format,
}: {
  readonly bills: readonly BillView[];
  readonly cycle: PayCycle;
  readonly today: string;
  readonly colours: PlanColours;
  readonly format: PlanFormat;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const actions = usePlanActions();
  const run = useRunAction();
  const router = useRouter();
  const paidCount = bills.filter((b) => b.paid).length;
  const todayAt = cyclePosition(cycle, today);
  const markers: Marker[] = [
    ...bills
      .filter((b) => !b.paid)
      .map((b) => ({
        key: b.bill.id,
        position: b.position,
        icon: isSymbolName(b.bill.icon) ? b.bill.icon : 'payments',
        ...markerTint(b.bill.hue),
        label: format.dayNumber(b.due),
        labelColour: palette.inkSoft,
      })),
    ...(paidCount > 0
      ? [
          {
            key: 'paid',
            position: 0,
            icon: 'done_all' as const,
            bg: palette.chipBg,
            fg: palette.inkSoft,
            label: t('plan.bills.paidCount', { count: paidCount }).toUpperCase(),
            labelColour: palette.inkSoft,
          },
        ]
      : []),
    {
      key: 'today',
      position: todayAt,
      icon: 'circle',
      bg: palette.btnBg,
      fg: palette.btnFg,
      label: t('plan.bills.today').toUpperCase(),
      labelColour: palette.ink,
    },
    {
      key: 'payday',
      position: 1,
      icon: 'payments',
      bg: palette.accent,
      fg: palette.accentFg,
      label: t('plan.bills.payday').toUpperCase(),
      labelColour: palette.ink,
    },
  ];
  const subOf = (b: BillView) => {
    const date = format.dayMonth(b.due);
    if (b.paid) return t('plan.bills.paidOn', { date });
    if (b.inDays > 0) return t('plan.bills.due', { date, count: b.inDays });
    return b.inDays === 0 ? t('plan.bills.dueToday') : t('plan.bills.overdue', { date });
  };
  return (
    <PlanCard padding={{ top: 18, side: 16, bottom: 8 }} gap={10}>
      <Timeline markers={markers} today={todayAt} />
      <View>
        {bills.map((b, n) => (
          <BillRowView
            key={b.bill.id}
            view={b}
            first={n === 0}
            sub={subOf(b)}
            subColour={b.paid ? palette.inkSoft : colours.warn}
            label={t(b.paid ? 'plan.bills.markUnpaid' : 'plan.bills.markPaid', {
              name: b.bill.name,
            })}
            editLabel={t('plan.bills.edit', { name: b.bill.name })}
            onToggle={() => {
              haptics.tap();
              void run(() => actions.setBillPaid(b.bill.id, !b.paid));
            }}
            onEdit={() => {
              haptics.tap();
              router.push(planRoutes.bill(b.bill.id));
            }}
          />
        ))}
        <PressScale
          accessibilityRole="button"
          onPress={() => {
            haptics.tap();
            router.push(planRoutes.newBill);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            borderTopWidth: bills.length > 0 ? 0.5 : 0,
            borderColor: palette.hair,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              backgroundColor: palette.chipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="add" size={20} color={palette.ink} />
          </View>
          <Text style={{ ...body(16, 550), color: palette.ink }}>{t('plan.bill.add')}</Text>
        </PressScale>
      </View>
    </PlanCard>
  );
}
