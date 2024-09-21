import { useColorPalette } from '@/hooks/use-color-palette'
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
  BottomSheetModal,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet'
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { forwardRef, useCallback } from 'react'
import { View } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'

export const BottomSheet = forwardRef<
  BottomSheetModalMethods,
  BottomSheetModalProps
>((props, ref) => {
  const { getColor } = useColorPalette()

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

  const backgroundComponent = useCallback(
    (props: BottomSheetBackgroundProps) => (
      <View className="overflow-hidden rounded-xl bg-background" {...props} />
    ),
    [],
  )

  return (
    <BottomSheetModal
      ref={ref}
      handleIndicatorStyle={{ backgroundColor: getColor('--foreground') }}
      backdropComponent={backdropComponent}
      containerComponent={containerComponent}
      backgroundComponent={backgroundComponent}
      keyboardBehavior="extend"
      enablePanDownToClose
      enableDismissOnClose
      {...props}
    />
  )
})
