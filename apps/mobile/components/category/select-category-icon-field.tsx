import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useMemo, useRef } from 'react'

import { useColorScheme } from '@/hooks/useColorScheme'
import {
  CATEGORY_EXPENSE_ICONS,
  CATEGORY_INCOME_ICONS,
} from '@/lib/icons/category-icons'
import { theme } from '@/lib/theme'
import { sleep } from '@/lib/utils'
import type { CategoryTypeType } from '@6pm/validation'
import { useController } from 'react-hook-form'
import { Keyboard } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'
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
  const { colorScheme } = useColorScheme()

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
        className="!border-r !h-11 !py-0 !px-0 !w-16 border-input rounded-r-none"
      >
        <GenericIcon name={value} className="size-6 text-primary" />
      </Button>
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        enableDynamicSizing
        enablePanDownToClose
        enableDismissOnClose
        keyboardBehavior="extend"
        backgroundStyle={{ backgroundColor: theme[colorScheme].background }}
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
      </BottomSheetModal>
    </>
  )
}
