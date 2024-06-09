import { useOAuth } from '@clerk/clerk-expo'
import type { SvgProps } from 'react-native-svg'
import { Button } from '../Button'
import { AppleLogo } from '../svg-assets/apple-logo'
import { GoogleLogo } from '../svg-assets/google-logo'

type AuthSocialProps = {
  label: string
  icon: React.ComponentType<SvgProps>
  onPress?: () => void
}

export function AuthSocial({ label, icon: Icon, onPress }: AuthSocialProps) {
  return (
    <Button label={label} leftIcon={Icon} variant="outline" onPress={onPress} />
  )
}

export function GoogleAuthButton() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onPress = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow()

      if (createdSessionId) {
        setActive?.({ session: createdSessionId })
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }

  return (
    <AuthSocial
      label="Sign in with Google"
      icon={GoogleLogo}
      onPress={onPress}
    />
  )
}

export function AppleAuthButton() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_apple' })

  const onPress = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow()

      if (createdSessionId) {
        setActive?.({ session: createdSessionId })
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }

  return (
    <AuthSocial
      label="Sign in with Apple"
      icon={AppleLogo}
      onPress={onPress}
    />
  )
}
