import { createUser } from '@/mutations/user'
import { useOAuth } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import type { SvgProps } from 'react-native-svg'
import { toast } from '../common/toast'
import { AppleLogo } from '../svg-assets/apple-logo'
import { GoogleLogo } from '../svg-assets/google-logo'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

type AuthSocialProps = {
  label: string
  icon: React.ComponentType<SvgProps>
  strategy: 'oauth_google' | 'oauth_apple'
}

export function AuthSocial({ label, icon: Icon, strategy }: AuthSocialProps) {
  const { startOAuthFlow } = useOAuth({ strategy })

  const onPress = async () => {
    try {
      const { createdSessionId, setActive, signUp } = await startOAuthFlow()

      if (createdSessionId) {
        setActive?.({ session: createdSessionId })
        if (signUp?.createdUserId) {
          setTimeout(
            async () =>
              await createUser({
                email: signUp.emailAddress!,
                name: signUp.firstName ?? '',
              }),
            1000,
          )
        }
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (err: any) {
      toast.error(
        err?.errors?.[0]?.longMessage ?? err.message ?? 'Unknown error',
      )
    }
  }

  return (
    <Button variant="outline" onPress={onPress}>
      <Icon className="h-5 w-5 text-primary" />
      <Text>{label}</Text>
    </Button>
  )
}

export function GoogleAuthButton() {
  const { i18n } = useLingui()
  return (
    <AuthSocial
      label={t(i18n)`Sign in with Google`}
      icon={GoogleLogo}
      strategy="oauth_google"
    />
  )
}

export function AppleAuthButton() {
  const { i18n } = useLingui()
  return (
    <AuthSocial
      label={t(i18n)`Sign in with Apple`}
      icon={AppleLogo}
      strategy="oauth_apple"
    />
  )
}
