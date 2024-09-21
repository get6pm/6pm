import { cn } from '@/lib/utils'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'
import { Keyboard } from 'react-native'
import { BottomSheet } from '../common/bottom-sheet'
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
  return (
    <>
      <Button
        variant="ghost"
        onPress={() => {
          Keyboard.dismiss()
          sheetRef.current?.present()
        }}
        className={cn(
          '!border-r !h-11 !py-0 !px-0 !w-16 rounded-r-none border-input',
          className,
        )}
      >
        <Text className="font-regular text-foreground text-sm">{value}</Text>
      </Button>
      <BottomSheet ref={sheetRef} index={0} snapPoints={['50%', '87%']}>
        <CurrencySheetList
          value={value}
          onSelect={(currency) => {
            onChange?.(currency.code)
            setTimeout(() => sheetRef.current?.close(), 200)
          }}
        />
      </BottomSheet>
    </>
  )
}
