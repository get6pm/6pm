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

export function AnimatedRing({
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
        'w-16 h-16 bg-primary-foreground border-2 border-primary rounded-full',
        className,
      )}
      {...props}
    />
  )
}
