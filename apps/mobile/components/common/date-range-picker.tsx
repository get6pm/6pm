import { formatDateShort } from '@/lib/date'
import { cn, sleep } from '@/lib/utils'
import { dayjsExtended } from '@6pm/utilities'
import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Haptics from 'expo-haptics'
import { ArrowRightIcon } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Keyboard, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../ui/button'
import { Text } from '../ui/text'
import { BottomSheet } from './bottom-sheet'

function SpinnerDatePicker({
  value,
  onChange,
  maximumDate,
  minimumDate,
  title,
}: {
  value?: Date
  onChange: (date: Date | undefined) => void
  maximumDate?: Date
  minimumDate?: Date
  title?: string
}) {
  const { i18n } = useLingui()
  const [date, setDate] = useState<Date>(value ?? new Date())

  return (
    <View className="gap-4">
      <Text className="mx-6 mt-2 text-center font-medium text-foreground">
        {title}
      </Text>
      <DateTimePicker
        value={date}
        mode="date"
        display="spinner"
        onChange={(_, selectedDate) => {
          setDate(selectedDate!)
        }}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
      />
      <Button
        className="mx-6"
        onPress={() => {
          Haptics.selectionAsync()
          onChange(date)
        }}
      >
        <Text>{t(i18n)`Save`}</Text>
      </Button>
    </View>
  )
}

export function DateRangePicker({
  value = [],
  onChange,
  maximumDate,
  minimumDate,
}: {
  value?: Date[]
  onChange?: (date?: Date[]) => void
  maximumDate?: Date
  minimumDate?: Date
}) {
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()
  const sheetFromRef = useRef<BottomSheetModal>(null)
  const sheetToRef = useRef<BottomSheetModal>(null)
  const [fromDate, toDate] = value ?? []

  return (
    <>
      <View className="flex-row items-center gap-4">
        <Button
          variant="outline"
          className="h-11 flex-1"
          onPress={() => {
            Haptics.selectionAsync()
            Keyboard.dismiss()
            sheetFromRef.current?.present()
          }}
        >
          <Text
            className={cn(fromDate ? 'text-primary' : 'text-muted-foreground')}
          >
            {fromDate ? formatDateShort(fromDate) : t(i18n)`From date`}
          </Text>
        </Button>
        <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
        <Button
          variant="outline"
          className="h-11 flex-1"
          onPress={() => {
            Haptics.selectionAsync()
            Keyboard.dismiss()
            sheetToRef.current?.present()
          }}
        >
          <Text
            className={cn(toDate ? 'text-primary' : 'text-muted-foreground')}
          >
            {toDate ? formatDateShort(toDate) : t(i18n)`To date`}
          </Text>
        </Button>
      </View>
      <BottomSheet ref={sheetFromRef} index={0} enableDynamicSizing>
        <BottomSheetView
          style={{
            paddingBottom: bottom,
          }}
        >
          <SpinnerDatePicker
            title={t(i18n)`Period start date`}
            value={fromDate}
            onChange={async (date = fromDate) => {
              sheetFromRef.current?.close()
              await sleep(500)
              onChange?.([date, toDate])
              if (!toDate) {
                onChange?.([date, dayjsExtended(date).add(1, 'day').toDate()])
                sheetToRef.current?.present()
              } else {
                onChange?.([date, toDate])
              }
            }}
            maximumDate={
              toDate
                ? dayjsExtended(toDate).subtract(1, 'day').toDate()
                : maximumDate
            }
            minimumDate={minimumDate}
          />
        </BottomSheetView>
      </BottomSheet>
      <BottomSheet ref={sheetToRef} index={0} enableDynamicSizing>
        <BottomSheetView
          style={{
            paddingBottom: bottom,
          }}
        >
          <SpinnerDatePicker
            title={t(i18n)`Period end date`}
            value={toDate}
            onChange={async (date = toDate) => {
              sheetToRef.current?.close()
              await sleep(500)
              onChange?.([fromDate, date])
            }}
            maximumDate={maximumDate}
            minimumDate={
              fromDate
                ? dayjsExtended(fromDate).add(1, 'day').toDate()
                : minimumDate
            }
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  )
}
