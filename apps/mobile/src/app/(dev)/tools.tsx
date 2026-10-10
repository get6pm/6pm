import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text } from 'react-native';

import { useMoneyStore } from '../../data/money-provider';
import { seedDesignFriday } from '../../features/dev/design-friday-seed';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** Developer tools: fixtures and component galleries. Never bundled into the store app. */
export default function DeveloperTools() {
  const { palette } = useTheme();
  const router = useRouter();
  const store = useMoneyStore();
  const { today } = useClock();
  const { seed } = useLocalSearchParams<{ seed?: string }>();
  // `sixpm-dev://tools?seed=friday` loads the fixture without a tap, for scripted design checks.
  useEffect(() => {
    if (seed !== 'friday') return;
    void seedDesignFriday(store, today).then(() => router.replace('/'));
  }, [seed, store, today, router]);
  const rows: [string, () => void][] = [
    [
      'Load the designed Friday',
      () => {
        void seedDesignFriday(store, today).then(() => {
          haptics.success();
          router.back();
        });
      },
    ],
  ];
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.sheetSolid }}
      contentContainerStyle={{ padding: 20, paddingTop: 80, gap: 12 }}
    >
      {rows.map(([label, run]) => (
        <PressScale
          key={label}
          onPress={run}
          style={{ padding: 16, borderRadius: 18, backgroundColor: palette.cell }}
        >
          <Text style={{ ...body(16, 600), color: palette.ink }}>{label}</Text>
        </PressScale>
      ))}
    </ScrollView>
  );
}
