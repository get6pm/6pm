import type { SvgProps } from 'react-native-svg'
import { Button } from '../Button'
import { AppleLogo } from '../svg-assets/apple-logo'
import { GoogleLogo } from '../svg-assets/google-logo'

type AuthSocialProps = {
  label: string
  icon: React.ComponentType<SvgProps>
}

export function AuthSocial({
  label,
  icon: Icon,
}: AuthSocialProps) {
  return (
    <Button
      label={label}
      leftIcon={Icon}
      variant="outline"
    />
  )
}

export function GoogleAuthButton() {
  return (
    <AuthSocial
      label="Sign in with Google"
      icon={GoogleLogo}
    />
  )
}

export function AppleAuthButton() {
  return (
    <AuthSocial
      label="Sign in with Apple"
      icon={AppleLogo}
    />
  )
}
