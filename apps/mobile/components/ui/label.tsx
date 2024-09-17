import * as LabelPrimitive from '@/components/primitives/label'
import { cn } from '@/lib/utils'
import * as React from 'react'

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Text>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Text>
>(
  (
    { className, onPress, onLongPress, onPressIn, onPressOut, ...props },
    ref,
  ) => (
    <LabelPrimitive.Root
      className="web:cursor-default"
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <LabelPrimitive.Text
        ref={ref}
        className={cn(
          'font-medium native:text-base text-foreground text-sm leading-none web:peer-disabled:cursor-not-allowed web:peer-disabled:opacity-70',
          className,
        )}
        {...props}
      />
    </LabelPrimitive.Root>
  ),
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
