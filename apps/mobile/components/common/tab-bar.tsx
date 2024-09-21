import { cn } from '@/lib/utils'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import * as Haptics from 'expo-haptics'
import { Link } from 'expo-router'
import {
  CogIcon,
  LandPlotIcon,
  type LucideIcon,
  PlusIcon,
  WalletIcon,
} from 'lucide-react-native'
import { rem } from 'nativewind'
import { Pressable, type PressableProps, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

type TabBarItemProps = {
  focused: boolean
  icon: LucideIcon
  descriptor: BottomTabBarProps['descriptors'][string]
}
function TabBarItem({
  icon: Icon,
  focused,
  descriptor,
  ...props
}: TabBarItemProps & PressableProps) {
  const { options } = descriptor
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      className={'h-12 w-12 items-center justify-center'}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      {...props}
    >
      <Icon
        className={cn(
          'size-6',
          focused ? 'text-primary-foreground' : 'text-muted-foreground',
        )}
      />
    </Pressable>
  )
}

function NewRecordButton() {
  return (
    <Link
      href="/transaction/new-record"
      asChild
      onPress={Haptics.selectionAsync}
    >
      <Button
        size="icon"
        className={cn(
          'h-12 w-12 items-center justify-center rounded-xl border border-primary/10 bg-muted active:bg-muted/75',
        )}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <PlusIcon className="size-6 text-foreground" />
      </Button>
    </Link>
  )
}

const TAB_BAR_ICONS = {
  index: WalletIcon,
  budgets: LandPlotIcon,
  settings: CogIcon,
}

const TAB_BAR_ITEM_WIDTH = (3 + 1) * rem.get()

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabIndicatorPosition = useSharedValue(state.index * TAB_BAR_ITEM_WIDTH)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPosition.value }],
  }))

  return (
    <View className="absolute bottom-9 flex-row items-center justify-center gap-3 self-center rounded-2xl border border-border bg-background p-2">
      <Animated.View
        style={[animatedStyle]}
        className="absolute left-2 h-12 w-12 rounded-xl bg-primary"
      />
      <View className="flex-row items-center gap-4">
        {state.routes.map((route, index) => {
          function onPress() {
            Haptics.selectionAsync()

            tabIndicatorPosition.value = withTiming(
              index * TAB_BAR_ITEM_WIDTH,
              {
                duration: 300,
              },
            )

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (state.index !== index && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          function onLongPress() {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            })
          }

          return (
            <TabBarItem
              key={route.key}
              icon={TAB_BAR_ICONS[route.name as keyof typeof TAB_BAR_ICONS]}
              focused={state.index === index}
              descriptor={descriptors[route.key]}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          )
        })}
      </View>
      <Separator orientation="vertical" className="h-8" />
      <NewRecordButton />
    </View>
  )
}
