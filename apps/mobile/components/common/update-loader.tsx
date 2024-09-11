import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { View } from 'react-native'
import UpdateIllustration from '../svg-assets/update-illustration'
import { Text } from '../ui/text'

export function UpdateLoader() {
  const { i18n } = useLingui()
  return (
    <View className="flex-1 items-center justify-center gap-12 bg-background">
      <UpdateIllustration className="h-72 text-primary" />
      <Text className="text-muted-foreground">{t(
        i18n,
      )`6pm is updating, please wait...`}</Text>
    </View>
  )
}
