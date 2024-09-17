import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRef } from 'react'

import { WALLET_ICONS } from '@/lib/icons/wallet-icons'
import { useController } from 'react-hook-form'
import { Keyboard } from 'react-native'
import { BottomSheet } from '../common/bottom-sheet'
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
        className="!border-r !h-11 !py-0 !px-0 !w-16 rounded-r-none border-input"
      >
        <GenericIcon name={value} className="size-5 text-foreground" />
      </Button>
      <BottomSheet ref={sheetRef} index={0} enableDynamicSizing>
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
      </BottomSheet>
    </>
  )
}
