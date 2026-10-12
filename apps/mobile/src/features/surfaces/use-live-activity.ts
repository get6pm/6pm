import * as Sentry from '@sentry/react-native';
import { usePathname } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';

import { paletteFor } from '@6pm/theme';

import { surfaces } from '../../../modules/surfaces';
import { useMoney } from '../../data/money-provider';
import { dayOf } from '../../data/money-store';
import { useI18n } from '../../i18n/i18n';
import { useClock } from '../../ui/theme/clock';
import { useTravel } from '../travel/travel-provider';
import { pendingPayState, travelState } from './activity-state';
import { liveActivityPlan, pendingPayments, type ActivityPlan } from './live-activity-plan';
import { travelActivityPlan } from './travel-activity-plan';
import type { WidgetLook } from './surface-palette';

/** Scan's own route: while it is open it is still asking "Did it go through?". */
const SCAN_ROUTE = '/scan';

/**
 * Runs the Live Activity plans whenever the money, the trip, the route or the foreground changes:
 * the newest waiting QR payment of the money day gets one activity, which ends once it is
 * answered, and a trip under way gets one of its own. One run at a time, each reading what iOS
 * has running at that moment.
 */
export function useLiveActivity(look: WidgetLook) {
  const money = useMoney();
  const { t, language } = useI18n();
  const hour = Math.floor(useClock().hour);
  const pathname = usePathname();
  const { trip } = useTravel();

  const palette = useMemo(
    () =>
      paletteFor({
        look: look.look,
        hour,
        serious: look.serious,
        ...(look.config ? { config: look.config } : {}),
      }),
    [look, hour],
  );
  const inputs = useRef({ money, t, language, palette, look, trip, held: pathname === SCAN_ROUTE });
  inputs.current = { money, t, language, palette, look, trip, held: pathname === SCAN_ROUTE };
  const running = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const native = surfaces;
    if (!native) return;
    const run = () => {
      running.current = running.current
        .then(async () => {
          const now = inputs.current;
          const running = await native.listActivities();
          const foreground = AppState.currentState === 'active';
          const enabled = native.activitiesEnabled();
          const pay = liveActivityPlan({
            running,
            pending: pendingPayments(now.money),
            closed: now.money.closedDays.some((d) => d.day === now.money.today),
            foreground,
            enabled,
            held: now.held,
            stateOf: (spend) =>
              JSON.stringify(
                pendingPayState(spend, {
                  t: now.t,
                  language: now.language,
                  palette: now.palette,
                  serious: now.look.serious,
                }),
              ),
          });
          const day = dayOf(now.money);
          const state =
            now.trip === null || day === null
              ? null
              : travelState(now.trip, day, { t: now.t, palette: now.palette });
          const travel = travelActivityPlan({
            running,
            trip:
              now.trip === null || state === null
                ? null
                : { key: now.trip.key, stateJson: JSON.stringify(state) },
            foreground,
            enabled,
          });
          await apply(native, pay);
          await apply(native, travel);
        })
        .catch((error: unknown) => Sentry.captureException(error));
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [money, t, language, palette, look, trip, pathname]);
}

async function apply(native: NonNullable<typeof surfaces>, plan: ActivityPlan) {
  for (const { id, finalStateJson } of plan.end) await native.endActivity(id, finalStateJson);
  for (const { id, stateJson } of plan.update) await native.updateActivity(id, stateJson);
  if (plan.start) await native.startActivity(plan.start.kind, plan.start.key, plan.start.stateJson);
}
