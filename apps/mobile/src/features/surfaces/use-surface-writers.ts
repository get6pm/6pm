import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';

import { surfaces } from '../../../modules/surfaces';
import { useMoney, useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useLookSettings } from '../looks/look-settings-provider';
import { resolveLook } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';
import { renderCompanions } from './companion-images';
import { contextStrings, hostOf, surfaceContext } from './surface-context';
import { widgetLook } from './surface-palette';
import { snapshotKey, surfaceSnapshot } from './surface-snapshot';
import { useLiveActivity } from './use-live-activity';

/** Writes wait this long after the last change, so a burst of edits is written once. */
const DEBOUNCE_MS = 1000;
/** Companion pictures are drawn after launch has settled, never on the first frames. */
const COMPANION_DELAY_MS = 1500;

const host = hostOf(Constants.expoConfig?.extra?.['apiBase']);

const report = (error: unknown) => Sentry.captureException(error);

/**
 * Keeps what the widgets, the share extension and the Live Activity show in step with the money:
 * the snapshot and the context are written a second after they change and again whenever 6pm
 * goes to the background; the companion pictures are drawn again when the Max form or serious
 * mode changes; the waiting payment's Live Activity follows its spend.
 */
export function useSurfaceWriters() {
  const money = useMoney();
  const store = useMoneyStore();
  const { t, language } = useI18n();
  const { look, config } = useLookSettings();
  const { customer, max } = useEntitlement();
  const serious = money.plan?.serious ?? false;
  const worn = resolveLook(look, customer);
  const ownConfig = config[worn];

  const widget = useMemo(
    () => widgetLook({ max, look: worn, serious, ...(ownConfig ? { config: ownConfig } : {}) }),
    [max, worn, ownConfig, serious],
  );
  const snapshot = useMemo(
    () =>
      surfaceSnapshot({
        money,
        look: widget,
        maxLook: max ? worn : null,
        t,
        writtenAt: new Date(),
      }),
    [money, widget, max, worn, t],
  );
  const key = snapshotKey(snapshot);

  // The latest values, read by a write that fires later.
  const latest = useRef({ snapshot, money, language, t });
  latest.current = { snapshot, money, language, t };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writing = useRef<Promise<unknown>>(Promise.resolve());

  /** Writes the latest snapshot and context now, after any write still running. */
  const writeNow = useCallback(() => {
    const native = surfaces;
    if (!native) return;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    writing.current = writing.current
      .then(async () => {
        const now = latest.current;
        const written = { ...now.snapshot, writtenAt: new Date().toISOString() };
        await native.writeSurface('snapshot', JSON.stringify(written));
        if (host === null) return;
        const rules = await store.tables.rules.all();
        const context = surfaceContext({
          money: now.money,
          rules,
          language: now.language,
          host,
          strings: contextStrings(now.t),
        });
        await native.writeSurface('context', JSON.stringify(context));
      })
      .catch(report);
  }, [store]);

  useEffect(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(writeNow, DEBOUNCE_MS);
  }, [key, language, t, writeNow]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') writeNow();
    });
    return () => {
      sub.remove();
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [writeNow]);

  useCompanionImages(serious, writeNow);
  useLiveActivity(widget);
}

/**
 * The companion the surfaces show, drawn off screen at each size they use, then the snapshot is
 * written again so the widgets redraw with it. Serious mode has no companion, so nothing is
 * drawn; the widgets leave it out by the snapshot's `serious`.
 */
function useCompanionImages(serious: boolean, written: () => void) {
  // The Max companion form is not offered yet; every surface draws the base form.
  const form = 'base';
  useEffect(() => {
    const native = surfaces;
    if (!native || serious) return;
    const handle = setTimeout(() => {
      const write = async () => {
        for (const image of renderCompanions(form)) {
          await native.writeSurfaceImage(image.name, image.png);
        }
        written();
      };
      write().catch(report);
    }, COMPANION_DELAY_MS);
    return () => clearTimeout(handle);
  }, [serious, form, written]);
}
