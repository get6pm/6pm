import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'

import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { Keyboard } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
import { CurrencySheetList } from '../common/currency-sheet'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

export function CurrencyField({
  value,
  onChange,
  className,
}: {
  value: string
  onChange?: (currency: string) => void
  className?: string
}) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const { colorScheme } = useColorScheme()
  return (
    <>
      <Button
        variant="ghost"
        onPress={() => {
          Keyboard.dismiss()
          sheetRef.current?.present()
        }}
        className={cn(
          '!border-r !h-11 !py-0 !px-0 !w-16 border-input rounded-r-none',
          className,
        )}
      >
        <Text className="text-primary font-normal text-sm">{value}</Text>
      </Button>
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
          value={value}
          onSelect={(currency) => {
            onChange?.(currency.code)
            setTimeout(() => sheetRef.current?.close(), 200)
          }}
        />
      </BottomSheetModal>
    </>
  )
}
