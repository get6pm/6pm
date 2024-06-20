import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'

import { useController } from 'react-hook-form'
import { Keyboard } from 'react-native'
import { CurrencySheetList } from '../common/currency-sheet'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

export function SelectCurrencyField({
  onSelect,
}: {
  onSelect?: (currency: string) => void
}) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const {
    field: { onChange, onBlur, value },
    // fieldState,
  } = useController({ name: 'preferredCurrency' })

  return (
    <>
      <Button
        variant="ghost"
        onPress={() => {
          Keyboard.dismiss()
          sheetRef.current?.present()
        }}
        className="!border-r !h-11 !py-0 !px-0 !w-16 border-input rounded-r-none"
      >
        <Text className="text-primary font-normal text-sm">{value}</Text>
      </Button>
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={['50%', '87%']}
        enablePanDownToClose
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            enableTouchThrough
          />
        )}
      >
        <CurrencySheetList
          value={value}
          onSelect={(currency) => {
            onChange(currency.code)
            sheetRef.current?.close()
            onBlur()
            onSelect?.(currency.code)
          }}
        />
      </BottomSheetModal>
    </>
  )
}
