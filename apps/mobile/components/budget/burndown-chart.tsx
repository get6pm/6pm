import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useBudgetList } from '@/stores/budget/hooks'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { nFormatter } from '@6pm/currency'
import { dayjsExtended } from '@6pm/utilities'
import {
  DashPathEffect,
  Group,
  Path,
  RoundedRect,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia'
import { View } from 'react-native'
import {
  CartesianChart,
  type PointsArray,
  Scatter,
  useLinePath,
} from 'victory-native'
import { Text } from '../ui/text'

function AverageLine({ points }: { points: PointsArray }) {
  const { colorScheme } = useColorScheme()
  const { path } = useLinePath(points, { curveType: 'linear' })
  return (
    <Path
      path={path}
      style="stroke"
      opacity={0.3}
      strokeWidth={2.5}
      color={theme[colorScheme].mutedForeground}
      strokeCap="round"
    >
      <DashPathEffect intervals={[6, 6]} />
    </Path>
  )
}

const LETTER_WIDTH = 10

function UsageLine({
  points,
  diffAmount,
}: { points: PointsArray; diffAmount: number }) {
  const { colorScheme } = useColorScheme()
  const { path } = useLinePath(points, { curveType: 'cardinal' })
  const font = useFont(require('../../assets/fonts/SpaceMono-Regular.ttf'), 16)

  const lastPoint = points.filter((i) => !!i.y).pop()

  const diffText =
    diffAmount > 0
      ? `${nFormatter(Math.abs(diffAmount), 0)} less`
      : `${nFormatter(Math.abs(diffAmount), 0)} over`

  return (
    <>
      <Path
        path={path}
        style="stroke"
        strokeWidth={3}
        color={theme[colorScheme].primary}
        strokeCap="round"
      />
      {lastPoint && (
        <Group transform={[{ translateX: 6 }]}>
          <Scatter
            points={[lastPoint]}
            color={theme[colorScheme].primary}
            shape="circle"
            style="stroke"
            strokeWidth={3}
            radius={6}
          />
          <RoundedRect
            x={lastPoint.x - (Number(lastPoint.xValue) > 20 ? 16 : 6)}
            y={lastPoint.y! + (Number(lastPoint.xValue) > 15 ? 16 : -52)}
            width={diffText.length * LETTER_WIDTH + 12}
            height={34}
            r={8}
            color={diffAmount > 0 ? '#16a34a' : '#ef4444'}
          />
          <SkiaText
            x={lastPoint.x - (Number(lastPoint.xValue) > 20 ? 10 : 0)}
            y={lastPoint.y! + (Number(lastPoint.xValue) > 15 ? 38 : -30)}
            font={font}
            text={diffText}
            color="white"
          />
        </Group>
      )}
    </>
  )
}

export function BurndownChart() {
  const { totalBudget } = useBudgetList()
  const defaultCurrency = useDefaultCurrency()

  const today = dayjsExtended(new Date()).get('date') + 1

  const daysInMonth = dayjsExtended(new Date()).daysInMonth()

  const averagePerDay = totalBudget.div(daysInMonth).toNumber()

  const mockUsageData = Array.from({ length: daysInMonth + 1 }, (_, i) => ({
    day: i,
    amount: i === 0 ? 0 : Math.random() * averagePerDay * 2,
  }))

  const chartData = mockUsageData.reduce(
    (acc, usage, index) => {
      const lastDay = acc[acc.length - 1]
      return [
        ...acc,
        {
          ...usage,
          amount:
            index > today ? undefined : (lastDay?.amount || 0) + usage.amount,
          average: averagePerDay * index,
        },
      ]
    },
    [] as { day: number; amount?: number; average: number }[],
  )

  const todayRecord = chartData.find((i) => i.day === today)
  const diffAmount = Math.round(
    (todayRecord?.average || 0) - (todayRecord?.amount || 0),
  )

  return (
    <View className="bg-muted rounded-lg h-[187px] w-full">
      <Text className="text-sm font-medium text-end self-end m-3 mb-0 text-muted-foreground">
        {totalBudget.toNumber().toLocaleString()} {defaultCurrency}
      </Text>
      <CartesianChart
        data={chartData}
        xKey="day"
        yKeys={['amount', 'average']}
        domainPadding={{
          left: 14,
          right: 14,
          bottom: 8,
          top: 0,
        }}
      >
        {({ points }) => (
          <>
            <AverageLine points={points.average} />
            <UsageLine points={points.amount} diffAmount={diffAmount} />
          </>
        )}
      </CartesianChart>
      <Text className="text-sm font-medium m-3 mt-0 text-muted-foreground">
        {'0.00'} {defaultCurrency}
      </Text>
    </View>
  )
}