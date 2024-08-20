import { NotificationIllustration } from '@/components/svg-assets/notification-illustration'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useUserSettingsStore } from '@/stores/user-settings/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function StepThreeScreen() {
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()
  const router = useRouter()
  const { setEnabledPushNotifications } = useUserSettingsStore()

  async function handleEnableNotification() {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status === 'granted') {
      setEnabledPushNotifications(true)
    }
    router.replace('/')
  }

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
          {t(i18n)`Enable spending alerts`}
        </Text>
        <Text className="font-sans text-muted-foreground">
          {t(i18n)`Keeping up with your spending and budgets.`}
        </Text>
      </View>
      <NotificationIllustration className="my-16 h-[326px] text-primary" />
      <Button className="mx-auto" onPress={handleEnableNotification}>
        <Text>{t(i18n)`Enable Push Notifications`}</Text>
      </Button>
    </ScrollView>
  )
}
