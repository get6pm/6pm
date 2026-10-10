import { File, Paths } from 'expo-file-system';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { z } from 'zod';

import { useMoneyStore } from '../../data/money-provider';
import { pinClock, useClock } from '../../ui/theme/clock';
import { useToast } from '../../ui/toast/toast-host';
import { seedDesignFriday } from './design-friday-seed';

/**
 * Lets scripts drive a developer build with no taps: write `dev-command.json` into the app's
 * Documents folder (`xcrun simctl get_app_container <device> ai.sixpm.app.dev data`), then reload
 * or foreground the app. The file is read once and deleted.
 *
 *   {"seed": "friday", "at": "18:07", "route": "/close", "toast": "Line to show"}
 */
const commandSchema = z.object({
  seed: z.literal('friday').optional(),
  /** Pin the clock to today at HH:MM; "" unpins. */
  at: z
    .string()
    .regex(/^(\d{2}:\d{2})?$/)
    .optional(),
  route: z.string().startsWith('/').optional(),
  /** Shows this line in the island toast once the route is open. */
  toast: z.string().min(1).optional(),
});

export function DevCommands() {
  const router = useRouter();
  const store = useMoneyStore();
  const { today } = useClock();
  const toast = useToast();

  useEffect(() => {
    const run = async () => {
      const file = new File(Paths.document, 'dev-command.json');
      if (!file.exists) return;
      const parsed = commandSchema.safeParse(JSON.parse(await file.text()));
      file.delete();
      if (!parsed.success) return;
      const { seed, at, route, toast: line } = parsed.data;
      if (at !== undefined) {
        const [h = 0, m = 0] = at.split(':').map(Number);
        const pin = new Date();
        pin.setHours(h, m, 0, 0);
        pinClock(at === '' ? null : pin);
      }
      if (seed === 'friday') await seedDesignFriday(store, today);
      // Over Home, so sheets present as sheets.
      if (route) {
        router.replace('/');
        if (route !== '/') setTimeout(() => router.push(route as Href), 400);
      }
      // Held long enough for a headless screenshot to catch it.
      if (line) setTimeout(() => toast(line, 20_000), 1200);
    };
    void run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });
    return () => subscription.remove();
  }, [router, store, today, toast]);

  return null;
}
