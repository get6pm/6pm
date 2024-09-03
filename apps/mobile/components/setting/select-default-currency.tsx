import { useUserEntitlements } from '@/hooks/use-purchases'
import { sleep } from '@/lib/utils'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { useUserSettingsStore } from '@/stores/user-settings/store'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'expo-router'
import { ChevronRightIcon, CurrencyIcon } from 'lucide-react-native'
import { useRef } from 'react'
import { Keyboard, View } from 'react-native'
import { BottomSheet } from '../common/bottom-sheet'
import { CurrencySheetList } from '../common/currency-sheet'
import { MenuItem } from '../common/menu-item'
import { Text } from '../ui/text'

export function SelectDefaultCurrency() {
  const { i18n } = useLingui()
  const sheetRef = useRef<BottomSheetModal>(null)
  const defaultCurrency = useDefaultCurrency()
  const { isPro } = useUserEntitlements()
  const router = useRouter()
  const setPreferredCurrency = useUserSettingsStore().setPreferredCurrency
  return (
    <>
      <MenuItem
        label={t(i18n)`Default currency`}
        icon={CurrencyIcon}
        onPress={() => {
          if (!isPro) {
            router.push('/paywall')
            return
          }
          Keyboard.dismiss()
          sheetRef.current?.present()
        }}
        rightSection={
          <View className="flex flex-row items-center gap-2">
            <Text className="font-sans text-muted-foreground">
              {defaultCurrency}
            </Text>
            <ChevronRightIcon className="h-5 w-5 text-primary" />
          </View>
        }
      />
      <BottomSheet ref={sheetRef} index={0} snapPoints={['50%', '87%']}>
        <CurrencySheetList
          value={defaultCurrency}
          onSelect={async (currency) => {
            sheetRef.current?.close()
            await sleep(500)
            setPreferredCurrency?.(currency.code)
          }}
        />
      </BottomSheet>
    </>
  )
}
