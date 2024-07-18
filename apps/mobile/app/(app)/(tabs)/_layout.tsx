import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
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
          headerTitleStyle: {
            fontFamily: 'Be Vietnam Pro Medium',
            fontSize: 16,
            color: theme[colorScheme ?? 'light'].primary,
            marginLeft: 5,
          },
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <LandPlotIcon color={color} />,
          headerRight: () => (
            <Link href="/budget/new-budget" asChild>
              <Button size="sm" variant="secondary" className="mr-6 h-10">
                <PlusIcon className="size-6 text-primary" />
                <Text>{t(i18n)`New budget`}</Text>
              </Button>
            </Link>
          ),
          headerTitleAlign: 'left',
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
