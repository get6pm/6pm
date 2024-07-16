import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const duration = 1000

export function ScanningOverlay({
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Animated.View>, 'style'>) {
  const sv = useSharedValue(1)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    sv.value = withRepeat(
      withSequence(withTiming(0, { duration }), withTiming(1, { duration })),
      -1,
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: sv.value,
  }))

  return (
    <Animated.View
      style={[style]}
      className={cn(
        'flex-1 bg-background/50 absolute top-0 left-0 bottom-0 right-0 pointer-events-none',
        className,
      )}
      {...props}
    />
  )
}
