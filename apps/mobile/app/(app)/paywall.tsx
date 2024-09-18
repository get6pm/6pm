import { Marquee } from '@/components/common/marquee'
import { toast } from '@/components/common/toast'
import { PaywallIllustration } from '@/components/svg-assets/paywall-illustration'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text'
import {
  usePurchasesPackages,
  useUserEntitlements,
} from '@/hooks/use-purchases'
import { cn } from '@/lib/utils'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMutation } from '@tanstack/react-query'
import { BlurView } from 'expo-blur'
import { Link, useRouter } from 'expo-router'
import { CheckCircleIcon } from 'lucide-react-native'
import { cssInterop } from 'nativewind'
import { usePostHog } from 'posthog-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  type ImageSourcePropType,
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'
import type { PurchasesPackage } from 'react-native-purchases'
import Purchases from 'react-native-purchases'

cssInterop(BlurView, {
  className: {
    target: 'style',
  },
})

type FeatureCardProps = {
  source: ImageSourcePropType
  title: string
  className?: string
}
function FeatureCard({ source, title, className }: FeatureCardProps) {
  return (
    <View className={className}>
      <Image
        source={source}
        className="h-32 w-44 rounded-xl bg-primary dark:bg-muted"
        resizeMode="contain"
      />
      <BlurView
        intensity={20}
        className="absolute right-2 bottom-2 left-2 overflow-hidden rounded-lg p-2 dark:border dark:border-white/10"
      >
        <Text className="text-center font-medium text-primary-foreground text-sm dark:text-primary">
          {title}
        </Text>
      </BlurView>
    </View>
  )
}

function PackageCard({
  data,
  selected,
  onSelect,
}: { data: PurchasesPackage; selected: boolean; onSelect?: () => void }) {
  const { i18n } = useLingui()

  const isAnnual = data.identifier.includes('annually')

  return (
    <Pressable
      className={cn(
        'flex-1 overflow-hidden rounded-lg p-0.5',
        isAnnual ? 'h-44' : 'h-36',
        selected ? 'bg-primary' : 'bg-border',
      )}
      onPress={onSelect}
    >
      {isAnnual && (
        <View
          className={cn(
            'h-8 items-center justify-center',
            selected ? 'bg-primary' : 'bg-border',
          )}
        >
          <Text
            className={cn(
              'text-center font-semiBold text-sm uppercase',
              selected ? 'text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            {t(i18n)`Best value`}
          </Text>
        </View>
      )}
      <View
        className={cn(
          'flex-1 items-center justify-center rounded-md p-4',
          selected ? 'bg-background' : 'bg-background/75',
        )}
      >
        <Text className="font-bold text-4xl">{isAnnual ? 12 : 1}</Text>
        <Text className="mb-4 text-center text-muted-foreground text-sm uppercase">
          {t(i18n)`months`}
        </Text>
        <Text className="line-clamp-1 shrink-0 font-semiBold text-2xl">
          {isAnnual
            ? data.product.pricePerYearString
            : data.product.pricePerMonthString}
        </Text>
      </View>
    </Pressable>
  )
}

export default function PaywallScreen() {
  const { i18n } = useLingui()
  const [plan, setPlan] = useState<'growth' | 'wealth'>('growth')
  const [duration, setDuration] = useState<'monthly' | 'annually'>('annually')
  const { data } = usePurchasesPackages()
  const { refetch } = useUserEntitlements()
  const router = useRouter()
  const posthog = usePostHog()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: Purchases.purchasePackage,
    onSuccess() {
      posthog.capture('$set', {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        $set: {
          subscription_plan: plan,
          subscription_duration: duration,
        },
      })
      posthog.capture('subscription_purchased', { plan, duration })
      refetch()
      router.back()
      toast.success(t(i18n)`Thank you! You have unlocked 6pm Pro!`)
    },
    onError() {
      refetch()
      //
    },
  })
  const { mutateAsync: mutateRestore, isPending: isRestoring } = useMutation({
    mutationFn: Purchases.restorePurchases,
    onSuccess(result) {
      posthog.capture('$set', {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        $set: {
          subscription_plan: plan,
          subscription_duration: duration,
        },
      })
      posthog.capture('subscription_restore', { plan, duration })

      refetch()
      if (Object.keys(result.entitlements.active).length) {
        toast.success(t(i18n)`Purchases restored successfully!`)
        router.back()
        Purchases.syncPurchases()
      } else {
        Alert.alert(t(i18n)`No active subscriptions found`)
      }
    },
    onError(error) {
      refetch()
      toast.error(error.message)
    },
  })
  const selectedPackage = data?.find(
    (i) => i.identifier === `rc_${plan}_${duration}`,
  )

  const proFeatures = [
    {
      source: require('../../assets/images/paywall-images/2.png'),
      title: t(i18n)`Unlimited`,
    },
    {
      source: require('../../assets/images/paywall-images/3.png'),
      title: t(i18n)`AI Insights`,
    },
    {
      source: require('../../assets/images/paywall-images/4.png'),
      title: t(i18n)`Multi-currencies`,
    },
    {
      source: require('../../assets/images/paywall-images/1.png'),
      title: t(i18n)`Security`,
    },
  ]

  const plans = {
    growth: [
      t(i18n)`Up to 10 AI transactions per day`,
      t(i18n)`Unlimited transactions & categories`,
      t(i18n)`6 budgets & 6 accounts`,
      t(i18n)`Multi-currencies & customizations`,
    ],
    wealth: [
      t(i18n)`Up to 25 AI transactions per day`,
      t(i18n)`All features of growth plan`,
      t(i18n)`Unlimited budgets & accounts`,
      t(i18n)`Most advanced financial AI assistant`,
    ],
  }

  const handlePurchases = async () => {
    if (!selectedPackage) {
      return
    }
    await mutateAsync(selectedPackage)
  }

  return (
    <View className="flex-1 bg-card">
      <ScrollView
        className="bg-card"
        contentContainerClassName="gap-3"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mx-8 my-2 font-semiBold text-3xl text-primary">
          {t(i18n)`Complete control over your finances`}
        </Text>
        <Marquee spacing={20} speed={0.5}>
          <View className="flex-row gap-4 py-8">
            {proFeatures.map((item, index) => (
              <FeatureCard
                key={item.title}
                source={item.source}
                title={item.title}
                className={index % 2 === 0 ? '-translate-y-4' : 'translate-y-4'}
              />
            ))}
          </View>
        </Marquee>
        <Tabs
          value={plan}
          className="mx-8"
          onValueChange={(value) => {
            setPlan(value as 'growth' | 'wealth')
          }}
        >
          <TabsList>
            <TabsTrigger value="growth">
              <Text>{t(i18n)`Growth`}</Text>
            </TabsTrigger>
            <TabsTrigger value="wealth">
              <Text>{t(i18n)`Wealth`}</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <View className="gap-3 py-2">
          {plans[plan].map((item) => (
            <View className="mx-8 flex-row gap-3" key={item}>
              <CheckCircleIcon className="size-6 text-amount-positive" />
              <Text className="text-primary">{item}</Text>
            </View>
          ))}
        </View>
        <View className="mx-8 flex-row items-end gap-6">
          {data
            ?.filter((i) => i.identifier?.includes(plan))
            ?.map((pkg) => (
              <PackageCard
                key={pkg.identifier}
                data={pkg}
                selected={pkg.identifier === selectedPackage?.identifier}
                onSelect={() => {
                  setDuration(
                    pkg.identifier.includes('annually')
                      ? 'annually'
                      : 'monthly',
                  )
                }}
              />
            ))}
        </View>
        <Button
          className="mx-8 mt-2"
          disabled={!selectedPackage}
          onPress={handlePurchases}
        >
          <Text>{t(i18n)`Unlock 6pm Pro`}</Text>
        </Button>
        <View className="mx-auto flex-row items-center gap-4">
          <TouchableOpacity activeOpacity={0.8} onPress={() => mutateRestore()}>
            <Text className="mx-auto text-center text-sm">
              {t(i18n)`Restore purchases`}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="mx-8">
          <Trans>
            <Text className="text-center text-muted-foreground text-xs">
              By continuing, you acknowledge that you understand and agree to
              our{' '}
              <Link href="/privacy-policy">
                <Text className="text-primary text-xs">Privacy Policy</Text>
              </Link>{' '}
              and{' '}
              <Text
                className="text-primary text-xs"
                onPress={() =>
                  Linking.openURL(
                    'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
                  )
                }
              >
                Terms of Use
              </Text>
            </Text>
          </Trans>
        </View>
        <PaywallIllustration className="mx-auto h-[566px] w-[200px] text-primary" />
      </ScrollView>
      {(isPending || isRestoring) && (
        <View className="absolute top-0 right-0 bottom-0 left-0 z-50 items-center justify-center bg-background/50">
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  )
}
