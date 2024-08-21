import { cn } from '@/lib/utils'
import * as SelectPrimitive from '@rn-primitives/select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native'
import * as React from 'react'
import { Keyboard, Platform, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

type Option = SelectPrimitive.Option

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    hideArrow?: boolean
  }
>(({ className, children, hideArrow, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 flex-row items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-muted-foreground text-sm [&>span]:line-clamp-1 native:h-11 web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 web:ring-offset-background',
      props.disabled && 'opacity-50 web:cursor-not-allowed',
      className,
    )}
    {...props}
    onPress={(e) => {
      Keyboard.dismiss()
      props.onPress?.(e)
    }}
  >
    {/* biome-ignore lint/complexity/noUselessFragments: <explanation> */}
    <>{children}</>
    {!hideArrow && (
      <ChevronDown
        size={16}
        aria-hidden={true}
        className="text-foreground opacity-50"
      />
    )}
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

/**
 * Platform: WEB ONLY
 */
const SelectScrollUpButton = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>) => {
  if (Platform.OS !== 'web') {
    return null
  }
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn(
        'flex items-center justify-center py-1 web:cursor-default',
        className,
      )}
      {...props}
    >
      <ChevronUp size={14} className="text-foreground" />
    </SelectPrimitive.ScrollUpButton>
  )
}

/**
 * Platform: WEB ONLY
 */
const SelectScrollDownButton = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>) => {
  if (Platform.OS !== 'web') {
    return null
  }
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn(
        'flex items-center justify-center py-1 web:cursor-default',
        className,
      )}
      {...props}
    >
      <ChevronDown size={14} className="text-foreground" />
    </SelectPrimitive.ScrollDownButton>
  )
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    portalHost?: string
  }
>(({ className, children, position = 'popper', portalHost, ...props }, ref) => {
  const { open } = SelectPrimitive.useRootContext()

  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <SelectPrimitive.Overlay
        style={Platform.OS !== 'web' ? StyleSheet.absoluteFill : undefined}
      >
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <SelectPrimitive.Content
            ref={ref}
            className={cn(
              'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] rounded-md border border-border bg-popover px-1 py-2 shadow-foreground/10 shadow-md',
              position === 'popper' &&
                'data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1',
              open
                ? 'web:zoom-in-95 web:fade-in-0 web:animate-in'
                : 'web:zoom-out-95 web:fade-out-0 web:animate-out',
              className,
            )}
            position={position}
            {...props}
          >
            <SelectScrollUpButton />
            <View>
              <SelectPrimitive.Viewport
                className={cn(
                  'p-1',
                  position === 'popper' &&
                    'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
                )}
              >
                {children}
              </SelectPrimitive.Viewport>
            </View>
            <SelectScrollDownButton />
          </SelectPrimitive.Content>
        </Animated.View>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-1.5 pr-2 pl-8 font-semibold text-popover-foreground text-sm native:pb-2 native:pl-10 native:text-base',
      className,
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    extra?: React.ReactNode
  }
>(({ className, children, extra, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'web:group relative flex w-full flex-row items-center rounded-sm py-1.5 pr-2 pl-8 web:cursor-default web:select-none active:bg-accent web:focus:bg-accent web:hover:bg-accent/50 native:py-2 native:pl-10 web:outline-none',
      props.disabled && 'opacity-50 web:pointer-events-none',
      className,
    )}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center native:left-3.5 native:pt-px">
      <SelectPrimitive.ItemIndicator>
        <Check size={16} strokeWidth={3} className="text-popover-foreground" />
      </SelectPrimitive.ItemIndicator>
    </View>
    <SelectPrimitive.ItemText className="font-sans text-popover-foreground text-sm native:text-base web:group-focus:text-accent-foreground" />
    {extra}
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-2 h-px bg-muted', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type Option,
}
