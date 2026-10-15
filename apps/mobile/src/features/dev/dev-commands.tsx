import { File, Paths } from 'expo-file-system';
import { useRouter, type Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { z } from 'zod';

import { LOOK_IDS } from '@6pm/theme';

import { useMoneyStore } from '../../data/money-provider';
import { useLookSettingsStore } from '../looks/look-settings-provider';
import { setAiMode } from '../privacy/use-ai-mode';
import { pinClock, useClock } from '../../ui/theme/clock';
import { useToast } from '../../ui/toast/toast-host';
import { COMPANION_FORMS } from '../../ui/companion/companion-mood';
import { pinCompanionForm } from './dev-companion-form';
import { CUSTOMER_KEY, serializeCustomer } from '../purchases/customer-memory';
import { FREE_CUSTOMER } from '../purchases/purchases-port';
import { seedDesignFriday } from './design-friday-seed';
import { useYearBook } from '../year-book/use-year-book';
import { seedDesignYear } from './design-year-seed';

/**
 * Lets scripts drive a developer build with no taps: write `dev-command.json` into the app's
 * Documents folder (`xcrun simctl get_app_container <device> ai.sixpm.app.dev data`), then reload
 * or foreground the app. The file is read once and deleted.
 *
 *   {"seed": "friday", "at": "18:07", "route": "/close", "toast": "Line to show", "companion": "max"}
 */
const commandSchema = z.object({
  seed: z.enum(['friday', 'year']).optional(),
  /** The friday seed's currency (ISO 4217); đồng when not given. */
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  /** Pin the clock to today at HH:MM; "" unpins. */
  at: z
    .string()
    .regex(/^(\d{2}:\d{2})?$/)
    .optional(),
  route: z.string().startsWith('/').optional(),
  /** Shows this line in the island toast once the route is open. */
  toast: z.string().min(1).optional(),
  /** Shows the companion in this form whatever was picked or bought; "" follows them again. */
  companion: z.union([z.enum(COMPANION_FORMS), z.literal('')]).optional(),
  /** Wears this look, whether or not it was bought. */
  look: z.enum(LOOK_IDS).optional(),
  /** Where the AI runs, as the Settings choice sets it. */
  aiMode: z.enum(['server', 'device']).optional(),
  /** Keeps Max on or off as the last known customer; it takes effect at the next launch. */
  max: z.boolean().optional(),
  /** Binds this year's book and opens the share sheet, as a tap on a bound book does. */
  yearBook: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
});

const DEV_MAX = {
  active: true,
  plan: 'yearly',
  inTrial: false,
  trialEndsAt: null,
  renewsAt: null,
  endsAt: null,
  willRenew: true,
} as const;

export function DevCommands() {
  const router = useRouter();
  const store = useMoneyStore();
  const { today } = useClock();
  const toast = useToast();
  const { bind: bindYear } = useYearBook();
  const lookStore = useLookSettingsStore();
  const db = useSQLiteContext();

  useEffect(() => {
    const run = async () => {
      const file = new File(Paths.document, 'dev-command.json');
      if (!file.exists) return;
      const parsed = commandSchema.safeParse(JSON.parse(await file.text()));
      file.delete();
      if (!parsed.success) return;
      const {
        seed,
        currency,
        at,
        route,
        toast: line,
        companion,
        look,
        max,
        yearBook,
        aiMode,
      } = parsed.data;
      if (aiMode !== undefined) setAiMode(db, aiMode);
      if (look !== undefined) lookStore.setLook(look, () => true);
      if (companion !== undefined) pinCompanionForm(companion === '' ? null : companion);
      if (max !== undefined) {
        const customer = max ? { ...FREE_CUSTOMER, max: DEV_MAX } : FREE_CUSTOMER;
        await store.db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
          CUSTOMER_KEY,
          serializeCustomer(customer),
        ]);
      }
      if (at !== undefined) {
        const [h = 0, m = 0] = at.split(':').map(Number);
        const pin = new Date();
        pin.setHours(h, m, 0, 0);
        pinClock(at === '' ? null : pin);
      }
      if (seed === 'friday') await seedDesignFriday(store, today, currency);
      if (seed === 'year') await seedDesignYear(store, today);
      // Over Home, so sheets present as sheets.
      if (route) {
        router.replace('/');
        if (route !== '/') setTimeout(() => router.push(route as Href), 400);
      }
      // Held long enough for a headless screenshot to catch it.
      if (line) setTimeout(() => toast(line, 20_000), 1200);
      if (yearBook) setTimeout(() => void bindYear(yearBook), 1200);
    };
    void run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });
    return () => subscription.remove();
  }, [router, store, today, toast, bindYear, lookStore, db]);

  return null;
}
