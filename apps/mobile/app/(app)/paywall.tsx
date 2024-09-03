import { AmountFormat } from '@/components/common/amount-format'
import { Marquee } from '@/components/common/marquee'
import { PaywallIllustration } from '@/components/svg-assets/paywall-illustration'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Text } from '@/components/ui/text'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { BlurView } from 'expo-blur'
import { Link } from 'expo-router'
import { CheckCircleIcon } from 'lucide-react-native'
import { cssInterop } from 'nativewind'
import { useState } from 'react'
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  View,
} from 'react-native'

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

export default function PaywallScreen() {
  const { i18n } = useLingui()
  const [plan, setPlan] = useState<'growth' | 'wealth'>('growth')

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

  return (
    <ScrollView
      className="bg-card"
      contentContainerClassName="gap-3"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mx-8 my-2 font-sans font-semibold text-3xl text-primary">
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
        <Pressable className="h-36 flex-1 rounded-lg border-2 border-border">
          <View className="flex-1 items-center justify-center bg-muted/40 p-4">
            <Text className="font-bold text-4xl">1</Text>
            <Text className="mb-4 text-center text-muted-foreground text-sm uppercase">
              month
            </Text>
            <AmountFormat amount={99000} currency="VND" />
          </View>
        </Pressable>
        <Pressable className="h-44 flex-1 overflow-hidden rounded-lg bg-primary p-0.5">
          <View className="h-8 items-center justify-center bg-primary">
            <Text className="text-center font-semibold text-primary-foreground text-sm uppercase">
              {t(i18n)`Best value`}
            </Text>
          </View>
          <View className="flex-1 items-center justify-center rounded-md bg-background p-4">
            <Text className="font-bold text-4xl">12</Text>
            <Text className="mb-4 text-center text-muted-foreground text-sm uppercase">
              months
            </Text>
            <AmountFormat amount={999000} currency="VND" />
          </View>
        </Pressable>
      </View>
      <Button className="mx-8 mt-2">
        <Text>{t(i18n)`Unlock 6pm Pro`}</Text>
      </Button>
      <Link href="/privacy-policy">
        <Text className="mx-auto text-center text-muted-foreground text-sm">
          Privacy Policy
        </Text>
      </Link>
      <PaywallIllustration className="mx-auto h-[566px] w-[200px] text-primary" />
    </ScrollView>
  )
}
