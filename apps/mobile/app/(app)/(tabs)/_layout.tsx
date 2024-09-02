import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { Link, Tabs } from 'expo-router'
import {
  // BarChartBigIcon,
  CogIcon,
  LandPlotIcon,
  PlusIcon,
  WalletIcon,
} from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { useEffect } from 'react'
import { View, useWindowDimensions } from 'react-native'

export default function TabLayout() {
  const { colorScheme } = useColorScheme()
  const { i18n } = useLingui()
  const { user } = useUser()
  const { width } = useWindowDimensions()

  const posthog = usePostHog()

  useEffect(() => {
    if (!user) {
      return
    }
    posthog.identify(user?.id, {
      email: user?.emailAddresses?.[0]?.emailAddress,
      name: user?.fullName,
    })
  }, [user, posthog])

  return (
    <Tabs
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
          bottom: 36,
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
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              className={cn(
                'h-[48px] w-[48px] items-center justify-center rounded-xl',
                focused && 'bg-primary',
              )}
            >
              <WalletIcon color={color} className="size-6" />
            </View>
          ),
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
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              className={cn(
                'h-[48px] w-[48px] items-center justify-center rounded-xl',
                focused && 'bg-primary',
              )}
            >
              <LandPlotIcon color={color} className="size-6" />
            </View>
          ),
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
          tabBarIcon: ({ color, focused }) => (
            <View
              className={cn(
                'h-[48px] w-[48px] items-center justify-center rounded-xl',
                focused && 'bg-primary',
              )}
            >
              <CogIcon color={color} className="size-6" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dummy"
        options={{
          tabBarShowLabel: false,
          tabBarButton: () => (
            <View className="items-center justify-center px-2">
              <Link
                href="/transaction/new-record"
                asChild
                onPress={Haptics.selectionAsync}
              >
                <Button
                  size="icon"
                  className={cn(
                    'h-[48px] w-[48px] items-center justify-center rounded-xl border border-border bg-muted active:bg-muted/75',
                  )}
                >
                  <PlusIcon className="size-6 text-foreground" />
                </Button>
              </Link>
            </View>
          ),
        }}
      />
    </Tabs>
  )
}
