import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'

import { WALLET_ICONS } from '@/lib/icons/wallet-icons'
import { useController } from 'react-hook-form'
import { Keyboard } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
import GenericIcon from '../common/generic-icon'
import { IconGridSheet } from '../common/icon-grid-sheet'
import { Button } from '../ui/button'

export function SelectAccountIconField({
  onSelect,
}: {
  onSelect?: (currency: string) => void
}) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const {
    field: { onChange, onBlur, value },
    // fieldState,
  } = useController({ name: 'icon' })

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
        <GenericIcon name={value} className="size-6 text-primary" />
      </Button>
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        enableDynamicSizing
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
        containerComponent={(props) => <FullWindowOverlay>{props.children}</FullWindowOverlay>}
      >
        <IconGridSheet
          icons={WALLET_ICONS}
          value={value}
          onSelect={(icon) => {
            onChange(icon)
            onBlur()
            onSelect?.(icon)
            setTimeout(() => sheetRef.current?.close(), 200)
          }}
        />
      </BottomSheetModal>
    </>
  )
}
