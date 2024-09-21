import { useColorPalette } from '@/hooks/use-color-palette'
import { useEffect } from 'react'
import { type StyleProp, View, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { svgPathProperties } from 'svg-path-properties'
import { Text } from '../ui/text'

const defaultWidth = 52
const defaultHeight = 52
const defaultRadius = defaultWidth * 0.4
const defaultStrokeWidth = 4
const AnimatedPath = Animated.createAnimatedComponent(Path)

type AnimatedDonutProps = {
  width?: number
  height?: number
  radius?: number
  strokeColor?: string
  strokeInactiveColor?: string
  strokeWidth?: number
  progress?: number
  duration?: number
  delay?: number
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function CircularProgress({
  width = defaultWidth,
  height = defaultHeight,
  radius = defaultRadius,
  strokeColor,
  strokeInactiveColor,
  strokeWidth = defaultStrokeWidth,
  progress = 50,
  duration = 500,
  delay = 500,
  style,
}: AnimatedDonutProps) {
  const { getColor } = useColorPalette()
  const d = `
    M ${width / 2} 0
    H ${width - radius}
    C ${width} 0, ${width} ${radius}, ${width} ${radius}
    V ${height - radius}
    C ${width} ${height}, ${width - radius} ${height}, ${
      width - radius
    } ${height}
    H ${radius}
    C 0 ${height}, 0 ${height - radius}, 0 ${height - radius}
    V ${radius}
    C 0 0, ${radius} 0, ${radius} 0
    H ${width / 2}
  `
  const wRatio = strokeWidth ? 1 - strokeWidth / width : 1
  const hRatio = strokeWidth ? 1 - strokeWidth / height : 1

  const properties = new svgPathProperties(d)
  const length = properties.getTotalLength()
  const animatedValue = useSharedValue(length)

  const chartPercentage = progress > 100 ? 100 : progress

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(length - (chartPercentage * length) / 100, { duration }),
    )
  }, [duration, chartPercentage])

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: animatedValue.value,
    }
  })

  return (
    <View style={[style, { width, height }]}>
      <Svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        <Path
          id="s"
          originX={width / 2}
          originY={height / 2}
          scaleX={wRatio}
          scaleY={hRatio}
          strokeWidth={strokeWidth}
          d={d}
          fill="transparent"
          stroke={strokeInactiveColor || getColor('--muted')}
          strokeLinejoin="miter"
          strokeMiterlimit={0}
        />
        <AnimatedPath
          id="s"
          originX={width / 2}
          originY={height / 2}
          scaleX={wRatio}
          scaleY={hRatio}
          strokeWidth={strokeWidth}
          d={d}
          fill="transparent"
          stroke={strokeColor || getColor('--primary')}
          strokeDasharray={length}
          // strokeLinecap='butt'
          strokeLinejoin="miter"
          strokeMiterlimit={0}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>
      <View
        className="z-10 items-center justify-center"
        style={[
          {
            top: strokeWidth,
            left: strokeWidth,
            right: strokeWidth,
            bottom: strokeWidth,
            position: 'absolute',
            borderRadius: radius - strokeWidth * 2,
          },
        ]}
      >
        <Text
          className={'font-semiBold text-foreground text-sm'}
          style={
            strokeColor
              ? {
                  color: strokeColor,
                }
              : {}
          }
        >
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  )
}
