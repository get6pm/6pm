import { Link, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { useDay } from '../data/money-provider';
import { HomeShell } from '../features/home/home-shell';
import { isHomeTab } from '../features/home/home-tabs';
import { useTheme } from '../ui/theme/theme';
import { body } from '../ui/type/fonts';

export default function Home() {
  const day = useDay();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { palette } = useTheme();
  if (day !== null) return <HomeShell day={day} initialTab={isHomeTab(tab) ? tab : 'today'} />;
  // Before the month is set up. Onboarding takes this place; developer builds can load a fixture.
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        experimental_backgroundImage: palette.sky,
      }}
    >
      {__DEV__ ? (
        <Link href="/tools" style={{ ...body(17, 600), color: palette.ink }}>
          Developer tools
        </Link>
      ) : (
        <Text style={{ ...body(17, 600), color: palette.ink }}>6pm</Text>
      )}
    </View>
  );
}
