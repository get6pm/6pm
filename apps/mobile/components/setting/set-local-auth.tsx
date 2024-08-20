import { useUserSettingsStore } from '@/stores/user-settings/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as LocalAuthentication from 'expo-local-authentication'
import { ScanFaceIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { MenuItem } from '../common/menu-item'
import { toast } from '../common/toast'
import { Switch } from '../ui/switch'

export function SetLocalAuth() {
  const { i18n } = useLingui()
  const [isBiometricSupported, setIsBiometricSupported] = useState(false)
  const { enabledLocalAuth, setEnabledLocalAuth } = useUserSettingsStore()

  useEffect(() => {
    ;(async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      setIsBiometricSupported(compatible && enrolled)
    })()
  }, [])

  async function handleToggleLocalAuth(enabled: boolean) {
    const result = await LocalAuthentication.authenticateAsync({
      // disableDeviceFallback: true,
    })
    if (result.success) {
      setEnabledLocalAuth(enabled)
    } else {
      toast.error(result.warning ?? t(i18n)`Unknown error`)
    }
  }

  if (!isBiometricSupported) {
    return null
  }

  return (
    <MenuItem
      label={t(i18n)`Login using FaceID`}
      icon={ScanFaceIcon}
      rightSection={
        <Switch
          checked={enabledLocalAuth}
          onCheckedChange={handleToggleLocalAuth}
        />
      }
    />
  )
}
