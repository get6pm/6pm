import { Button } from '@/components/ui/button'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link, Tabs } from 'expo-router'
import {
  // BarChartBigIcon,
  CogIcon,
  LandPlotIcon,
  PlusIcon,
  WalletIcon,
} from 'lucide-react-native'

export default function TabLayout() {
  const { colorScheme } = useColorScheme()
  const { i18n } = useLingui()
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        tabBarActiveTintColor: theme[colorScheme ?? 'light'].primary,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: theme[colorScheme ?? 'light'].background,
        },
        headerTitleStyle: {
          fontFamily: 'Be Vietnam Pro Medium',
          fontSize: 16,
          color: theme[colorScheme ?? 'light'].primary,
        },
        headerStyle: {
          backgroundColor: theme[colorScheme ?? 'light'].background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <WalletIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          headerTitle: t(i18n)`Budgets`,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <LandPlotIcon color={color} />,
          headerRight: () => (
            <Link href="/budget/new-budget" asChild>
              <Button size="icon" variant="ghost" className="mr-4">
                <PlusIcon className="size-6 text-primary" />
              </Button>
            </Link>
          ),
        }}
      />
      {/* <Tabs.Screen
        name="reports"
        options={{
          headerTitle: t(i18n)`Reports`,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <BarChartBigIcon color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="settings"
        options={{
          headerTitle: t(i18n)`Settings`,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <CogIcon color={color} />,
        }}
      />
    </Tabs>
  )
}
