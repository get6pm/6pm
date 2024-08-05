import { Text, TextClassContext } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import * as DropdownMenuPrimitive from '@rn-primitives/dropdown-menu'
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from 'lucide-react-native'
import * as React from 'react'
import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => {
  const { open } = DropdownMenuPrimitive.useSubContext()
  const Icon =
    Platform.OS === 'web' ? ChevronRight : open ? ChevronUp : ChevronDown
  return (
    <TextClassContext.Provider
      value={cn(
        'select-none text-sm native:text-lg text-primary',
        open && 'native:text-accent-foreground',
      )}
    >
      <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
          'flex flex-row items-center gap-2 rounded-sm px-2 py-1.5 web:cursor-default web:select-none active:bg-accent web:focus:bg-accent web:hover:bg-accent native:py-2 web:outline-none',
          open && 'bg-accent',
          inset && 'pl-8',
          className,
        )}
        {...props}
      >
        {/* biome-ignore lint/complexity/noUselessFragments: <explanation> */}
        <>{children}</>
        <Icon size={18} className="ml-auto text-foreground" />
      </DropdownMenuPrimitive.SubTrigger>
    </TextClassContext.Provider>
  )
})
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const { open } = DropdownMenuPrimitive.useSubContext()
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-foreground/5 shadow-md',
        open
          ? 'web:fade-in-0 web:zoom-in-95 web:animate-in'
          : 'web:fade-out-0 web:zoom-out web:animate-out ',
        className,
      )}
      {...props}
    />
  )
})
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    overlayStyle?: StyleProp<ViewStyle>
    overlayClassName?: string
    portalHost?: string
  }
>(
  (
    { className, overlayClassName, overlayStyle, portalHost, ...props },
    ref,
  ) => {
    const { open } = DropdownMenuPrimitive.useRootContext()
    return (
      <DropdownMenuPrimitive.Portal hostName={portalHost}>
        <DropdownMenuPrimitive.Overlay
          style={
            overlayStyle
              ? StyleSheet.flatten([
                  Platform.OS !== 'web' ? StyleSheet.absoluteFill : undefined,
                  overlayStyle,
                ] as ViewStyle)
              : Platform.OS !== 'web'
                ? StyleSheet.absoluteFill
                : undefined
          }
          className={overlayClassName}
        >
          <DropdownMenuPrimitive.Content
            ref={ref}
            className={cn(
              'web:data-[side=bottom]:slide-in-from-top-2 web:data-[side=left]:slide-in-from-right-2 web:data-[side=right]:slide-in-from-left-2 web:data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-foreground/5 shadow-md',
              open
                ? 'web:fade-in-0 web:zoom-in-95 web:animate-in'
                : 'web:fade-out-0 web:zoom-out-95 web:animate-out',
              className,
            )}
            {...props}
          />
        </DropdownMenuPrimitive.Overlay>
      </DropdownMenuPrimitive.Portal>
    )
  },
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <TextClassContext.Provider value="select-none text-sm native:text-lg text-popover-foreground web:group-focus:text-accent-foreground">
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'group relative flex flex-row items-center gap-2 rounded-sm px-2 py-1.5 web:cursor-default active:bg-accent web:focus:bg-accent web:hover:bg-accent native:py-2 web:outline-none',
        inset && 'pl-8',
        props.disabled && 'opacity-50 web:pointer-events-none',
        className,
      )}
      {...props}
    />
  </TextClassContext.Provider>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'web:group relative flex flex-row items-center rounded-sm py-1.5 pr-2 pl-8 web:cursor-default active:bg-accent web:focus:bg-accent native:py-2 web:outline-none',
      props.disabled && 'opacity-50 web:pointer-events-none',
      className,
    )}
    checked={checked}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check size={14} strokeWidth={3} className="text-foreground" />
      </DropdownMenuPrimitive.ItemIndicator>
    </View>
    {/* biome-ignore lint/complexity/noUselessFragments: <explanation> */}
    <>{children}</>
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'web:group relative flex flex-row items-center rounded-sm py-1.5 pr-2 pl-8 web:cursor-default active:bg-accent web:focus:bg-accent native:py-2 web:outline-none',
      props.disabled && 'opacity-50 web:pointer-events-none',
      className,
    )}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <View className="h-2 w-2 rounded-full bg-foreground" />
      </DropdownMenuPrimitive.ItemIndicator>
    </View>
    {/* biome-ignore lint/complexity/noUselessFragments: <explanation> */}
    <>{children}</>
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 font-semibold text-foreground text-sm web:cursor-default native:text-base',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) => {
  return (
    <Text
      className={cn(
        'ml-auto text-muted-foreground text-xs tracking-widest native:text-sm',
        className,
      )}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
