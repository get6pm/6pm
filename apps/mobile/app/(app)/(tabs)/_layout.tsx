import { TabBar } from '@/components/common/tab-bar'
import { useColorPalette } from '@/hooks/use-color-palette'
import { useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Tabs } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import { useEffect } from 'react'
import { useWindowDimensions } from 'react-native'
import Purchases from 'react-native-purchases'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const { getColor } = useColorPalette()
  const { i18n } = useLingui()
  const { user } = useUser()
  const { width } = useWindowDimensions()
  const { bottom } = useSafeAreaInsets()
  const posthog = usePostHog()

  useEffect(() => {
    if (!user) {
      posthog.reset()
      return
    }
    posthog.identify(user?.id, {
      email: user?.emailAddresses?.[0]?.emailAddress,
      name: user?.fullName,
    })
    Purchases.logIn(user.id)
    Purchases.setAttributes({
      email: user?.emailAddresses?.[0]?.emailAddress,
      displayName: user?.fullName,
    })
  }, [user, posthog])

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShadowVisible: false,
        tabBarActiveTintColor: getColor('--background'),
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          borderWidth: 1,
          borderTopWidth: 1,
          backgroundColor: getColor('--background'),
          borderColor: getColor('--border'),
          borderTopColor: getColor('--border'),
          bottom: bottom ? 36 : 16,
          marginHorizontal: (width - (8 * 5 + 48 * 4 + 16)) / 2,
          paddingVertical: 0,
          paddingBottom: 0,
          height: 64,
          borderRadius: 16,
        },
        headerTitleStyle: {
          fontFamily: 'Haskoy-SemiBold',
          fontSize: 16,
          color: getColor('--foreground'),
        },
        headerStyle: {
          backgroundColor: getColor('--background'),
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
            marginLeft: 5,
          },
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
