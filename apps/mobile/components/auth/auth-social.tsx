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

type Strategy = 'oauth_google' | 'oauth_apple'

type AuthSocialProps = {
  label: string
  icon: React.ComponentType<SvgProps>
  strategy: Strategy
  onSignedUp: (strategy: Strategy, userId?: string) => void
  onSignedIn: (strategy: Strategy, userId?: string) => void
}

export function AuthSocial({
  label,
  icon: Icon,
  strategy,
  onSignedIn,
  onSignedUp,
}: AuthSocialProps) {
  const { startOAuthFlow } = useOAuth({ strategy })

  const onPress = async () => {
    try {
      const { createdSessionId, setActive, signUp, signIn } =
        await startOAuthFlow()

      if (createdSessionId) {
        setActive?.({ session: createdSessionId })
        if (signUp?.createdUserId) {
          setTimeout(async () => {
            await createUser({
              email: signUp.emailAddress!,
              name: signUp.firstName ?? '',
            })

            onSignedUp(strategy, signUp.id)
          }, 1000)
        }
      } else {
        // Use signIn or signUp for next steps such as MFA
        onSignedIn(strategy, signIn?.id)
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

export function GoogleAuthButton({
  onSignedUp,
  onSignedIn,
}: {
  onSignedUp: (strategy: Strategy, userId?: string) => void
  onSignedIn: (strategy: Strategy, userId?: string) => void
}) {
  const { i18n } = useLingui()
  return (
    <AuthSocial
      label={t(i18n)`Sign in with Google`}
      icon={GoogleLogo}
      strategy="oauth_google"
      onSignedIn={onSignedIn}
      onSignedUp={onSignedUp}
    />
  )
}

export function AppleAuthButton({
  onSignedUp,
  onSignedIn,
}: {
  onSignedUp: (strategy: Strategy, userId?: string) => void
  onSignedIn: (strategy: Strategy, userId?: string) => void
}) {
  const { i18n } = useLingui()
  return (
    <AuthSocial
      label={t(i18n)`Sign in with Apple`}
      icon={AppleLogo}
      strategy="oauth_apple"
      onSignedIn={onSignedIn}
      onSignedUp={onSignedUp}
    />
  )
}
