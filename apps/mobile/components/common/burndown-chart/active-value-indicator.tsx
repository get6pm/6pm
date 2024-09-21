import { useColorPalette } from '@/hooks/use-color-palette'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { nFormatter } from '@6pm/currency'
import { dayjsExtended } from '@6pm/utilities'
import { useState } from 'react'
import { runOnJS, useDerivedValue } from 'react-native-reanimated'
import type { ChartPressState } from 'victory-native'

import {
  Circle,
  Line as SkiaLine,
  Text as SkiaText,
  useFont,
  vec,
} from '@shopify/react-native-skia'
import { DiffBadge } from './diff-badge'

type ActiveValueIndicatorProps = {
  bottom: number
  top: number
  pressState: ChartPressState<{
    x: number
    y: {
      average: number
      amount: number
      accumulated: number
    }
  }>
}

export function ActiveValueIndicator({
  bottom,
  top,
  pressState,
}: ActiveValueIndicatorProps) {
  const { getColor } = useColorPalette()
  const tooltipFont = useFont(
    require('../../../assets/fonts/Haskoy-Medium.ttf'),
    12,
  )
  const x = pressState.x.position
  const y = pressState.y.accumulated.position
  const activeValue = pressState.y.amount.value
  const date = pressState.x.value
  const start = useDerivedValue(() => vec(x.value, bottom - 12))
  const end = useDerivedValue(() => vec(x.value, top + 1.5 * 12))
  const defaultCurrency = useDefaultCurrency()
  const [value, setValue] = useState<string>('')

  function formatDate(value: number, date: number) {
    const result = `
      ${nFormatter(value, 0)} ${defaultCurrency} on ${dayjsExtended(
        dayjsExtended().set('date', date),
      ).format('MMM D')}
    `
    setValue(result)
  }
  const activeValueDisplay = useDerivedValue(() => {
    runOnJS(formatDate)(activeValue.value, date.value)
    return value!
  })
  const activeValueWidth = useDerivedValue(
    () =>
      tooltipFont
        ?.getGlyphWidths?.(tooltipFont.getGlyphIDs(activeValueDisplay.value))
        .reduce((sum, value) => sum + value, 0) || 0,
  )
  const activeValueX = useDerivedValue(() => {
    if (date.value < 5) {
      return date.value
    }
    if (date.value > 26) {
      return x.value - activeValueWidth.value
    }
    return x.value - activeValueWidth.value / 2
  })

  const diffAmount = Math.round(
    (pressState.y.average.value.value || 0) -
      (pressState.y.accumulated.value.value || 0),
  )

  return (
    <>
      <SkiaLine
        p1={start}
        p2={end}
        opacity={0.3}
        color={getColor('--muted-foreground')}
        strokeWidth={1}
      />
      <Circle cx={x} cy={y} r={7} color={getColor('--foreground')} />
      <Circle cx={x} cy={y} r={4.5} color={getColor('--muted')} />
      <SkiaText
        color={getColor('--muted-foreground')}
        font={tooltipFont}
        text={activeValueDisplay}
        x={activeValueX}
        y={top + 12}
      />
      <DiffBadge
        anchorDay={date.value}
        diffAmount={diffAmount}
        point={{ x: x.value, y: y.value }}
      />
    </>
  )
}
