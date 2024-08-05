import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'

import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { sleep } from '@/lib/utils'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { useUserSettingsStore } from '@/stores/user-settings/store'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { ChevronRightIcon, CurrencyIcon } from 'lucide-react-native'
import { Keyboard, View } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
import { CurrencySheetList } from '../common/currency-sheet'
import { MenuItem } from '../common/menu-item'
import { Text } from '../ui/text'

export function SelectDefaultCurrency() {
  const { i18n } = useLingui()
  const sheetRef = useRef<BottomSheetModal>(null)
  const defaultCurrency = useDefaultCurrency()
  const setPreferredCurrency = useUserSettingsStore().setPreferredCurrency
  const { colorScheme } = useColorScheme()
  return (
    <>
      <MenuItem
        label={t(i18n)`Default currency`}
        icon={CurrencyIcon}
        onPress={() => {
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
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={['50%', '87%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme[colorScheme].background }}
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            enableTouchThrough
          />
        )}
        containerComponent={(props) => (
          <FullWindowOverlay>{props.children}</FullWindowOverlay>
        )}
      >
        <CurrencySheetList
          value={defaultCurrency}
          onSelect={async (currency) => {
            sheetRef.current?.close()
            await sleep(500)
            setPreferredCurrency?.(currency.code)
          }}
        />
      </BottomSheetModal>
    </>
  )
}
