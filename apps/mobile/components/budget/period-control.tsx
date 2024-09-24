import { formatDateRange } from '@/lib/date'
import { dayjsExtended } from '@6pm/utilities'
import type { BudgetPeriodConfig } from '@6pm/validation'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

export type PeriodControlProps = {
  periodConfigs: BudgetPeriodConfig[]
  index: number
  onChange: (index: number) => void
}

export function PeriodControl({
  periodConfigs,
  index = 0,
  onChange,
}: PeriodControlProps) {
  const couldGoBack = index > 0
  const couldGoForward = index < periodConfigs.length - 1
  const timezoneOffset = new Date().getTimezoneOffset()

  return (
    <View className="z-50 h-12 w-full flex-row items-center justify-between gap-2 bg-muted px-4">
      <Button
        size="icon"
        variant="ghost"
        onPress={() => onChange(index - 1)}
        disabled={!couldGoBack}
      >
        <ChevronLeftIcon className="size-6 text-muted-foreground" />
      </Button>
      <Text className="font-medium">
        {formatDateRange(
          dayjsExtended(periodConfigs[index].startDate!)
            .add(timezoneOffset, 'm')
            .toDate(),
          dayjsExtended(periodConfigs[index].endDate!)
            .add(timezoneOffset, 'm')
            .toDate(),
        )}
      </Text>
      <Button
        size="icon"
        variant="ghost"
        onPress={() => onChange(index + 1)}
        disabled={!couldGoForward}
      >
        <ChevronRightIcon className="size-6 text-muted-foreground" />
      </Button>
    </View>
  )
}
