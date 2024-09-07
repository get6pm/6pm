import { AuthEmail } from '@/components/auth/auth-email'
import {
  AppleAuthButton,
  GoogleAuthButton,
} from '@/components/auth/auth-social'
import { AuthIllustration } from '@/components/svg-assets/auth-illustration'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { MailIcon } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'

export default function LoginScreen() {
  const [withEmail, setWithEmail] = useState(false)
  const { i18n } = useLingui()
  return (
    <ScrollView
      className="bg-card"
      contentContainerClassName="gap-4 p-8"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Trans>
        <View className="gap-4">
          <Text className="font-sans font-semibold text-3xl text-primary">
            Manage your expense seamlessly
          </Text>
          <Text className="font-sans text-muted-foreground">
            Let <Text className="text-primary">6pm</Text> a good time to spend
          </Text>
        </View>
      </Trans>
      <AuthIllustration className="my-16 h-[326px] text-primary" />
      <View className="flex flex-col gap-3">
        <AppleAuthButton />
        <GoogleAuthButton />
        <Button variant="outline" onPress={() => setWithEmail(true)}>
          <MailIcon className="h-5 w-5 text-primary" />
          <Text>{t(i18n)`Continue with Email`}</Text>
        </Button>
        <Separator className="mx-auto my-3 w-[70%]" />
        {withEmail && <AuthEmail />}
      </View>
      <View className="px-4">
        <Trans>
          <Text className="mx-auto text-center font-sans text-muted-foreground text-xs">
            By continuing, you acknowledge that you understand and agree to our{' '}
            <Link href="/privacy-policy">
              <Text className="text-primary text-xs">Privacy Policy</Text>
            </Link>
          </Text>
        </Trans>
      </View>
    </ScrollView>
  )
}
