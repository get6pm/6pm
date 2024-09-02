import { formatDateRange } from '@/lib/date'
import { cn } from '@/lib/utils'
import { dayjsExtended } from '@6pm/utilities'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { Button } from '../ui/button'
import { Text } from '../ui/text'
import { HomeFilter } from './select-filter'

type TimeRange = {
  from: Date
  to: Date
}

export type TimeRangeControlProps = {
  filter: HomeFilter
  timeRange: TimeRange
  onTimeRangeChange: (timeRange: TimeRange) => void
  className?: string
}

export function TimeRangeControl({
  filter,
  timeRange,
  onTimeRangeChange,
  className,
}: TimeRangeControlProps) {
  function handlePrevious() {
    if (filter === HomeFilter.ByDay) {
      onTimeRangeChange({
        from: dayjsExtended(timeRange.from)
          .subtract(1, 'day')
          .startOf('day')
          .toDate(),
        to: dayjsExtended(timeRange.to)
          .subtract(1, 'day')
          .endOf('day')
          .toDate(),
      })
    } else if (filter === HomeFilter.ByWeek) {
      onTimeRangeChange({
        from: dayjsExtended(timeRange.from)
          .subtract(1, 'week')
          .startOf('day')
          .startOf('week')
          .toDate(),
        to: dayjsExtended(timeRange.to)
          .subtract(1, 'week')
          .endOf('day')
          .endOf('week')
          .toDate(),
      })
    } else if (filter === HomeFilter.ByMonth) {
      onTimeRangeChange({
        from: dayjsExtended(timeRange.from)
          .subtract(1, 'month')
          .startOf('day')
          .startOf('month')
          .toDate(),
        to: dayjsExtended(timeRange.to)
          .subtract(1, 'month')
          .endOf('day')
          .endOf('month')
          .toDate(),
      })
    }
  }

  function handleNext() {
    if (filter === HomeFilter.ByDay) {
      onTimeRangeChange({
        from: dayjsExtended(timeRange.from)
          .add(1, 'day')
          .startOf('day')
          .toDate(),
        to: dayjsExtended(timeRange.to).add(1, 'day').endOf('day').toDate(),
      })
    } else if (filter === HomeFilter.ByWeek) {
      onTimeRangeChange({
        from: dayjsExtended(timeRange.from)
          .add(1, 'week')
          .startOf('day')
          .startOf('week')
          .toDate(),
        to: dayjsExtended(timeRange.to)
          .add(1, 'week')
          .endOf('day')
          .endOf('week')
          .toDate(),
      })
    } else if (filter === HomeFilter.ByMonth) {
      onTimeRangeChange({
        from: dayjsExtended(timeRange.from)
          .add(1, 'month')
          .startOf('day')
          .startOf('month')
          .toDate(),
        to: dayjsExtended(timeRange.to)
          .add(1, 'month')
          .endOf('day')
          .endOf('month')
          .toDate(),
      })
    }
  }

  return (
    <View
      className={cn(
        'h-12 w-full flex-row items-center justify-between gap-2 px-6',
        className,
      )}
    >
      <Button size="icon" variant="secondary" onPress={handlePrevious}>
        <ChevronLeftIcon className="size-6 text-muted-foreground" />
      </Button>
      <Text className="font-medium">
        {formatDateRange(timeRange.from, timeRange.to)}
      </Text>
      <Button size="icon" variant="secondary" onPress={handleNext}>
        <ChevronRightIcon className="size-6 text-muted-foreground" />
      </Button>
    </View>
  )
}
