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
  disabled?: boolean
}

export const MenuItem = forwardRef(function (
  {
    label,
    icon: Icon,
    rightSection,
    onPress,
    className,
    disabled,
  }: MenuItemProps,
  ref: React.ForwardedRef<React.ElementRef<typeof Pressable>>,
) {
  return (
    <Pressable
      onPress={onPress}
      ref={ref}
      disabled={disabled}
      className={cn(
        'flex h-14 flex-row items-center justify-between gap-4 px-6 active:bg-muted',
        disabled && 'opacity-50',
        className,
      )}
    >
      <View className="flex flex-row items-center gap-6">
        {Icon && <Icon className="h-5 w-5 text-foreground" />}
        <Text>{label}</Text>
      </View>
      {rightSection}
    </Pressable>
  )
})
