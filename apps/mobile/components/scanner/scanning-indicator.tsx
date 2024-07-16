import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const duration = 5000

export function ScanningIndicator({
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Animated.View>, 'style'>) {
  const sv = useSharedValue(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    sv.value = withRepeat(
      withSequence(withTiming(1, { duration }), withTiming(0, { duration })),
      -1,
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    top: `${sv.value * 65 + 16}%`,
  }))

  return (
    <Animated.View
      style={[style]}
      className={cn('w-[80%] h-0.5 bg-background absolute', className)}
      {...props}
    />
  )
}
