import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { Pressable, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import { Text } from '../ui/text'

type MenuItemProps = {
  label: string
  icon?: React.ComponentType<SvgProps>
  rightSection?: React.ReactNode
  onPress?: () => void
  className?: string
}

export const MenuItem = forwardRef(function (
  { label, icon: Icon, rightSection, onPress, className }: MenuItemProps,
  ref: React.ForwardedRef<React.ElementRef<typeof Pressable>>,
) {
  return (
    <Pressable
      onPress={onPress}
      ref={ref}
      className={cn(
        "flex flex-row items-center gap-4 px-6 justify-between h-12 active:bg-muted",
        className,
      )}
    >
      <View className="flex flex-row items-center gap-6">
        {Icon && <Icon className="w-5 h-5 text-foreground" />}
        <Text>{label}</Text>
      </View>
      {rightSection}
    </Pressable>
  )
})
