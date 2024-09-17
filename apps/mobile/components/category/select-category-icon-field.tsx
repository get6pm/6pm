import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useMemo, useRef } from 'react'

import {
  CATEGORY_EXPENSE_ICONS,
  CATEGORY_INCOME_ICONS,
} from '@/lib/icons/category-icons'
import { sleep } from '@/lib/utils'
import type { CategoryTypeType } from '@6pm/validation'
import { useController } from 'react-hook-form'
import { Keyboard } from 'react-native'
import { BottomSheet } from '../common/bottom-sheet'
import GenericIcon from '../common/generic-icon'
import { IconGridSheet } from '../common/icon-grid-sheet'
import { Button } from '../ui/button'

export function SelectCategoryIconField({
  onSelect,
  disabled,
  type,
}: {
  onSelect?: (currency: string) => void
  disabled?: boolean
  type: CategoryTypeType
}) {
  const sheetRef = useRef<BottomSheetModal>(null)

  const {
    field: { onChange, onBlur, value },
    // fieldState,
  } = useController({ name: 'icon' })

  const icons = useMemo(
    () => (type === 'EXPENSE' ? CATEGORY_EXPENSE_ICONS : CATEGORY_INCOME_ICONS),
    [type],
  )

  return (
    <>
      <Button
        variant="ghost"
        disabled={disabled}
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
          icons={icons}
          value={value}
          onSelect={async (icon) => {
            sheetRef.current?.close()
            await sleep(500)
            onChange(icon)
            onBlur()
            onSelect?.(icon)
          }}
        />
      </BottomSheet>
    </>
  )
}
