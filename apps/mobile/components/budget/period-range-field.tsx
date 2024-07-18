import { useController, useFormState, useWatch } from 'react-hook-form'
import { View } from 'react-native'
import { DateRangePicker } from '../common/date-range-picker'
import { Text } from '../ui/text'

export function PeriodRangeField() {
  const { errors } = useFormState()
  const periodType = useWatch({ name: 'period.type' })

  const {
    field: { onChange: onChangeStartDate, value: startDate },
  } = useController({
    name: 'period.startDate',
  })
  const {
    field: { onChange: onChangeEndDate, value: endDate },
  } = useController({
    name: 'period.endDate',
  })

  if (periodType !== 'CUSTOM') {
    return null
  }

  return (
    <View className="gap-2">
      <DateRangePicker
        value={[startDate, endDate]}
        onChange={(dates) => {
          const [startDate, endDate] = dates ?? []
          onChangeStartDate(startDate)
          onChangeEndDate(endDate)
        }}
      />
      {!!errors.period?.root?.message && (
        <Text className="text-destructive text-center">
          {errors.period.root.message.toString()}
        </Text>
      )}
    </View>
  )
}
