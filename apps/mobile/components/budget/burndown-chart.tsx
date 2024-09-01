import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { nFormatter } from '@6pm/currency'
import { dayjsExtended } from '@6pm/utilities'
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono'
import {
  DashPathEffect,
  Group,
  Path,
  RoundedRect,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { View } from 'react-native'
import {
  CartesianChart,
  type PointsArray,
  Scatter,
  useLinePath,
} from 'victory-native'

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
  const font = useFont(SpaceMono_700Bold, 16)

  const lastPoint = points.filter((i) => !!i.y).pop()

  const diffText =
    diffAmount > 0
      ? `${nFormatter(Math.abs(diffAmount), 0)} less`
      : `${nFormatter(Math.abs(diffAmount), 0)} over`

  const badgeWidth = diffText.length * LETTER_WIDTH + 12

  const lastPointBadgeX = useMemo(() => {
    if (!lastPoint) {
      return 0
    }
    const xValue = Number(lastPoint.xValue) // current day
    let offset = 0
    if (xValue > 28) {
      offset = badgeWidth
    } else if (xValue > 24) {
      offset = badgeWidth / 2
    } else if (xValue > 20) {
      offset = 16
    } else {
      offset = 6
    }

    return lastPoint.x - offset
  }, [badgeWidth, lastPoint])

  const lastPointBadgeY = useMemo(() => {
    if (!lastPoint) {
      return 0
    }
    const xValue = Number(lastPoint.xValue) // current day
    let offset = 0
    if (xValue > 15) {
      offset = 16
    } else {
      offset = -52
    }

    if (lastPoint.y! > 120) {
      offset = -52
    }

    return lastPoint.y! + offset
  }, [lastPoint])

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
            x={lastPointBadgeX}
            y={lastPointBadgeY}
            width={diffText.length * LETTER_WIDTH + 12}
            height={34}
            r={8}
            color={diffAmount > 0 ? '#16a34a' : '#ef4444'}
            opacity={0.8}
          />
          <SkiaText
            x={lastPointBadgeX + 6}
            y={lastPointBadgeY + 22}
            font={font}
            text={diffText}
            color="white"
          />
        </Group>
      )}
    </>
  )
}

type BurndownChartProps = {
  totalBudget: number
  averagePerDay: number
  data?: { day: number; amount?: number }[]
  anchorDay?: number
}

export function BurndownChart({
  totalBudget,
  averagePerDay,
  data = [],
  anchorDay = new Date().getDate(),
}: BurndownChartProps) {
  const font = useFont(SpaceMono_400Regular, 12)
  const { colorScheme } = useColorScheme()
  const defaultCurrency = useDefaultCurrency()
  const daysInMonth = dayjsExtended(anchorDay).daysInMonth()

  const chartData = Array.from({ length: daysInMonth + 1 }, (_, i) => ({
    day: i,
    amount: data.find((d) => d.day === i)?.amount ?? 0,
  })).reduce(
    (acc, usage, index) => {
      const lastDay = acc[acc.length - 1]
      return [
        ...acc,
        {
          ...usage,
          amount:
            index > anchorDay
              ? undefined
              : (lastDay?.amount || 0) + (usage.amount ?? 0),
          average: averagePerDay * index,
        },
      ]
    },
    [] as { day: number; amount?: number; average: number }[],
  )

  const todayRecord = chartData.find((i) => i.day === anchorDay)
  const diffAmount = Math.round(
    (todayRecord?.average || 0) - (todayRecord?.amount || 0),
  )

  const totalText = `${nFormatter(totalBudget, 0)} ${defaultCurrency}`

  return (
    <View className="min-h-[187px] w-full rounded-lg bg-muted">
      <CartesianChart
        data={chartData}
        xKey="day"
        yKeys={['amount', 'average']}
        domainPadding={{
          left: 14,
          right: 14,
          bottom: 24,
          top: 24,
        }}
      >
        {({ points }) => (
          <>
            <AverageLine points={points.average} />
            <UsageLine points={points.amount} diffAmount={diffAmount} />
            <SkiaText
              x={points.average[0].x}
              y={(points.average[0].y ?? 0) + 16}
              font={font}
              text={`0.00`}
              color={theme[colorScheme ?? 'light'].mutedForeground}
            />
            <SkiaText
              x={
                points.average[points.average.length - 1].x -
                totalText.length * 7
              }
              y={(points.average[points.average.length - 1].y ?? 0) - 10}
              font={font}
              text={totalText}
              color={theme[colorScheme ?? 'light'].mutedForeground}
            />
          </>
        )}
      </CartesianChart>
    </View>
  )
}
