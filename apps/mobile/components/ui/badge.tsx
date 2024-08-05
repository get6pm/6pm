import * as Slot from '@/components/primitives/slot'
import type { SlottableViewProps } from '@/components/primitives/types'
import { TextClassContext } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import { View } from 'react-native'

const badgeVariants = cva(
  'items-center rounded-full border border-border px-2.5 py-0.5 web:inline-flex web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 web:transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary active:opacity-80 web:hover:opacity-80',
        secondary:
          'border-transparent bg-secondary active:opacity-80 web:hover:opacity-80',
        destructive:
          'border-transparent bg-destructive active:opacity-80 web:hover:opacity-80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const badgeTextVariants = cva('font-semibold text-xs ', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type BadgeProps = SlottableViewProps & VariantProps<typeof badgeVariants>

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot.View : View
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  )
}

export { Badge, badgeTextVariants, badgeVariants }
export type { BadgeProps }
