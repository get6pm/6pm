import { formatDateShort } from '@/lib/date'
import { sleep } from '@/lib/utils'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { useController } from 'react-hook-form'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

function SpinnerDatePicker({
  value,
  onChange,
}: {
  value: Date
  onChange: (date: Date | undefined) => void
}) {
  const { i18n } = useLingui()
  const [date, setDate] = useState<Date | undefined>(value)

  return (
    <View className="gap-4">
      <DateTimePicker
        value={value}
        mode="date"
        display="spinner"
        onChange={(_, selectedDate) => {
          setDate(selectedDate)
        }}
      />
      <Button
        className="mx-6"
        onPress={() => {
          onChange(date)
        }}
      >
        <Text>{t(i18n)`Save`}</Text>
      </Button>
    </View>
  )
}

export function SelectDateField({
  onSelect,
}: {
  onSelect?: (date?: Date) => void
}) {
  const { bottom } = useSafeAreaInsets()
  const sheetRef = useRef<BottomSheetModal>(null)
  const {
    field: { onChange, onBlur, value },
  } = useController({ name: 'date' })

  return (
    <>
      <Button
        variant="outline"
        className="!px-3"
        onPress={() => {
          sheetRef.current?.present()
        }}
      >
        <Calendar className="w-5 h-5 text-primary" />
        <Text>{formatDateShort(value)}</Text>
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
        containerComponent={(props) => (
          <FullWindowOverlay>{props.children}</FullWindowOverlay>
        )}
      >
        <BottomSheetView
          style={{
            paddingBottom: bottom,
          }}
        >
          <SpinnerDatePicker
            value={value}
            onChange={async (date) => {
              sheetRef.current?.close()
              await sleep(500)
              onChange(date)
              onBlur()
              onSelect?.(date)
            }}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}
