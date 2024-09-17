import * as Slot from '@/components/primitives/slot'
import type { SlottableTextProps, TextRef } from '@/components/primitives/types'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { Text as RNText } from 'react-native'

const TextClassContext = React.createContext<string | undefined>(undefined)

const Text = React.forwardRef<TextRef, SlottableTextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext)
    const Component = asChild ? Slot.Text : RNText
    return (
      <Component
        className={cn(
          'font-regular text-base text-foreground',
          textClass,
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Text.displayName = 'Text'

export { Text, TextClassContext }
