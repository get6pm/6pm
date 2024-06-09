import { Button } from '@/components/Button'
import { Separator } from '@/components/Separator'
import { AuthEmail } from '@/components/auth/auth-email'
import {
  AppleAuthButton,
  GoogleAuthButton,
} from '@/components/auth/auth-social'
import { AuthIllustration } from '@/components/svg-assets/auth-illustration'
import { Link } from 'expo-router'
import { MailIcon } from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

export default function LoginScreen() {
  const [withEmail, setWithEmail] = useState(false)
  return (
    <ScrollView
      className="bg-card"
      contentContainerClassName="gap-4 p-8"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-3xl font-semibold font-sans">
        Manage your expense seamlessly
      </Text>
      <Text className="text-muted-foreground font-sans">
        Let <Text className="text-primary">6pm</Text> a good time to spend
      </Text>
      <AuthIllustration className="h-[326px] my-16" />
      <View className="flex flex-col gap-3">
        <AppleAuthButton />
        <GoogleAuthButton />
        <Button
          label="Continue with Email"
          leftIcon={MailIcon}
          variant="outline"
          onPress={() => setWithEmail(true)}
        />
        <Separator className="w-[70%] mx-auto my-3" />
        {withEmail && <AuthEmail />}
      </View>
      <Text className="font-sans text-muted-foreground text-xs text-center mx-auto px-4 mt-4">
        By continuing, you acknowledge that you understand and agree to the{' '}
        <Link href="/terms-of-service" asChild className="text-primary">
          <Text>Terms & Conditions</Text>
        </Link>{' '}
        and{' '}
        <Link href="/privacy-policy" asChild className="text-primary">
          <Text>Privacy Policy</Text>
        </Link>
      </Text>
    </ScrollView>
  )
}
