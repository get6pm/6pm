import { toast } from '@/components/common/toast'
import { useQuery } from '@tanstack/react-query'
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
  const { data: customerInfo } = useQuery({
    queryKey: ['entitlements'],
    queryFn: Purchases.getCustomerInfo,
  })

  const isWealth = !!customerInfo?.entitlements.active.wealth?.isActive

  const isGrowth = !!customerInfo?.entitlements.active.growth?.isActive

  const isPro = isWealth || isGrowth

  return {
    customerInfo,
    isWealth,
    isGrowth,
    isPro,
  }
}
