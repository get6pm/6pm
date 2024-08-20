import { OnboardIllustration } from '@/components/svg-assets/onboard-illustration'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { ArrowRightIcon } from 'lucide-react-native'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function StepOneScreen() {
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()

  return (
    <ScrollView
      className="bg-card"
      contentContainerClassName="gap-4 p-8 pt-4 flex-1 justify-between"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: bottom + 32 }}
    >
      <View className="gap-4">
        <Text className="font-sans font-semibold text-3xl text-primary">
          {t(i18n)`Welcome to 6pm!`}
        </Text>
        <Text className="font-sans text-muted-foreground">
          {t(i18n)`Get started by setting your monthly budget.`}
        </Text>
      </View>
      <OnboardIllustration className="my-16 h-[326px] text-primary" />
      <Link href="/onboarding/step-two" asChild>
        <Button className="mx-auto">
          <Text>{t(i18n)`Set Monthly Budget`}</Text>
          <ArrowRightIcon className="size-6 text-primary-foreground" />
        </Button>
      </Link>
    </ScrollView>
  )
}
