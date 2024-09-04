import { TabBar } from '@/components/common/tab-bar'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link, Tabs } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Purchases from 'react-native-purchases'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const { colorScheme } = useColorScheme()
  const { i18n } = useLingui()
  const { user } = useUser()
  const { width } = useWindowDimensions()
  const { bottom } = useSafeAreaInsets()

  const posthog = usePostHog()

  useEffect(() => {
    if (!user) {
      return
    }
    posthog.identify(user?.id, {
      email: user?.emailAddresses?.[0]?.emailAddress,
      name: user?.fullName,
    })
    Purchases.logIn(user.id)
  }, [user, posthog])

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShadowVisible: false,
        tabBarActiveTintColor: theme[colorScheme ?? 'light'].background,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          borderWidth: 1,
          borderTopWidth: 1,
          backgroundColor: theme[colorScheme ?? 'light'].background,
          borderColor: theme[colorScheme ?? 'light'].border,
          borderTopColor: theme[colorScheme ?? 'light'].border,
          bottom: bottom ? 36 : 16,
          marginHorizontal: (width - (8 * 5 + 48 * 4 + 16)) / 2,
          paddingVertical: 0,
          paddingBottom: 0,
          height: 64,
          borderRadius: 16,
        },
        headerTitleStyle: {
          fontFamily: 'Inter Medium',
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
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          headerTitle: t(i18n)`Budgets`,
          headerTitleStyle: {
            fontFamily: 'Inter Medium',
            fontSize: 16,
            color: theme[colorScheme ?? 'light'].primary,
            marginLeft: 5,
          },
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
        }}
      />
    </Tabs>
  )
}
