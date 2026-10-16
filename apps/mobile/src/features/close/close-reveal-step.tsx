import { addDays, payCycleOn, type DailyNumber, type LocalDate } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { monthDots } from './month-dots';
import { CloseReveal } from './close-reveal';

/** Tomorrow's number for the day just closed, with the month's dots and the companion's line. */
export function CloseRevealStep({
  day,
  number,
  onDone,
}: {
  readonly day: LocalDate;
  readonly number: DailyNumber;
  readonly onDone: () => void;
}) {
  const { t, language } = useI18n();
  const money = useMoneyFormat();
  const snap = useMoney();
  const plan = snap.plan;
  if (!plan) return null;
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const on = new Date(`${day}T12:00:00`);
  const tomorrow = new Date(`${addDays(day, 1)}T12:00:00`);
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(on);
  const monthDays = monthDots(day, snap.closedDays);
  // Companion keys are composed from the event and persona; every one takes the same placeholders.
  const lineFor = t as unknown as (key: string, params: Record<string, string | number>) => string;
  // A day that takes the cycle past its plan never hears that the month still lands.
  const event =
    number.spent === 0
      ? 'zero'
      : number.overspent
        ? 'pastPlan'
        : number.replan
          ? 'replan'
          : 'reveal';

  return (
    <CloseReveal
      kicker={t('close.reveal.kicker', {
        date: new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
          .format(tomorrow)
          .toUpperCase(),
      })}
      from={Math.max(0, number.safe)}
      to={number.tomorrow}
      line={
        plan.serious
          ? null
          : lineFor(`companion.${event}.${plan.persona}`, {
              t: money.short(number.tomorrow),
              b: money.short(number.line),
              day: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(on),
            })
      }
      mood={event === 'replan' || event === 'pastPlan' ? 'nod' : 'happy'}
      sub={t('close.reveal.free', {
        free: money.short(number.free),
        days: payCycleOn(day, plan.payday).daysLeft,
      })}
      month={monthName.toUpperCase()}
      monthDays={monthDays}
      streak={t('close.reveal.streak', {
        closed: monthDays.filter((d) => d !== 'open').length,
        days: Number(day.slice(8, 10)),
        month: monthName,
      })}
      nudge={t('close.reveal.nudge', { time: plan.closeAt })}
      doneLabel={t('close.reveal.done')}
      onDone={onDone}
    />
  );
}
