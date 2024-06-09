import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Tabs } from 'expo-router'
import { CogIcon, LandPlotIcon, ScanTextIcon, WalletIcon } from 'lucide-react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()
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
        }
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
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          headerTitle: t(i18n)`Scanner`,
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <ScanTextIcon color={color} />,
        }}
      />
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
