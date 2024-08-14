import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { forwardRef, useCallback } from 'react'
import { FullWindowOverlay } from 'react-native-screens'

export const BottomSheet = forwardRef<
  BottomSheetModalMethods,
  BottomSheetModalProps
>((props, ref) => {
  const { colorScheme } = useColorScheme()

  const backdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        enableTouchThrough
      />
    ),
    [],
  )

  const containerComponent = useCallback(
    (props: { children?: React.ReactNode }) => (
      <FullWindowOverlay>{props.children}</FullWindowOverlay>
    ),
    [],
  )

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={{ backgroundColor: theme[colorScheme].background }}
      backdropComponent={backdropComponent}
      containerComponent={containerComponent}
      keyboardBehavior="extend"
      enablePanDownToClose
      enableDismissOnClose
      {...props}
    />
  )
})
