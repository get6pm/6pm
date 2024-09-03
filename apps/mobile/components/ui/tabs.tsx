import * as TabsPrimitive from '@/components/primitives/tabs'
import { TextClassContext } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import * as React from 'react'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'web:inline-flex h-10 native:h-11 flex-row items-center justify-center rounded-md bg-muted p-1 native:px-1.5',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { value } = TabsPrimitive.useRootContext()
  return (
    <TextClassContext.Provider
      value={cn(
        'text-sm native:text-base font-medium text-muted-foreground web:transition-all',
        value === props.value && 'text-foreground dark:text-primary',
      )}
    >
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          'inline-flex flex-1 flex-row items-center justify-center gap-3 web:whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm shadow-none web:ring-offset-background web:transition-all web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
          props.disabled && 'web:pointer-events-none opacity-50',
          props.value === value &&
            'bg-background shadow-border shadow-sm dark:shadow-foreground/15',
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }
