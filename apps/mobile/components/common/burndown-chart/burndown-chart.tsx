import { useColorPalette } from '@/hooks/use-color-palette'
import { nFormatter } from '@6pm/currency'
import { dayjsExtended } from '@6pm/utilities'
import {
  Circle,
  DashPathEffect,
  Group,
  Path,
  useFont,
} from '@shopify/react-native-skia'
import * as Haptics from 'expo-haptics'
import { useEffect } from 'react'
import { View } from 'react-native'
import {
  CartesianChart,
  type PointsArray,
  useAnimatedPath,
  useChartPressState,
  useLinePath,
} from 'victory-native'
import { ActiveValueIndicator } from './active-value-indicator'
import { DiffBadge } from './diff-badge'

type BurndownChartProps = {
  totalBudget: number
  averagePerDay: number
  data?: { day: number; amount?: number }[]
  anchorDay?: number
}

export function BurndownChart({
  // totalBudget,
  averagePerDay,
  data = [],
  anchorDay = new Date().getDate(),
}: BurndownChartProps) {
  const { getColor } = useColorPalette()
  const axisFont = useFont(
    require('../../../assets/fonts/Haskoy-Medium.ttf'),
    12,
  )
  const daysInMonth = dayjsExtended(anchorDay).daysInMonth()
  const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i,
    amount: data.find((d) => d.day === i)?.amount ?? 0,
  })).reduce(
    (acc, usage, index) => {
      const lastDay = acc[acc.length - 1]
      return [
        ...acc,
        {
          ...usage,
          accumulated:
            index > anchorDay
              ? undefined
              : (lastDay?.accumulated || 0) + (usage.amount ?? 0),
          average: averagePerDay * index,
        },
      ]
    },
    [] as {
      day: number
      amount?: number
      average: number
      accumulated?: number
    }[],
  )

  const anchorRecord = chartData.find((i) => i.day === anchorDay)
  const diffAmount = Math.round(
    (anchorRecord?.average || 0) - (anchorRecord?.accumulated || 0),
  )
  const { state: firstTouch, isActive: isFirstPressActive } =
    useChartPressState({
      x: 0,
      y: {
        average: 0,
        amount: 0,
        accumulated: 0,
      },
    })

  useEffect(() => {
    if (firstTouch.x) {
      Haptics.selectionAsync().catch(() => null)
    }
  }, [firstTouch.x])

  return (
    <View className="min-h-[200px] w-full rounded-lg bg-muted">
      <CartesianChart
        data={chartData}
        xKey="day"
        yKeys={['amount', 'average', 'accumulated']}
        domainPadding={{
          left: 14,
          right: 24,
          bottom: 24,
          top: 24,
        }}
        padding={{ left: 5, right: 5, bottom: 5, top: 5 }}
        xAxis={{
          font: axisFont,
          tickCount: 4,
          labelPosition: 'inset',
          lineWidth: 0,
          labelColor: getColor('--foreground', { alpha: 0.5 }),
        }}
        yAxis={[
          {
            font: axisFont,
            formatYLabel: (value) => nFormatter(value || 0, 0),
            axisSide: 'right',
            labelPosition: 'inset',
            labelColor: getColor('--foreground', { alpha: 0.5 }),
            // tickValues: [0, totalBudget / 2, totalBudget],
            lineWidth: 0,
          },
        ]}
        chartPressState={[firstTouch]}
        renderOutside={({ chartBounds, points }) => {
          const lastPoint = points.accumulated.filter((i) => !!i.y).pop()
          return (
            <>
              {isFirstPressActive ? (
                <ActiveValueIndicator
                  bottom={chartBounds.bottom}
                  top={chartBounds.top}
                  pressState={firstTouch}
                />
              ) : lastPoint ? (
                <Group>
                  <Circle
                    cx={lastPoint.x}
                    cy={lastPoint.y!}
                    r={7}
                    color={getColor('--foreground')}
                  />
                  <Circle
                    cx={lastPoint.x}
                    cy={lastPoint.y!}
                    r={4.5}
                    color={getColor('--muted')}
                  />
                  <DiffBadge
                    anchorDay={anchorDay}
                    diffAmount={diffAmount}
                    point={{
                      x: lastPoint.x,
                      y: lastPoint.y || 0,
                    }}
                  />
                </Group>
              ) : null}
            </>
          )
        }}
      >
        {({ points }) => (
          <>
            <AverageLine points={points.average} />
            <UsageLine points={points.accumulated} />
          </>
        )}
      </CartesianChart>
    </View>
  )
}

function AverageLine({ points }: { points: PointsArray }) {
  const { path } = useLinePath(points, { curveType: 'linear' })
  const { getColor } = useColorPalette()

  return (
    <Path
      path={path}
      style="stroke"
      opacity={0.3}
      strokeWidth={2}
      color={getColor('--muted-foreground')}
      strokeCap="round"
    >
      <DashPathEffect intervals={[6, 6]} />
    </Path>
  )
}

function UsageLine({ points }: { points: PointsArray }) {
  const { path } = useLinePath(points, { curveType: 'monotoneX' })
  const animPath = useAnimatedPath(path, { type: 'timing', duration: 1000 })
  const { getColor } = useColorPalette()

  return (
    <>
      <Path
        path={animPath}
        style="stroke"
        strokeWidth={2.5}
        color={getColor('--primary')}
        strokeCap="round"
      />
    </>
  )
}
