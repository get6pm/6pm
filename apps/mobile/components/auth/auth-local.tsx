import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as LocalAuthentication from 'expo-local-authentication'
import { LockKeyholeIcon, ScanFaceIcon } from 'lucide-react-native'
import { useCallback, useEffect } from 'react'
import { SafeAreaView } from 'react-native'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

type AuthLocalProps = {
  onAuthenticated?: () => void
}

export function AuthLocal({ onAuthenticated }: AuthLocalProps) {
  const { i18n } = useLingui()

  const handleAuthenticate = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      // disableDeviceFallback: true,
    })
    if (result.success) {
      onAuthenticated?.()
    }
  }, [onAuthenticated])

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    handleAuthenticate()
  }, [])

  return (
    <SafeAreaView className="absolute top-0 right-0 bottom-0 left-0 z-50 flex-1 items-center justify-center gap-4 bg-background">
      <LockKeyholeIcon className="size-12 text-primary" />
      <Text className="mx-8">{t(
        i18n,
      )`App is locked. Please authenticate to continue.`}</Text>
      <Button onPress={handleAuthenticate}>
        <ScanFaceIcon className="size-6 text-primary-foreground" />
        <Text>{t(i18n)`Unlock`}</Text>
      </Button>
    </SafeAreaView>
  )
}
