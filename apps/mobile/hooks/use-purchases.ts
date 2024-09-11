import { toast } from '@/components/common/toast'
import type { Entitlement } from '@/lib/constaints'
import { useUser } from '@clerk/clerk-expo'
import { useQuery } from '@tanstack/react-query'
import { usePostHog } from 'posthog-react-native'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'

export function useInitializePurchases() {
  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE)

    if (Platform.OS === 'ios') {
      if (!process.env.EXPO_PUBLIC_REVENUECAT_PROJECT_IOS_API_KEY) {
        toast.error('Missing RevenueCat API key')
      } else {
        Purchases.configure({
          apiKey: process.env.EXPO_PUBLIC_REVENUECAT_PROJECT_IOS_API_KEY,
        })
      }
    }
  }, [])
}

export function usePurchasesPackages() {
  return useQuery({
    queryKey: ['offerings'],
    queryFn: Purchases.getOfferings,
    select: (state) => state.current?.availablePackages,
  })
}

export function useUserEntitlements() {
  const posthog = usePostHog()
  const { user } = useUser()

  const { data: customerInfo, refetch } = useQuery({
    queryKey: ['entitlements', user?.id],
    queryFn: Purchases.getCustomerInfo,
    refetchInterval: 1000 * 60,
    enabled: !!user?.id,
    networkMode: 'online',
    gcTime: 0,
    staleTime: 0,
  })

  const isWealth = !!customerInfo?.entitlements.active.wealth?.isActive

  const isGrowth = !!customerInfo?.entitlements.active.growth?.isActive

  const isPro = isWealth || isGrowth

  const entitlement = (
    isWealth ? 'wealth' : isGrowth ? 'growth' : 'free'
  ) as Entitlement

  useEffect(() => {
    posthog.capture('$set', {
      // biome-ignore lint/style/useNamingConvention: <explanation>
      $set: {
        subscription_plan: entitlement,
      },
    })
  }, [posthog, entitlement])

  return {
    customerInfo,
    entitlement,
    isWealth,
    isGrowth,
    isPro,
    refetch,
  }
}
