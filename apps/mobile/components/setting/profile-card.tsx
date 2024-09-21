import { useUser } from '@clerk/clerk-expo'
import { CrownIcon, PencilIcon } from 'lucide-react-native'
import { Dimensions, Pressable, TouchableOpacity, View } from 'react-native'

import { UserAvatar } from '../common/user-avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

import { useUserEntitlements } from '@/hooks/use-purchases'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link, useRouter } from 'expo-router'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const COLS = 15
const ROWS = 15
const { width } = Dimensions.get('window')
const circleBoxSize = width / COLS + 2
const dots = [...Array(ROWS).keys()].map((rowIndex) =>
  [...Array(COLS).keys()].map((colIndex) => ({
    key: rowIndex * COLS + colIndex,
    row: rowIndex,
    col: colIndex,
  })),
)

enum Distance {
  Manhattan = 'Manhattan',
  Euclidian = 'Euclidian',
  Chebyshev = 'Chebyshev',
}

function distanceAlgo(
  distance: Distance,
  X1: number = 0,
  Y1: number = 0,
  X2: number = 0,
  Y2: number = 0,
) {
  'worklet'
  const distanceX = X2 - X1
  const distanceY = Y2 - Y1
  if (distance === Distance.Manhattan) {
    return Math.abs(X1 - X2) + Math.abs(Y1 - Y2)
  }
  if (distance === Distance.Euclidian) {
    return Math.sqrt(distanceX * distanceX + distanceY * distanceY)
  }

  if (distance === Distance.Chebyshev) {
    return Math.max(Math.abs(X1 - X2), Math.abs(Y1 - Y2))
  }
}
const staggerDelay = 60
type DotProps = {
  dot: (typeof dots)[0][0]
  fromIndex: SharedValue<(typeof dots)[0][0]>
}

const Dot = ({ dot, fromIndex }: DotProps) => {
  const distance = useDerivedValue(() => {
    return (
      (distanceAlgo(
        Distance.Manhattan,
        fromIndex.value.col,
        fromIndex.value.row,
        dot.col,
        dot.row,
      ) || 0) * staggerDelay
    )
  })

  const dotStyle = useAnimatedStyle(() => {
    const scale = withDelay(
      distance.value,
      withSequence(
        withTiming(1, { duration: staggerDelay * 5 }),
        withTiming(0.3, { duration: staggerDelay * 3 }),
      ),
    )
    const color = withDelay(
      distance.value,
      withSequence(
        withTiming(1.0, { duration: staggerDelay * 3 }),
        withTiming(0.2, { duration: staggerDelay * 3 }),
      ),
    )
    return {
      opacity: color,
      transform: [
        {
          scale: scale,
        },
      ],
    }
  })

  return (
    <Animated.View
      style={[
        {
          margin: circleBoxSize / 2 - 5,
        },
        dotStyle,
      ]}
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
      removeClippedSubviews
      renderToHardwareTextureAndroid
    />
  )
}

export const DotsGrid = () => {
  const fromIndex = useSharedValue(
    dots[Math.round(ROWS / 2)][Math.round(COLS / 2)],
  )

  return (
    <View className="flex flex-1">
      {dots.map((row, rowIndex) => {
        return (
          <View className="flex-row" key={rowIndex.toString()}>
            {row.map((dot) => {
              return (
                <Pressable
                  key={dot.key.toString()}
                  onPress={() => {
                    fromIndex.value = dot
                  }}
                >
                  <Dot dot={dot} fromIndex={fromIndex} />
                </Pressable>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}

export function ProfileCard() {
  const { i18n } = useLingui()
  const { user } = useUser()
  const { isWealth, isGrowth, isPro } = useUserEntitlements()
  const router = useRouter()

  return (
    <View className="mx-6 flex-row items-center justify-center overflow-hidden rounded-lg">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/(app)/profile')}
        className="flex flex-1 flex-row items-center justify-center gap-3"
      >
        <UserAvatar
          user={user!}
          fallbackClassName="bg-background"
          className="h-16 w-16"
        />
        <View className="flex-1 justify-center gap-1.5">
          <Text className="line-clamp-1 font-semiBold">
            {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
          </Text>
          <Badge
            variant="default"
            className="flex-row gap-1 self-start rounded-md"
          >
            {isPro && <CrownIcon className="size-4 text-primary-foreground" />}
            <Text className="font-medium text-sm">
              {isWealth
                ? t(i18n)`Wealth`
                : isGrowth
                  ? t(i18n)`Growth`
                  : t(i18n)`Saver`}
            </Text>
          </Badge>
        </View>
      </TouchableOpacity>
      <Link href="/profile" asChild>
        <Button size="icon" variant="ghost">
          <PencilIcon className="h-5 w-5 text-foreground" />
        </Button>
      </Link>
    </View>
  )
}
